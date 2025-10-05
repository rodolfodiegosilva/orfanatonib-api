import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  SelectQueryBuilder,
  EntityManager,
} from 'typeorm';

import { LeaderProfileEntity } from '../entities/leader-profile.entity/leader-profile.entity';
import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  LeaderSimpleListDto,
  toLeaderSimple,
} from '../dto/leader-simple-list.dto';
import { LeaderProfilesQueryDto } from '../dto/leader-profiles.query.dto';

type SortDir = 'ASC' | 'DESC';

@Injectable()
export class LeaderProfilesRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LeaderProfileEntity)
    private readonly leaderRepo: Repository<LeaderProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ShelterEntity)
    private readonly shelterRepo: Repository<ShelterEntity>,
  ) {}

  private buildLeaderBaseQB(
    manager?: EntityManager,
  ): SelectQueryBuilder<LeaderProfileEntity> {
    const repo = manager
      ? manager.getRepository(LeaderProfileEntity)
      : this.leaderRepo;

    return repo
      .createQueryBuilder('leader')
      .leftJoinAndSelect('leader.shelter', 'shelter')
      .leftJoinAndSelect('shelter.teachers', 'teachers')
      .leftJoin('leader.user', 'leader_user')
      .addSelect([
        'leader_user.id',
        'leader_user.name',
        'leader_user.email',
        'leader_user.phone',
        'leader_user.active',
        'leader_user.completed',
        'leader_user.commonUser',
      ])
      .leftJoin('teachers.user', 'teacher_user')
      .addSelect([
        'teacher_user.id',
        'teacher_user.name',
        'teacher_user.email',
        'teacher_user.phone',
        'teacher_user.active',
        'teacher_user.completed',
        'teacher_user.commonUser',
      ])
      .where('leader_user.active = true')
      .distinct(true);
  }

  private baseIdsQuery(): SelectQueryBuilder<LeaderProfileEntity> {
    return this.leaderRepo
      .createQueryBuilder('leader')
      .leftJoin('leader.user', 'leader_user')
      .where('leader_user.active = true');
  }

  private resolveSort(sort?: string) {
    const map: Record<string, string> = {
      createdAt: 'leader.createdAt',
      updatedAt: 'leader.updatedAt',
      name: 'leader_user.name',
    };
    return map[sort ?? 'updatedAt'] ?? 'leader.updatedAt';
  }

  private coerceShelterId(input: unknown): string | undefined {
    if (input === undefined || input === null || input === '') return undefined;
    const s = String(input).trim();
    return s ? s : undefined;
  }

  private applyFilters(
    qb: SelectQueryBuilder<LeaderProfileEntity>,
    params: LeaderProfilesQueryDto,
  ) {
    const { leaderSearchString, shelterSearchString, hasShelter } = params;

    // 🔍 FILTROS CONSOLIDADOS

    // Busca pelos dados do líder: nome, email, telefone
    if (leaderSearchString?.trim()) {
      const like = `%${leaderSearchString.trim().toLowerCase()}%`;
      const likeRaw = `%${leaderSearchString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(leader_user.name) LIKE :leaderSearchString OR
          LOWER(leader_user.email) LIKE :leaderSearchString OR
          leader_user.phone LIKE :leaderSearchStringRaw
        )`,
        { 
          leaderSearchString: like, 
          leaderSearchStringRaw: likeRaw 
        }
      );
    }

    // Busca por todos os campos do shelter
    if (shelterSearchString?.trim()) {
      const like = `%${shelterSearchString.trim().toLowerCase()}%`;
      const likeRaw = `%${shelterSearchString.trim()}%`;
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM shelters s
          LEFT JOIN addresses shelter_addr ON shelter_addr.id = s.address_id
          WHERE s.id = leader.shelter_id
            AND (
              LOWER(s.name) LIKE :shelterSearchString OR
              LOWER(shelter_addr.street) LIKE :shelterSearchString OR
              LOWER(shelter_addr.number) LIKE :shelterSearchString OR
              LOWER(shelter_addr.district) LIKE :shelterSearchString OR
              LOWER(shelter_addr.city) LIKE :shelterSearchString OR
              LOWER(shelter_addr.state) LIKE :shelterSearchString OR
              shelter_addr.postalCode LIKE :shelterSearchStringRaw OR
              LOWER(shelter_addr.complement) LIKE :shelterSearchString
            )
        )`,
        { 
          shelterSearchString: like, 
          shelterSearchStringRaw: likeRaw 
        }
      );
    }

    // Se está vinculado a algum shelter ou não
    //  console.log(`🔍 Aplicando filtro hasShelter: ${hasShelter}`);
      if (hasShelter === true) {
        qb.andWhere('leader.shelter_id IS NOT NULL');
        console.log('✅ Filtro aplicado: shelter_id IS NOT NULL');
      } else {
        qb.andWhere('leader.shelter_id IS NULL');
        console.log('✅ Filtro aplicado: shelter_id IS NULL');
      }
  //    console.log(`📝 SQL Query: ${qb.getSql()}`);
    

    return qb;
  }

  async findPageWithFilters(query: LeaderProfilesQueryDto): Promise<{
    items: LeaderProfileEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 12,
      sort = 'updatedAt',
      order = 'desc',
    } = query;

    const sortColumn = this.resolveSort(sort);
    const sortDir: SortDir =
      (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const total = await this.applyFilters(this.baseIdsQuery(), query)
      .select('leader.id')
      .distinct(true)
      .getCount();

    const pageIdsRaw = await this.applyFilters(this.baseIdsQuery(), query)
      .select('leader.id', 'id')
      .addSelect(sortColumn, 'ord')
      .distinct(true)
      .orderBy(sortColumn, sortDir)
      .offset(offset)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = pageIdsRaw.map((r) => r.id);
    if (!ids.length) {
      return { items: [], total, page, limit };
    }

    const items = await this.buildLeaderBaseQB()
      .andWhere('leader.id IN (:...ids)', { ids })
      .orderBy(sortColumn, sortDir)
      .addOrderBy('shelter.name', 'ASC')
      .addOrderBy('teachers.createdAt', 'ASC')
      .getMany();

    return { items, total, page, limit };
  }

  async findAllWithSheltersAndTeachers(): Promise<LeaderProfileEntity[]> {
    return this.buildLeaderBaseQB()
      .orderBy('leader.createdAt', 'ASC')
      .addOrderBy('shelter.name', 'ASC')
      .addOrderBy('teachers.createdAt', 'ASC')
      .getMany();
  }

  async findOneWithSheltersAndTeachersOrFail(
    id: string,
  ): Promise<LeaderProfileEntity> {
    const leader = await this.buildLeaderBaseQB()
      .andWhere('leader.id = :id', { id })
      .orderBy('shelter.name', 'ASC')
      .addOrderBy('teachers.createdAt', 'ASC')
      .getOne();

    if (!leader) throw new NotFoundException('LeaderProfile não encontrado');
    return leader;
  }

  async findByShelterIdWithTeachersOrFail(
    shelterId: string,
  ): Promise<LeaderProfileEntity> {
    const shelter = await this.shelterRepo.findOne({
      where: { id: shelterId },
      relations: { leaders: true },
    });
    if (!shelter) throw new NotFoundException('Shelter não encontrado');
    if (!shelter.leaders || shelter.leaders.length === 0) {
      throw new NotFoundException('Este Shelter não possui líderes vinculados');
    }
    // Retorna o primeiro líder (pode ser ajustado conforme regra de negócio)
    return this.findOneWithSheltersAndTeachersOrFail(shelter.leaders[0].id);
  }

  async assignShelterToLeader(
    leaderId: string,
    shelterId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const leaderRepo = manager.withRepository(this.leaderRepo);
      const shelterRepo = manager.withRepository(this.shelterRepo);

      const leader = await leaderRepo.findOne({ 
        where: { id: leaderId },
        relations: { shelter: true },
      });
      if (!leader)
        throw new NotFoundException('LeaderProfile não encontrado');

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // Verificar se o líder já está vinculado a este shelter
      if (leader.shelter && leader.shelter.id === shelterId) return;

      // Verificar se o líder já está vinculado a outro shelter
      if (leader.shelter && leader.shelter.id !== shelterId) {
        throw new BadRequestException('Leader já está vinculado a outro Shelter');
      }

      leader.shelter = shelter;
      await leaderRepo.save(leader);
    });
  }

  async unassignShelterFromLeader(
    leaderId: string,
    shelterId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const leaderRepo = manager.withRepository(this.leaderRepo);

      const leader = await leaderRepo.findOne({
        where: { id: leaderId },
        relations: { shelter: true },
      });
      if (!leader) throw new NotFoundException('LeaderProfile não encontrado');

      // Verificar se o líder está vinculado ao shelter correto
      if (!leader.shelter || leader.shelter.id !== shelterId) {
        throw new BadRequestException(
          'Este Leader não está vinculado a este Shelter',
        );
      }

      // Remover a vinculação
      leader.shelter = null;
      await leaderRepo.save(leader);
    });
  }

  async moveShelterBetweenLeaders(
    fromLeaderId: string,
    shelterId: string,
    toLeaderId: string,
  ): Promise<void> {
    if (fromLeaderId === toLeaderId) {
      throw new BadRequestException('Líderes de origem e destino são iguais');
    }

    await this.dataSource.transaction(async (manager) => {
      const leaderRepo = manager.withRepository(this.leaderRepo);
      const shelterRepo = manager.withRepository(this.shelterRepo);

      const [from, to] = await Promise.all([
        leaderRepo.findOne({ 
          where: { id: fromLeaderId },
          relations: { shelter: true },
        }),
        leaderRepo.findOne({ 
          where: { id: toLeaderId },
          relations: { shelter: true },
        }),
      ]);
      if (!from)
        throw new NotFoundException('LeaderProfile de origem não encontrado');
      if (!to)
        throw new NotFoundException('LeaderProfile de destino não encontrado');

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // Verificar se o líder de origem está vinculado ao shelter correto
      if (!from.shelter || from.shelter.id !== shelterId) {
        throw new BadRequestException(
          'O Shelter não está vinculado ao líder de origem',
        );
      }

      // Verificar se o líder de destino já está vinculado a outro shelter
      if (to.shelter && to.shelter.id !== shelterId) {
        throw new BadRequestException(
          'O líder de destino já está vinculado a outro Shelter',
        );
      }

      // Transferir o shelter do líder de origem para o de destino
      from.shelter = null;
      to.shelter = shelter;
      
      await Promise.all([
        leaderRepo.save(from),
        leaderRepo.save(to),
      ]);
    });
  }

  async createForUser(userId: string): Promise<LeaderProfileEntity> {
    return this.dataSource.transaction(async (manager) => {
      const txLeader = manager.withRepository(this.leaderRepo);
      const txUser = manager.withRepository(this.userRepo);

      const user = await txUser.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User não encontrado');

      const existing = await txLeader.findOne({ where: { user: { id: userId } } });
      if (existing) return existing;

      const entity = txLeader.create({ user: user as any, active: true });
      return txLeader.save(entity);
    });
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const txLeader = manager.withRepository(this.leaderRepo);
      const txShelter = manager.withRepository(this.shelterRepo);

      const leader = await txLeader.findOne({
        where: { user: { id: userId } },
        relations: { shelter: true },
      });
      if (!leader) return;

      if (leader.shelter) {
        // Remover a vinculação do líder ao shelter
        leader.shelter = null;
        await txLeader.save(leader);
      }

      await txLeader.delete(leader.id);
    });
  }

  async list(): Promise<LeaderSimpleListDto[]> {
    const items = await this.leaderRepo
      .createQueryBuilder('leader')
      .leftJoin('leader.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .where('user.active = true')
      .andWhere('leader.shelter_id IS NULL')
      .orderBy('leader.createdAt', 'ASC')
      .getMany();

    return items.map(toLeaderSimple);
  }
}