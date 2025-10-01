import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ShelteredEntity } from '../entities/sheltered.entity';
import { QueryShelteredDto } from '../dto/query-sheltered.dto';
import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';

export type PaginatedRows<T> = { items: T[]; total: number };
type RoleCtx = { role?: string; userId?: string | null };

@Injectable()
export class ShelteredRepository {
  constructor(
    @InjectRepository(ShelteredEntity)
    private readonly repo: Repository<ShelteredEntity>,
    @InjectRepository(ShelterEntity)
    private readonly shelterRepo: Repository<ShelterEntity>,
  ) { }

  private baseQB(): SelectQueryBuilder<ShelteredEntity> {
    return this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.shelter', 'shelter')
      .leftJoinAndSelect('c.address', 'addr');
  }
  
  private applyRoleFilter(qb: SelectQueryBuilder<ShelteredEntity>, ctx?: RoleCtx) {
    const role = ctx?.role?.toLowerCase();
    const userId = ctx?.userId;
    if (!role || role === 'admin' || !userId) return;

    if (role === 'leader') {
      qb.leftJoin('shelter.leader', 'leader')
        .leftJoin('leader.user', 'leaderUser')
        .andWhere('leaderUser.id = :uid', { uid: userId })
        .distinct(true);
    } else if (role === 'teacher') {
      qb.leftJoin('shelter.teachers', 'teachers')
        .leftJoin('teachers.user', 'teacherUser')
        .andWhere('teacherUser.id = :uid', { uid: userId })
        .distinct(true);
    }
  }

  async findAllPaginated(q: QueryShelteredDto, ctx?: RoleCtx): Promise<PaginatedRows<ShelteredEntity>> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const qb = this.baseQB();

    if (q.searchString) {
      const s = `%${q.searchString.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(c.name) LIKE :s OR LOWER(COALESCE(c.guardianName, \'\')) LIKE :s OR LOWER(COALESCE(c.guardianPhone, \'\')) LIKE :s)',
        { s },
      );
    }

    if (q.gender) qb.andWhere('c.gender = :gender', { gender: q.gender });
    if (q.shelterName !== undefined) {
      qb.andWhere('LOWER(shelter.name) LIKE :shelterName', { shelterName: `%${q.shelterName.toLowerCase()}%` });
    } else if (q.shelterId) {
      qb.andWhere('shelter.id = :shelterId', { shelterId: q.shelterId });
    }

    if (q.city) qb.andWhere('LOWER(addr.city) LIKE :city', { city: `%${q.city.toLowerCase()}%` });
    if (q.state) qb.andWhere('LOWER(addr.state) LIKE :state', { state: `%${q.state.toLowerCase()}%` });

    if (q.birthDate) qb.andWhere('c.birthDate = :b', { b: q.birthDate });
    if (q.birthDateFrom) qb.andWhere('c.birthDate >= :bf', { bf: q.birthDateFrom });
    if (q.birthDateTo) qb.andWhere('c.birthDate <= :bt', { bt: q.birthDateTo });

    if (q.joinedAt) qb.andWhere('c.joinedAt = :j', { j: q.joinedAt });
    if (q.joinedFrom) qb.andWhere('c.joinedAt >= :jf', { jf: q.joinedFrom });
    if (q.joinedTo) qb.andWhere('c.joinedAt <= :jt', { jt: q.joinedTo });

    this.applyRoleFilter(qb, ctx);

    const orderByMap: Record<string, string> = {
      name: 'c.name',
      birthDate: 'c.birthDate',
      joinedAt: 'c.joinedAt',
      createdAt: 'c.createdAt',
      updatedAt: 'c.updatedAt',
    };
    const orderBy = orderByMap[q.orderBy ?? 'name'] ?? 'c.name';
    const order: 'ASC' | 'DESC' =
      (q.order ?? 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    qb.orderBy(orderBy, order).skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findAllSimple(ctx?: RoleCtx): Promise<ShelteredEntity[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoin('c.shelter', 'shelter')
      .select([
        'c.id',
        'c.name',
        'c.guardianName',
        'c.gender',
        'c.guardianPhone',
        'shelter.id',
      ]);
    this.applyRoleFilter(qb as any as SelectQueryBuilder<ShelteredEntity>, ctx);
    return qb.getMany();
  }

  async findOneForResponse(id: string, ctx?: RoleCtx): Promise<ShelteredEntity | null> {
    const qb = this.baseQB().where('c.id = :id', { id });
    this.applyRoleFilter(qb, ctx);
    return qb.getOne();
  }

  async userHasAccessToShelter(shelterId: string, ctx?: RoleCtx): Promise<boolean> {
    const role = ctx?.role?.toLowerCase();
    const userId = ctx?.userId;
    if (!role || role === 'admin' || !userId) return true;

    const qb = this.shelterRepo.createQueryBuilder('shelter').where('shelter.id = :shelterId', { shelterId });

    if (role === 'leader') {
      qb.leftJoin('shelter.leader', 'leader')
        .leftJoin('leader.user', 'leaderUser')
        .andWhere('leaderUser.id = :uid', { uid: userId });
    } else if (role === 'teacher') {
      qb.leftJoin('shelter.teachers', 'teachers')
        .leftJoin('teachers.user', 'teacherUser')
        .andWhere('teacherUser.id = :uid', { uid: userId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  create(partial: Partial<ShelteredEntity>): ShelteredEntity {
    return this.repo.create(partial);
  }

  merge(target: ShelteredEntity, partial: Partial<ShelteredEntity>): ShelteredEntity {
    return this.repo.merge(target, partial);
  }

  save(entity: ShelteredEntity): Promise<ShelteredEntity> {
    return this.repo.save(entity);
  }

  delete(id: string): Promise<any> {
    return this.repo.delete(id);
  }
}