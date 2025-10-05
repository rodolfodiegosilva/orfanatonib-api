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
      .leftJoinAndSelect('c.address', 'addr')
      .leftJoinAndSelect('shelter.address', 'shelterAddress');
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
    const {
      page = 1,
      limit = 20,
      orderBy = 'name',
      order = 'ASC',
      // Filtros consolidados
      shelteredSearchingString,
      addressFilter,
      gender,
      birthDateFrom,
      birthDateTo,
      joinedFrom,
      joinedTo,
    } = q;

    const qb = this.baseQB().distinct(true);
    this.applyRoleFilter(qb, ctx);

    // 🔍 FILTROS CONSOLIDADOS

    // Busca geral: nome do abrigado, responsável ou telefone
    if (shelteredSearchingString?.trim()) {
      const like = `%${shelteredSearchingString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(c.name) LIKE LOWER(:shelteredSearchingString) OR
          LOWER(COALESCE(c.guardianName, '')) LIKE LOWER(:shelteredSearchingString) OR
          LOWER(COALESCE(c.guardianPhone, '')) LIKE LOWER(:shelteredSearchingString)
        )`,
        { shelteredSearchingString: like }
      );
    }

    // Filtro de endereço: todos os campos de endereço
    if (addressFilter?.trim()) {
      const like = `%${addressFilter.trim()}%`;
      qb.andWhere(
        `(
          LOWER(addr.street) LIKE LOWER(:addressFilter) OR
          LOWER(addr.number) LIKE LOWER(:addressFilter) OR
          LOWER(addr.district) LIKE LOWER(:addressFilter) OR
          LOWER(addr.city) LIKE LOWER(:addressFilter) OR
          LOWER(addr.state) LIKE LOWER(:addressFilter) OR
          addr.postalCode LIKE :addressFilterRaw OR
          LOWER(addr.complement) LIKE LOWER(:addressFilter)
        )`,
        { addressFilter: like, addressFilterRaw: `%${addressFilter.trim()}%` }
      );
    }

    // Filtro por gênero
    if (gender?.trim()) {
      const normalizedGender = gender.trim().toUpperCase();
      if (['M', 'F'].includes(normalizedGender)) {
        qb.andWhere('c.gender = :gender', { gender: normalizedGender });
      }
    }

    // Range de data de nascimento
    if (birthDateFrom?.trim()) {
      qb.andWhere('c.birthDate >= :birthDateFrom', { birthDateFrom: birthDateFrom.trim() });
    }
    if (birthDateTo?.trim()) {
      qb.andWhere('c.birthDate <= :birthDateTo', { birthDateTo: birthDateTo.trim() });
    }

    // Range de data "no abrigo desde"
    if (joinedFrom?.trim()) {
      qb.andWhere('c.joinedAt >= :joinedFrom', { joinedFrom: joinedFrom.trim() });
    }
    if (joinedTo?.trim()) {
      qb.andWhere('c.joinedAt <= :joinedTo', { joinedTo: joinedTo.trim() });
    }

    // Ordenação
    const orderByMap: Record<string, string> = {
      name: 'c.name',
      birthDate: 'c.birthDate',
      joinedAt: 'c.joinedAt',
      createdAt: 'c.createdAt',
      updatedAt: 'c.updatedAt',
    };
    const sortField = orderByMap[orderBy] ?? 'c.name';
    const sortOrder = (order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    qb.orderBy(sortField, sortOrder as 'ASC' | 'DESC');

    // Paginação
    qb.skip((page - 1) * limit).take(limit);

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