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
      .where('leader_user.active = true');
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
    const text = (params.searchString ?? params.q)?.trim();
    const { active, hasShelters, shelterName } = params;
    const shelterId = this.coerceShelterId((params as any).shelterId);

    if (text) {
      const like = `%${text.toLowerCase()}%`;
      const likeRaw = `%${text}%`;
      qb.andWhere(
        `(
          LOWER(leader_user.name)  LIKE :like OR
          LOWER(leader_user.email) LIKE :like OR
          leader_user.phone        LIKE :likeRaw
          OR EXISTS (
            SELECT 1
            FROM shelters s
            JOIN teacher_profiles tp ON tp.shelter_id = s.id
            JOIN users tu ON tu.id = tp.user_id
            WHERE s.leader_profile_id = leader.id
              AND (
                LOWER(tu.name)  LIKE :like OR
                LOWER(tu.email) LIKE :like OR
                tu.phone        LIKE :likeRaw
              )
          )
        )`,
        { like, likeRaw },
      );
    }

    if (typeof active === 'boolean') {
      qb.andWhere('leader.active = :active', { active });
    }

    if (shelterId !== undefined) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM shelters s
          WHERE s.leader_profile_id = leader.id
            AND s.id = :shelterId
        )`,
        { shelterId },
      );
    }

    if (shelterName) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM shelters s
          WHERE s.leader_profile_id = leader.id
            AND LOWER(s.name) LIKE LOWER(:shelterName)
        )`,
        { shelterName: `%${shelterName}%` },
      );
    }

    if (hasShelters !== undefined) {
      if (hasShelters === true) {
        qb.andWhere(`
          EXISTS (
            SELECT 1
            FROM shelters s
            WHERE s.leader_profile_id = leader.id
            LIMIT 1
          )
        `);
      } else {
        qb.andWhere(`
          NOT EXISTS (
            SELECT 1
            FROM shelters s
            WHERE s.leader_profile_id = leader.id
            LIMIT 1
          )
        `);
      }
    }

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
      relations: { leader: true },
    });
    if (!shelter) throw new NotFoundException('Shelter não encontrado');
    if (!shelter.leader) {
      throw new NotFoundException('Este Shelter não possui líder vinculado');
    }
    return this.findOneWithSheltersAndTeachersOrFail(shelter.leader.id);
  }

  async assignShelterToLeader(
    leaderId: string,
    shelterId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const leaderRepo = manager.withRepository(this.leaderRepo);
      const shelterRepo = manager.withRepository(this.shelterRepo);

      const leader = await leaderRepo.findOne({ where: { id: leaderId } });
      if (!leader)
        throw new NotFoundException('LeaderProfile não encontrado');

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { leader: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (shelter.leader && shelter.leader.id === leaderId) return;

      shelter.leader = leader;
      await shelterRepo.save(shelter);
    });
  }

  async unassignShelterFromLeader(
    leaderId: string,
    shelterId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { leader: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (!shelter.leader || shelter.leader.id !== leaderId) {
        throw new BadRequestException(
          'Este Shelter não está vinculado a este líder',
        );
      }

      shelter.leader = null as any;
      await shelterRepo.save(shelter);
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
        leaderRepo.findOne({ where: { id: fromLeaderId } }),
        leaderRepo.findOne({ where: { id: toLeaderId } }),
      ]);
      if (!from)
        throw new NotFoundException('LeaderProfile de origem não encontrado');
      if (!to)
        throw new NotFoundException('LeaderProfile de destino não encontrado');

      const shelter = await shelterRepo.findOne({
        where: { id: shelterId },
        relations: { leader: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      if (!shelter.leader || shelter.leader.id !== fromLeaderId) {
        throw new BadRequestException(
          'O Shelter não está vinculado ao líder de origem',
        );
      }

      shelter.leader = to;
      await shelterRepo.save(shelter);
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
        await txShelter
          .createQueryBuilder()
          .update(ShelterEntity)
          .set({ leader: null as any })
          .where('leader_profile_id = :id', { id: leader.id })
          .execute();
      }

      await txLeader.delete(leader.id);
    });
  }

  async list(): Promise<LeaderSimpleListDto[]> {
    const items = await this.leaderRepo
      .createQueryBuilder('leader')
      .leftJoin('leader.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoinAndSelect('leader.shelter', 'shelter')
      .where('user.active = true')
      .orderBy('leader.createdAt', 'ASC')
      .addOrderBy('shelter.name', 'ASC')
      .getMany();

    return items.map(toLeaderSimple);
  }
}