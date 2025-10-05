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
import { UserEntity } from 'src/user/user.entity';
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
      searchString, // Compatibilidade frontend
      nameSearchString, // Compatibilidade frontend
      leaderId, // Filtro específico por líder
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
          SELECT 1 FROM leader_profiles lp
          JOIN users lu ON lu.id = lp.user_id
          WHERE lp.shelter_id = shelter.id
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

    // 🔍 Compatibilidade com frontend - mapear parâmetros antigos para novos
    // Se nameSearchString foi enviado mas shelterName não, usar nameSearchString
    if (nameSearchString?.trim() && !shelterName?.trim()) {
      const like = `%${nameSearchString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(shelter.name) LIKE LOWER(:nameSearchString)
        )`,
        { nameSearchString: like }
      );
    }

    // Se searchString foi enviado mas staffFilters não, usar searchString
    if (searchString?.trim() && !staffFilters?.trim()) {
      const like = `%${searchString.trim()}%`;
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM leader_profiles lp
          JOIN users lu ON lu.id = lp.user_id
          WHERE lp.shelter_id = shelter.id
            AND (
              LOWER(lu.name) LIKE LOWER(:searchString) OR
              LOWER(lu.email) LIKE LOWER(:searchString) OR
              lu.phone LIKE :searchStringRaw
            )
        ) OR EXISTS (
          SELECT 1 FROM teacher_profiles tp
          JOIN users tu ON tu.id = tp.user_id
          WHERE tp.shelter_id = shelter.id
            AND (
              LOWER(tu.name) LIKE LOWER(:searchString) OR
              LOWER(tu.email) LIKE LOWER(:searchString) OR
              tu.phone LIKE :searchStringRaw
            )
        )`,
        { searchString: like, searchStringRaw: `%${searchString.trim()}%` }
      );
    }

    // Filtro específico por líder
    if (leaderId?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM leader_profiles lp
          WHERE lp.shelter_id = shelter.id
            AND lp.user_id = :leaderId
        )`,
        { leaderId }
      );
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
    // Usar SQL raw para garantir que vemos os dados atualizados
    const shelterData = await manager.query(`
      SELECT s.id, s.name, s.createdAt, s.updatedAt, s.address_id,
             a.id as address_id, a.street, a.number, a.district, a.city, a.state, a.postalCode, a.complement, a.createdAt as address_createdAt, a.updatedAt as address_updatedAt
      FROM shelters s
      LEFT JOIN addresses a ON a.id = s.address_id
      WHERE s.id = ?
    `, [id]);

    if (!shelterData.length) {
      throw new NotFoundException('Shelter não encontrado');
    }

    const shelter = shelterData[0];
    
    // Buscar líderes usando SQL raw
    const leadersData = await manager.query(`
      SELECT lp.id, lp.active, lp.createdAt, lp.updatedAt, lp.user_id, lp.shelter_id,
             u.id as user_id, u.name, u.email, u.phone, u.active as user_active, u.completed, u.commonUser, u.role
      FROM leader_profiles lp
      JOIN users u ON u.id = lp.user_id
      WHERE lp.shelter_id = ?
    `, [id]);

    // Buscar professores usando SQL raw
    const teachersData = await manager.query(`
      SELECT tp.id, tp.active, tp.createdAt, tp.updatedAt, tp.user_id, tp.shelter_id,
             u.id as user_id, u.name, u.email, u.phone, u.active as user_active, u.completed, u.commonUser, u.role
      FROM teacher_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.shelter_id = ?
    `, [id]);

    // Construir o objeto ShelterEntity manualmente
    const shelterEntity = new ShelterEntity();
    shelterEntity.id = shelter.id;
    shelterEntity.name = shelter.name;
    shelterEntity.createdAt = shelter.createdAt;
    shelterEntity.updatedAt = shelter.updatedAt;

    // Construir o endereço
    if (shelter.address_id) {
      const addressEntity = new AddressEntity();
      addressEntity.id = shelter.address_id;
      addressEntity.street = shelter.street;
      addressEntity.number = shelter.number;
      addressEntity.district = shelter.district;
      addressEntity.city = shelter.city;
      addressEntity.state = shelter.state;
      addressEntity.postalCode = shelter.postalCode;
      addressEntity.complement = shelter.complement;
      addressEntity.createdAt = shelter.address_createdAt;
      addressEntity.updatedAt = shelter.address_updatedAt;
      shelterEntity.address = addressEntity;
    }

    // Construir os líderes
    shelterEntity.leaders = leadersData.map(leaderData => {
      const leaderEntity = new LeaderProfileEntity();
      leaderEntity.id = leaderData.id;
      leaderEntity.active = leaderData.active;
      leaderEntity.createdAt = leaderData.createdAt;
      leaderEntity.updatedAt = leaderData.updatedAt;

      const userEntity = new UserEntity();
      userEntity.id = leaderData.user_id;
      userEntity.name = leaderData.name;
      userEntity.email = leaderData.email;
      userEntity.phone = leaderData.phone;
      userEntity.active = leaderData.user_active;
      userEntity.completed = leaderData.completed;
      userEntity.commonUser = leaderData.commonUser;
      userEntity.role = leaderData.role;

      leaderEntity.user = userEntity;
      return leaderEntity;
    });

    // Construir os professores
    shelterEntity.teachers = teachersData.map(teacherData => {
      const teacherEntity = new TeacherProfileEntity();
      teacherEntity.id = teacherData.id;
      teacherEntity.active = teacherData.active;
      teacherEntity.createdAt = teacherData.createdAt;
      teacherEntity.updatedAt = teacherData.updatedAt;

      const userEntity = new UserEntity();
      userEntity.id = teacherData.user_id;
      userEntity.name = teacherData.name;
      userEntity.email = teacherData.email;
      userEntity.phone = teacherData.phone;
      userEntity.active = teacherData.user_active;
      userEntity.completed = teacherData.completed;
      userEntity.commonUser = teacherData.commonUser;
      userEntity.role = teacherData.role;

      teacherEntity.user = userEntity;
      return teacherEntity;
    });

    return shelterEntity;
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

      const shelter = shelterRepo.create({
        name: dto.name,
        address,
      });

      try {
        await shelterRepo.save(shelter);
      } catch (e: any) {
        if (e?.code === 'ER_DUP_ENTRY' || e?.code === '23505') {
          throw new ConflictException('Já existe um Shelter com esse nome');
        }
        throw e;
      }

      // Atualizar líderes para associar ao shelter
      if (dto.leaderProfileIds?.length) {
        const ids = Array.from(new Set(dto.leaderProfileIds));
        const leaders = await leaderRepo.find({
          where: { id: In(ids) },
          relations: { shelter: true },
        });

        if (leaders.length !== ids.length) {
          const found = new Set(leaders.map((l) => l.id));
          const missing = ids.filter((id) => !found.has(id));
          throw new NotFoundException(
            `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
          );
        }

        const alreadyAssigned = leaders.filter((l) => !!l.shelter);
        if (alreadyAssigned.length) {
          throw new BadRequestException(
            `Alguns LeaderProfiles já estão vinculados a outro Shelter: ${alreadyAssigned
              .map((l) => l.id)
              .join(', ')}`,
          );
        }

        await leaderRepo.update({ id: In(ids) }, { shelter: { id: shelter.id } as any });
      }

      // Atualizar professores para associar ao shelter
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
    // Primeiro, fazer o update dos líderes fora da transação para evitar problemas de cache
    if (dto.leaderProfileIds !== undefined) {
      await this.syncLeadersForShelterDirect(id, dto.leaderProfileIds);
    }

    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const addressRepo = manager.withRepository(this.addressRepo);
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

  private async syncLeadersForShelterDirect(
    shelterId: string,
    leaderProfileIds: string[],
  ): Promise<void> {
    // Usar SQL raw direto para evitar problemas de transação e cache
    const current = await this.leaderRepo.find({
      where: { shelter: { id: shelterId } },
      select: { id: true },
    });
    
    const currentIds = new Set(current.map((l) => l.id));
    const targetIds = new Set(leaderProfileIds);

    const toAttach = [...targetIds].filter((id) => !currentIds.has(id));
    const toDetach = [...currentIds].filter((id) => !targetIds.has(id));

    // Verificar se os líderes existem
    if (toAttach.length > 0) {
      const existingLeaders = await this.leaderRepo.find({
        where: { id: In(toAttach) },
        relations: { shelter: true },
      });

      if (existingLeaders.length !== toAttach.length) {
        const found = new Set(existingLeaders.map((p) => p.id));
        const missing = toAttach.filter((id) => !found.has(id));
        throw new NotFoundException(
          `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
        );
      }

      const attachedElsewhere = existingLeaders.filter(
        (p) => p.shelter && p.shelter.id !== shelterId,
      );
      
      if (attachedElsewhere.length) {
        throw new BadRequestException(
          `Alguns LeaderProfiles já estão vinculados a outro Shelter: ${attachedElsewhere
            .map((l) => l.id)
            .join(', ')}`,
        );
      }

      // Usar SQL raw para garantir que o update funcione
      const placeholders = toAttach.map(() => '?').join(',');
      const updateSql = `UPDATE leader_profiles SET shelter_id = ? WHERE id IN (${placeholders})`;
      const updateParams = [shelterId, ...toAttach];
      
      await this.leaderRepo.query(updateSql, updateParams);
    }

    if (toDetach.length) {
      await this.leaderRepo.update({ id: In(toDetach) }, { shelter: null as any });
    }
  }

  private async syncLeadersForShelterTx(
    txLeaderRepo: Repository<LeaderProfileEntity>,
    shelterId: string,
    leaderProfileIds: string[],
  ): Promise<void> {
    const current = await txLeaderRepo.find({
      where: { shelter: { id: shelterId } },
      select: { id: true },
    });
    
    const currentIds = new Set(current.map((l) => l.id));
    const targetIds = new Set(leaderProfileIds);

    const toAttach = [...targetIds].filter((id) => !currentIds.has(id));
    const toDetach = [...currentIds].filter((id) => !targetIds.has(id));

    const attachProfiles = toAttach.length
      ? await txLeaderRepo.find({
        where: { id: In(toAttach) },
        relations: { shelter: true },
      })
      : [];

    if (attachProfiles.length !== toAttach.length) {
      const found = new Set(attachProfiles.map((p) => p.id));
      const missing = toAttach.filter((id) => !found.has(id));
      throw new NotFoundException(
        `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
      );
    }

    const attachedElsewhere = attachProfiles.filter(
      (p) => p.shelter && p.shelter.id !== shelterId,
    );
    
    if (attachedElsewhere.length) {
      throw new BadRequestException(
        `Alguns LeaderProfiles já estão vinculados a outro Shelter: ${attachedElsewhere
          .map((l) => l.id)
          .join(', ')}`,
      );
    }

    if (attachProfiles.length) {
      // Usar SQL raw para garantir que o update funcione
      const leaderIds = attachProfiles.map(p => p.id);
      const placeholders = leaderIds.map(() => '?').join(',');
      const updateSql = `UPDATE leader_profiles SET shelter_id = ? WHERE id IN (${placeholders})`;
      const updateParams = [shelterId, ...leaderIds];
      
      await txLeaderRepo.query(updateSql, updateParams);
    }

    if (toDetach.length) {
      await txLeaderRepo.update({ id: In(toDetach) }, { shelter: null as any });
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const txShelter = manager.withRepository(this.shelterRepo);
      const txTeacher = manager.withRepository(this.teacherProfileRepo);
      const txLeader = manager.withRepository(this.leaderRepo);
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
        await txLeader.update(
          { id: In(shelter.leaders.map((l) => l.id)) },
          { shelter: null as any },
        );
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
      const leaderRepo = manager.withRepository(this.leaderRepo);

      const leaders = await leaderRepo.find({
        where: { id: In(leaderIds) },
        relations: { shelter: true },
      });

      if (leaders.length !== leaderIds.length) {
        const found = new Set(leaders.map((l) => l.id));
        const missing = leaderIds.filter((id) => !found.has(id));
        throw new NotFoundException(
          `LeaderProfile(s) não encontrado(s): ${missing.join(', ')}`,
        );
      }

      const alreadyAssigned = leaders.filter((l) => !!l.shelter);
      if (alreadyAssigned.length) {
        throw new BadRequestException(
          `Alguns LeaderProfiles já estão vinculados a outro Shelter: ${alreadyAssigned
            .map((l) => l.id)
            .join(', ')}`,
        );
      }

      await leaderRepo.update(
        { id: In(leaderIds) },
        { shelter: { id: shelterId } as any },
      );

      return this.findOneOrFailForResponseTx(manager, shelterId);
    });
  }

  async removeLeaders(shelterId: string, leaderIds: string[]): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const leaderRepo = manager.withRepository(this.leaderRepo);

      await leaderRepo.update(
        { id: In(leaderIds), shelter: { id: shelterId } as any },
        { shelter: null as any },
      );

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