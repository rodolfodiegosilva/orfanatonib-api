import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateShelterDto } from '../dto/create-shelter.dto';
import { UpdateShelterDto } from '../dto/update-shelter.dto';
import { QuerySheltersDto } from '../dto/query-shelters.dto';

import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';
import { AddressEntity } from 'src/modules/addresses/entities/address.entity/address.entity';
import { LeaderProfileEntity } from 'src/modules/leader-profiles/entities/leader-profile.entity/leader-profile.entity';
import { TeacherProfileEntity } from 'src/modules/teacher-profiles/entities/teacher-profile.entity/teacher-profile.entity';
import { ShelterSelectOptionDto, toShelterSelectOption } from '../dto/shelter-select-option.dto';

type RoleCtx = { role?: string; userId?: string | null };

@Injectable()
export class SheltersRepository {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ShelterEntity)
    private readonly shelterRepo: Repository<ShelterEntity>,

    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,

    @InjectRepository(LeaderProfileEntity)
    private readonly leaderRepo: Repository<LeaderProfileEntity>,

    @InjectRepository(TeacherProfileEntity)
    private readonly teacherProfileRepo: Repository<TeacherProfileEntity>,
  ) { }

  private buildShelterBaseQB(manager?: EntityManager): SelectQueryBuilder<ShelterEntity> {
    const repo = manager ? manager.getRepository(ShelterEntity) : this.shelterRepo;
    return repo
      .createQueryBuilder('shelter')
      .leftJoinAndSelect('shelter.address', 'address')
      .leftJoinAndSelect('shelter.leaders', 'leaders')
      .leftJoinAndSelect('shelter.teachers', 'teachers')
      .leftJoinAndSelect('leaders.user', 'leaderUser')
      .leftJoinAndSelect('teachers.user', 'teacherUser');
  }

  private applyRoleFilter(qb: SelectQueryBuilder<ShelterEntity>, ctx?: RoleCtx) {
    const role = ctx?.role?.toLowerCase();
    const userId = ctx?.userId;
    if (!role || role === 'admin' || !userId) return;

    if (role === 'leader') {
      qb.andWhere('leaderUser.id = :uid', { uid: userId }).distinct(true);
    } else if (role === 'teacher') {
      qb.andWhere('teacherUser.id = :uid', { uid: userId }).distinct(true);
    } else {
      qb.andWhere('1 = 0');
    }
  }

  async findAllPaginated(
    q: QuerySheltersDto,
    ctx?: RoleCtx,
  ): Promise<{ items: ShelterEntity[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sort = 'name',
      order = 'ASC',
      shelterName,
      staffFilters,
      addressFilter,
      shelterId, // Filtro legado
    } = q;

    const qb = this.buildShelterBaseQB().distinct(true);
    this.applyRoleFilter(qb, ctx);

    // 🏠 Filtro de nome do abrigo - busca em todos os campos relacionados ao nome
    if (shelterName?.trim()) {
      const like = `%${shelterName.trim()}%`;
      qb.andWhere(
        `(
          LOWER(shelter.name) LIKE LOWER(:shelterName)
        )`,
        { shelterName: like }
      );
    }

    // 👥 Filtros de staff - busca em todos os campos relacionados a líderes e professores
    if (staffFilters?.trim()) {
      const like = `%${staffFilters.trim()}%`;
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM shelter_leaders sl
          JOIN leader_profiles lp ON lp.id = sl.leader_profile_id
          JOIN users lu ON lu.id = lp.user_id
          WHERE sl.shelter_id = shelter.id
            AND (
              LOWER(lu.name) LIKE LOWER(:staffFilters) OR
              LOWER(lu.email) LIKE LOWER(:staffFilters) OR
              lu.phone LIKE :staffFiltersRaw
            )
        ) OR EXISTS (
          SELECT 1 FROM teacher_profiles tp
          JOIN users tu ON tu.id = tp.user_id
          WHERE tp.shelter_id = shelter.id
            AND (
              LOWER(tu.name) LIKE LOWER(:staffFilters) OR
              LOWER(tu.email) LIKE LOWER(:staffFilters) OR
              tu.phone LIKE :staffFiltersRaw
            )
        )`,
        { staffFilters: like, staffFiltersRaw: `%${staffFilters.trim()}%` }
      );
    }

    // 🏙️ Filtro de endereço - busca em todos os campos relacionados ao endereço
    if (addressFilter?.trim()) {
      const like = `%${addressFilter.trim()}%`;
      qb.andWhere(
        `(
          LOWER(address.street) LIKE LOWER(:addressFilter) OR
          LOWER(address.number) LIKE LOWER(:addressFilter) OR
          LOWER(address.district) LIKE LOWER(:addressFilter) OR
          LOWER(address.city) LIKE LOWER(:addressFilter) OR
          LOWER(address.state) LIKE LOWER(:addressFilter) OR
          address.postalCode LIKE :addressFilterRaw OR
          LOWER(address.complement) LIKE LOWER(:addressFilter)
        )`,
        { addressFilter: like, addressFilterRaw: `%${addressFilter.trim()}%` }
      );
    }

    // Filtro legado
    if (shelterId) {
      qb.andWhere('shelter.id = :shelterId', { shelterId });
    }

    // Ordenação
    const sortMap: Record<string, string> = {
      name: 'shelter.name',
      createdAt: 'shelter.createdAt',
      updatedAt: 'shelter.updatedAt',
      city: 'address.city',
      state: 'address.state',
    };
    
    const orderBy = sortMap[sort] ?? 'shelter.name';
    const orderDir = (order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    qb.orderBy(orderBy, orderDir as 'ASC' | 'DESC');

    // Paginação
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findAllSimple(ctx?: RoleCtx): Promise<ShelterEntity[]> {
    const qb = this.buildShelterBaseQB()
      .select([
        'shelter.id',
        'shelter.name',
        'address.id',
        'address.city',
        'address.state',
      ])
      .orderBy('shelter.name', 'ASC');

    this.applyRoleFilter(qb, ctx);

    return qb.getMany();
  }

  async findOneOrFailForResponse(id: string, ctx?: RoleCtx): Promise<ShelterEntity | null> {
    const qb = this.buildShelterBaseQB()
      .where('shelter.id = :id', { id })
      .orderBy('shelter.name', 'ASC')
      .addOrderBy('teachers.createdAt', 'ASC');
    this.applyRoleFilter(qb, ctx);

    return qb.getOne();
  }

  private async findOneOrFailForResponseTx(
    manager: EntityManager,
    id: string,
  ): Promise<ShelterEntity> {
    const qb = this.buildShelterBaseQB(manager)
      .where('shelter.id = :id', { id })
      .orderBy('shelter.name', 'ASC')
      .addOrderBy('teachers.createdAt', 'ASC');

    const shelter = await qb.getOne();
    if (!shelter) throw new NotFoundException('Shelter não encontrado');
    return shelter;
  }

  async list(ctx?: RoleCtx): Promise<ShelterSelectOptionDto[]> {
    const qb = this.buildShelterBaseQB().orderBy('shelter.name', 'ASC');
    this.applyRoleFilter(qb, ctx);
    const items = await qb.getMany();
    return items.map(toShelterSelectOption);
  }

  async createShelter(dto: CreateShelterDto): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const addressRepo = manager.withRepository(this.addressRepo);
      const leaderRepo = manager.withRepository(this.leaderRepo);
      const teacherRepo = manager.withRepository(this.teacherProfileRepo);
      
      const address = addressRepo.create(dto.address);
      await addressRepo.save(address);

      let leaders: LeaderProfileEntity[] = [];
      if (dto.leaderProfileIds?.length) {
        leaders = await leaderRepo.find({
          where: { id: In(dto.leaderProfileIds) },
        });
        if (leaders.length !== dto.leaderProfileIds.length) {
          const found = new Set(leaders.map((l) => l.id));
          const missing = dto.leaderProfileIds.filter((id) => !found.has(id));
          throw new NotFoundException(
            `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
          );
        }
      }

      const shelter = shelterRepo.create({
        name: dto.name,
        address,
        leaders,
      });

      try {
        await shelterRepo.save(shelter);
      } catch (e: any) {
        if (e?.code === 'ER_DUP_ENTRY' || e?.code === '23505') {
          throw new ConflictException('Já existe um Shelter com esse nome');
        }
        throw e;
      }

      if (dto.teacherProfileIds?.length) {
        const ids = Array.from(new Set(dto.teacherProfileIds));
        const teachers = await teacherRepo.find({
          where: { id: In(ids) },
          relations: { shelter: true },
        });

        if (teachers.length !== ids.length) {
          const found = new Set(teachers.map((t) => t.id));
          const missing = ids.filter((id) => !found.has(id));
          throw new NotFoundException(
            `TeacherProfile(s) não encontrado(s): ${missing.join(', ')}`,
          );
        }

        const alreadyAssigned = teachers.filter((t) => !!t.shelter);
        if (alreadyAssigned.length) {
          throw new BadRequestException(
            `Alguns TeacherProfiles já estão vinculados a outro Shelter: ${alreadyAssigned
              .map((t) => t.id)
              .join(', ')}`,
          );
        }

        await teacherRepo.update({ id: In(ids) }, { shelter: { id: shelter.id } as any });
      }
      return this.findOneOrFailForResponseTx(manager, shelter.id);
    });
  }

  async updateShelter(id: string, dto: UpdateShelterDto): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const addressRepo = manager.withRepository(this.addressRepo);
      const leaderRepo = manager.withRepository(this.leaderRepo);
      const teacherRepo = manager.withRepository(this.teacherProfileRepo);

      const shelter = await shelterRepo.findOne({
        where: { id },
        relations: { address: true, leaders: true, teachers: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (dto.name !== undefined) shelter.name = dto.name as any;

      if (dto.address) {
        if (shelter.address) {
          Object.assign(shelter.address, dto.address);
          await addressRepo.save(shelter.address);
        } else {
          const newAddress = addressRepo.create(dto.address);
          await addressRepo.save(newAddress);
          shelter.address = newAddress;
        }
      }

      if (dto.leaderProfileIds !== undefined) {
        if (dto.leaderProfileIds.length === 0) {
          shelter.leaders = [];
        } else {
          const leaders = await leaderRepo.find({
            where: { id: In(dto.leaderProfileIds) },
          });
          if (leaders.length !== dto.leaderProfileIds.length) {
            const found = new Set(leaders.map((l) => l.id));
            const missing = dto.leaderProfileIds.filter((id) => !found.has(id));
            throw new NotFoundException(
              `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
            );
          }
          shelter.leaders = leaders;
        }
      }

      await shelterRepo.save(shelter);

      if (dto.teacherProfileIds !== undefined) {
        await this.syncTeachersForShelterTx(teacherRepo, shelter.id, dto.teacherProfileIds);
      }

      return this.findOneOrFailForResponseTx(manager, shelter.id);
    });
  }

  private async syncTeachersForShelterTx(
    txTeacherRepo: Repository<TeacherProfileEntity>,
    shelterId: string,
    teacherProfileIds: string[],
  ): Promise<void> {
    const current = await txTeacherRepo.find({
      where: { shelter: { id: shelterId } },
      select: { id: true },
    });
    const currentIds = new Set(current.map((t) => t.id));
    const targetIds = new Set(teacherProfileIds);

    const toAttach = [...targetIds].filter((id) => !currentIds.has(id));
    const toDetach = [...currentIds].filter((id) => !targetIds.has(id));

    const attachProfiles = toAttach.length
      ? await txTeacherRepo.find({
        where: { id: In(toAttach) },
        relations: { shelter: true },
      })
      : [];

    if (attachProfiles.length !== toAttach.length) {
      const found = new Set(attachProfiles.map((p) => p.id));
      const missing = toAttach.filter((id) => !found.has(id));
      throw new NotFoundException(
        `TeacherProfile(s) não encontrado(s): ${missing.join(', ')}`,
      );
    }

    const attachedElsewhere = attachProfiles.filter(
      (p) => p.shelter && p.shelter.id !== shelterId,
    );
    if (attachedElsewhere.length) {
      throw new BadRequestException(
        `Alguns TeacherProfiles já estão vinculados a outro Shelter: ${attachedElsewhere
          .map((t) => t.id)
          .join(', ')}`,
      );
    }

    if (attachProfiles.length) {
      await txTeacherRepo.update(
        { id: In(attachProfiles.map((p) => p.id)) },
        { shelter: { id: shelterId } as any },
      );
    }

    if (toDetach.length) {
      await txTeacherRepo.update({ id: In(toDetach) }, { shelter: null as any });
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const txShelter = manager.withRepository(this.shelterRepo);
      const txTeacher = manager.withRepository(this.teacherProfileRepo);
      const txAddress = manager.withRepository(this.addressRepo);

      const shelter = await txShelter.findOne({
        where: { id },
        relations: { teachers: true, leaders: true, address: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (shelter.teachers?.length) {
        await txTeacher.update(
          { id: In(shelter.teachers.map((t) => t.id)) },
          { shelter: null as any },
        );
      }

      if (shelter.leaders?.length) {
        // Remover relacionamentos ManyToMany
        await txShelter
          .createQueryBuilder()
          .relation(ShelterEntity, 'leaders')
          .of(shelter.id)
          .remove(shelter.leaders.map(l => l.id));
      }

      const addressId = shelter.address?.id;

      await txShelter.delete(shelter.id);

      if (addressId) {
        await txAddress.delete(addressId);
      }
    });
  }

  async assignTeachers(shelterId: string, teacherIds: string[]): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const teacherRepo = manager.withRepository(this.teacherProfileRepo);

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { teachers: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      const teachers = await teacherRepo.find({
        where: { id: In(teacherIds) },
        relations: { shelter: true },
      });

      const foundIds = new Set(teachers.map((t) => t.id));
      const missing = teacherIds.filter((id) => !foundIds.has(id));
      if (missing.length) {
        throw new NotFoundException(`Teachers não encontrados: ${missing.join(', ')}`);
      }

      const alreadyAssigned = teachers.filter((t) => !!t.shelter);
      if (alreadyAssigned.length) {
        throw new BadRequestException(
          `Alguns teachers já estão atribuídos a um shelter: ${alreadyAssigned
            .map((t) => t.user?.name)
            .join(', ')}`,
        );
      }

      await teacherRepo.update({ id: In(teacherIds) }, { shelter: { id: shelter.id } as any });
      
      return this.findOneOrFailForResponseTx(manager, shelterId);
    });
  }

  async unassignTeachers(
    shelterId: string,
    teacherIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const shelterRepo = manager ? manager.withRepository(this.shelterRepo) : this.shelterRepo;
    const teacherRepo = manager
      ? manager.withRepository(this.teacherProfileRepo)
      : this.teacherProfileRepo;

    const shelter = await shelterRepo.findOne({ where: { id: shelterId } });
    if (!shelter) throw new NotFoundException('Shelter não encontrado');

    const teachers = await teacherRepo.find({
      where: { id: In(teacherIds), shelter: { id: shelterId } },
      relations: { shelter: true },
    });

    const foundIds = new Set(teachers.map((t) => t.id));
    const missing = teacherIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundException(`Teachers não encontrados no shelter: ${missing.join(', ')}`);
    }

    await teacherRepo.update({ id: In(teacherIds) }, { shelter: null as any });
  }

  async moveTeachers(
    fromShelterId: string,
    toShelterId: string,
    teacherIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const shelterRepo = manager ? manager.withRepository(this.shelterRepo) : this.shelterRepo;
    const teacherRepo = manager
      ? manager.withRepository(this.teacherProfileRepo)
      : this.teacherProfileRepo;

    const [fromShelter, toShelter] = await Promise.all([
      shelterRepo.findOne({ where: { id: fromShelterId } }),
      shelterRepo.findOne({ where: { id: toShelterId } }),
    ]);

    if (!fromShelter) throw new NotFoundException('Shelter de origem não encontrado');
    if (!toShelter) throw new NotFoundException('Shelter de destino não encontrado');

    const teachers = await teacherRepo.find({
      where: { id: In(teacherIds), shelter: { id: fromShelterId } },
      relations: { shelter: true },
    });

    const foundIds = new Set(teachers.map((t) => t.id));
    const missing = teacherIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundException(`Teachers não encontrados no shelter de origem: ${missing.join(', ')}`);
    }

    await teacherRepo.update({ id: In(teacherIds) }, { shelter: { id: toShelter.id } as any });
  }

  async userHasAccessToShelter(shelterId: string, ctx?: RoleCtx): Promise<boolean> {
    const role = ctx?.role?.toLowerCase();
    const userId = ctx?.userId;
    if (!role || role === 'admin') return true;
    if (!userId) return false;

    if (role !== 'leader') return false;

    const qb = this.shelterRepo
      .createQueryBuilder('shelter')
      .leftJoin('shelter.leaders', 'leaders')
      .leftJoin('leaders.user', 'leaderUser')
      .where('shelter.id = :shelterId', { shelterId })
      .andWhere('leaderUser.id = :uid', { uid: userId });

    const hasGetExists = typeof (qb as any).getExists === 'function';
    return hasGetExists ? !!(await (qb as any).getExists()) : (await qb.getCount()) > 0;
  }

  async getLeaderProfileIdByUserId(userId: string): Promise<string | null> {
    const leader = await this.leaderRepo.findOne({
      where: { user: { id: userId } as any },
      select: { id: true },
    });
    return leader?.id ?? null;
  }

  async assignLeaders(shelterId: string, leaderIds: string[]): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const leaderRepo = manager.withRepository(this.leaderRepo);

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { leaders: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      const leaders = await leaderRepo.find({
        where: { id: In(leaderIds) },
      });

      if (leaders.length !== leaderIds.length) {
        const found = new Set(leaders.map((l) => l.id));
        const missing = leaderIds.filter((id) => !found.has(id));
        throw new NotFoundException(
          `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
        );
      }

      // Adicionar novos líderes sem remover os existentes
      const currentLeaderIds = new Set(shelter.leaders.map(l => l.id));
      const newLeaders = leaders.filter(l => !currentLeaderIds.has(l.id));
      
      if (newLeaders.length > 0) {
        shelter.leaders = [...shelter.leaders, ...newLeaders];
        await shelterRepo.save(shelter);
      }

      return this.findOneOrFailForResponseTx(manager, shelterId);
    });
  }

  async removeLeaders(shelterId: string, leaderIds: string[]): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { leaders: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // Remover líderes específicos
      shelter.leaders = shelter.leaders.filter(l => !leaderIds.includes(l.id));
      await shelterRepo.save(shelter);

      return this.findOneOrFailForResponseTx(manager, shelterId);
    });
  }

  async removeTeachers(shelterId: string, teacherIds: string[]): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const teacherRepo = manager.withRepository(this.teacherProfileRepo);

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { teachers: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // Remover professores específicos
      await teacherRepo.update(
        { id: In(teacherIds), shelter: { id: shelterId } as any },
        { shelter: null as any }
      );

      return this.findOneOrFailForResponseTx(manager, shelterId);
    });
  }
}