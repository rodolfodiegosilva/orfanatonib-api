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
import { TeamEntity } from 'src/modules/teams/entities/team.entity';
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
      .leftJoinAndSelect('shelter.teams', 'teams')
      .leftJoinAndSelect('teams.leaders', 'leaders')
      .leftJoinAndSelect('teams.teachers', 'teachers')
      .leftJoin('leaders.user', 'leaderUser')
      .addSelect([
        'leaderUser.id',
        'leaderUser.name',
        'leaderUser.email',
        'leaderUser.phone',
        'leaderUser.active',
        'leaderUser.completed',
        'leaderUser.commonUser',
      ])
      .leftJoin('teachers.user', 'teacherUser')
      .addSelect([
        'teacherUser.id',
        'teacherUser.name',
        'teacherUser.email',
        'teacherUser.phone',
        'teacherUser.active',
        'teacherUser.completed',
        'teacherUser.commonUser',
      ]);
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
      searchString,
      shelterName,
    } = q;

    const qb = this.buildShelterBaseQB().distinct(true);
    this.applyRoleFilter(qb, ctx);

    // 🔍 Filtro específico por nome do abrigo (tem prioridade sobre searchString)
    if (shelterName?.trim()) {
      const like = `%${shelterName.trim()}%`;
      qb.andWhere('LOWER(shelter.name) LIKE LOWER(:shelterName)', { shelterName: like });
    } else if (searchString?.trim()) {
      // 🔍 Busca unificada: nome do abrigo, cidade, UF, bairro, nome de professores ou líderes
      const like = `%${searchString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(shelter.name) LIKE LOWER(:searchString) OR
          LOWER(address.city) LIKE LOWER(:searchString) OR
          LOWER(address.state) LIKE LOWER(:searchString) OR
          LOWER(address.district) LIKE LOWER(:searchString) OR
          EXISTS (
            SELECT 1 FROM teams t
            JOIN leader_profiles lp ON lp.team_id = t.id
          JOIN users lu ON lu.id = lp.user_id
            WHERE t.shelter_id = shelter.id
              AND LOWER(lu.name) LIKE LOWER(:searchString)
        ) OR EXISTS (
            SELECT 1 FROM teams t
            JOIN teacher_profiles tp ON tp.team_id = t.id
          JOIN users tu ON tu.id = tp.user_id
            WHERE t.shelter_id = shelter.id
              AND LOWER(tu.name) LIKE LOWER(:searchString)
          )
        )`,
        { searchString: like }
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
    qb.orderBy(orderBy, orderDir as 'ASC' | 'DESC')
      .addOrderBy('teams.numberTeam', 'ASC');

    // Paginação
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findAllSimple(ctx?: RoleCtx): Promise<ShelterEntity[]> {
    const qb = this.buildShelterBaseQB()
      .orderBy('shelter.name', 'ASC')
      .addOrderBy('teams.numberTeam', 'ASC');

    this.applyRoleFilter(qb, ctx);

    return qb.getMany();
  }

  async findOneOrFailForResponse(id: string, ctx?: RoleCtx): Promise<ShelterEntity | null> {
    const qb = this.buildShelterBaseQB()
      .where('shelter.id = :id', { id })
      .orderBy('shelter.name', 'ASC')
      .addOrderBy('teams.numberTeam', 'ASC')
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
      SELECT s.id, s.name, s.description, s.teamsQuantity, s.createdAt, s.updatedAt, s.address_id,
             a.id as address_id, a.street, a.number, a.district, a.city, a.state, a.postalCode, a.complement, a.createdAt as address_createdAt, a.updatedAt as address_updatedAt
      FROM shelters s
      LEFT JOIN addresses a ON a.id = s.address_id
      WHERE s.id = ?
    `, [id]);

    if (!shelterData.length) {
      throw new NotFoundException('Shelter não encontrado');
    }

    const shelter = shelterData[0];
    
    // Buscar teams do abrigo
    const teamsData = await manager.query(`
      SELECT t.id, t.numberTeam, t.description, t.createdAt, t.updatedAt
      FROM teams t
      WHERE t.shelter_id = ?
      ORDER BY t.numberTeam ASC
    `, [id]);

    // Buscar líderes através de teams usando SQL raw
    const leadersData = await manager.query(`
      SELECT lp.id, lp.active, lp.createdAt, lp.updatedAt, lp.user_id, lp.team_id,
             u.id as user_id, u.name, u.email, u.phone, u.active as user_active, u.completed, u.commonUser, u.role,
             t.id as team_id, t.numberTeam as team_numberTeam
      FROM leader_profiles lp
      JOIN users u ON u.id = lp.user_id
      JOIN teams t ON t.id = lp.team_id
      WHERE t.shelter_id = ?
    `, [id]);

    // Buscar professores através de teams usando SQL raw
    const teachersData = await manager.query(`
      SELECT tp.id, tp.active, tp.createdAt, tp.updatedAt, tp.user_id, tp.team_id,
             u.id as user_id, u.name, u.email, u.phone, u.active as user_active, u.completed, u.commonUser, u.role,
             t.id as team_id, t.numberTeam as team_numberTeam
      FROM teacher_profiles tp
      JOIN users u ON u.id = tp.user_id
      JOIN teams t ON t.id = tp.team_id
      WHERE t.shelter_id = ?
    `, [id]);

    // Construir o objeto ShelterEntity manualmente
    const shelterEntity = new ShelterEntity();
    shelterEntity.id = shelter.id;
    shelterEntity.name = shelter.name;
    shelterEntity.description = shelter.description;
    shelterEntity.teamsQuantity = shelter.teamsQuantity;
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

    // Construir as teams com seus líderes e professores
    shelterEntity.teams = teamsData.map(teamData => {
      const teamEntity = new TeamEntity();
      teamEntity.id = teamData.id;
      teamEntity.numberTeam = teamData.numberTeam;
      teamEntity.description = teamData.description;
      teamEntity.createdAt = teamData.createdAt;
      teamEntity.updatedAt = teamData.updatedAt;

      // Filtrar líderes desta team
      const teamLeaders = leadersData
        .filter((ld: any) => ld.team_id === teamData.id)
        .map((leaderData: any) => {
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

      // Filtrar professores desta team
      const teamTeachers = teachersData
        .filter((td: any) => td.team_id === teamData.id)
        .map((teacherData: any) => {
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

      teamEntity.leaders = teamLeaders;
      teamEntity.teachers = teamTeachers;
      return teamEntity;
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
      
      const address = addressRepo.create(dto.address);
      await addressRepo.save(address);

      const shelter = shelterRepo.create({
        name: dto.name,
        description: dto.description,
        teamsQuantity: dto.teamsQuantity,
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

      // ❌ REMOVIDO: Associação direta de líderes e professores
      // Agora isso é feito através de Teams

      return this.findOneOrFailForResponseTx(manager, shelter.id);
    });
  }

  async updateShelter(id: string, dto: UpdateShelterDto): Promise<ShelterEntity> {
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const addressRepo = manager.withRepository(this.addressRepo);

      const shelter = await shelterRepo.findOne({
        where: { id },
        relations: { address: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (dto.name !== undefined) shelter.name = dto.name as any;
      if (dto.description !== undefined) shelter.description = dto.description;
      if (dto.teamsQuantity !== undefined) shelter.teamsQuantity = dto.teamsQuantity;

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

      // ❌ REMOVIDO: Associação direta de líderes e professores
      // Agora isso é feito através de Teams

      return this.findOneOrFailForResponseTx(manager, shelter.id);
    });
  }

  // ❌ REMOVIDO: syncTeachersForShelterTx - Agora feito através de Teams
  // ❌ REMOVIDO: syncLeadersForShelterDirect - Agora feito através de Teams
  // ❌ REMOVIDO: syncLeadersForShelterTx - Agora feito através de Teams

  async deleteById(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const txShelter = manager.withRepository(this.shelterRepo);
      const txTeacher = manager.withRepository(this.teacherProfileRepo);
      const txLeader = manager.withRepository(this.leaderRepo);
      const txAddress = manager.withRepository(this.addressRepo);

      const shelter = await txShelter.findOne({
        where: { id },
        relations: { address: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // ❌ REMOVIDO: Desvinculação direta de teachers e leaders
      // Agora isso é feito através de Teams (CASCADE)

      const addressId = shelter.address?.id;

      await txShelter.delete(shelter.id);

      if (addressId) {
        await txAddress.delete(addressId);
      }
    });
  }

  // ❌ REMOVIDO: assignTeachers - Agora feito através de Teams
  // ❌ REMOVIDO: unassignTeachers - Agora feito através de Teams
  // ❌ REMOVIDO: moveTeachers - Agora feito através de Teams

  async userHasAccessToShelter(shelterId: string, ctx?: RoleCtx): Promise<boolean> {
    const role = ctx?.role?.toLowerCase();
    const userId = ctx?.userId;
    if (!role || role === 'admin') return true;
    if (!userId) return false;

    if (role !== 'leader') return false;

    const qb = this.shelterRepo
      .createQueryBuilder('shelter')
      .leftJoin('shelter.teams', 'teams')
      .leftJoin('teams.leaders', 'leaders')
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

  // ❌ REMOVIDO: assignLeaders - Agora feito através de Teams
  // ❌ REMOVIDO: removeLeaders - Agora feito através de Teams
  // ❌ REMOVIDO: removeTeachers - Agora feito através de Teams
}