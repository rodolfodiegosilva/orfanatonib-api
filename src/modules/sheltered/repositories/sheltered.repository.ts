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
      shelteredName,
      shelterFilters,
      addressFilter,
      geographicSearchString,
      gender,
      birthDate,
      birthDateFrom,
      birthDateTo,
      joinedAt,
      joinedFrom,
      joinedTo,
      // Filtros legados para compatibilidade
      searchString,
      shelterId,
      shelterName,
      city,
      state,
    } = q;

    const qb = this.baseQB().distinct(true);
    this.applyRoleFilter(qb, ctx);

    // 👶 Filtro de nome do abrigado - busca específica no nome
    if (shelteredName?.trim()) {
      const like = `%${shelteredName.trim()}%`;
      qb.andWhere(
        `LOWER(c.name) LIKE LOWER(:shelteredName)`,
        { shelteredName: like }
      );
    }

    // 🏠 Filtros de abrigo - busca em nome do abrigo
    if (shelterFilters?.trim()) {
      const like = `%${shelterFilters.trim()}%`;
      qb.andWhere(
        `LOWER(shelter.name) LIKE LOWER(:shelterFilters)`,
        { shelterFilters: like }
      );
    }

    // 🏙️ Filtro de endereço - busca em todos os campos relacionados ao endereço
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

    // 🌍 Busca geográfica - busca em todos os campos geográficos (endereço + cidade/estado do abrigo)
    if (geographicSearchString?.trim()) {
      const like = `%${geographicSearchString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(addr.street) LIKE LOWER(:geographicSearchString) OR
          LOWER(addr.number) LIKE LOWER(:geographicSearchString) OR
          LOWER(addr.district) LIKE LOWER(:geographicSearchString) OR
          LOWER(addr.city) LIKE LOWER(:geographicSearchString) OR
          LOWER(addr.state) LIKE LOWER(:geographicSearchString) OR
          addr.postalCode LIKE :geographicSearchStringRaw OR
          LOWER(addr.complement) LIKE LOWER(:geographicSearchString) OR
          LOWER(shelterAddress.city) LIKE LOWER(:geographicSearchString) OR
          LOWER(shelterAddress.state) LIKE LOWER(:geographicSearchString) OR
          LOWER(shelterAddress.district) LIKE LOWER(:geographicSearchString)
        )`,
        { 
          geographicSearchString: like, 
          geographicSearchStringRaw: `%${geographicSearchString.trim()}%` 
        }
      );
    }

    // 👤 Filtros pessoais
    if (gender?.trim()) {
      qb.andWhere('c.gender = :gender', { gender: gender.trim() });
    }

    if (birthDate?.trim()) {
      qb.andWhere('c.birthDate = :birthDate', { birthDate: birthDate.trim() });
    }
    if (birthDateFrom?.trim()) {
      qb.andWhere('c.birthDate >= :birthDateFrom', { birthDateFrom: birthDateFrom.trim() });
    }
    if (birthDateTo?.trim()) {
      qb.andWhere('c.birthDate <= :birthDateTo', { birthDateTo: birthDateTo.trim() });
    }

    if (joinedAt?.trim()) {
      qb.andWhere('c.joinedAt = :joinedAt', { joinedAt: joinedAt.trim() });
    }
    if (joinedFrom?.trim()) {
      qb.andWhere('c.joinedAt >= :joinedFrom', { joinedFrom: joinedFrom.trim() });
    }
    if (joinedTo?.trim()) {
      qb.andWhere('c.joinedAt <= :joinedTo', { joinedTo: joinedTo.trim() });
    }

    // 🔍 Compatibilidade com frontend - mapear parâmetros antigos para novos
    // Se searchString foi enviado mas shelteredName não, usar searchString
    if (searchString?.trim() && !shelteredName?.trim()) {
      const like = `%${searchString.trim()}%`;
      qb.andWhere(
        `(
          LOWER(c.name) LIKE LOWER(:searchString) OR
          LOWER(COALESCE(c.guardianName, '')) LIKE LOWER(:searchString) OR
          LOWER(COALESCE(c.guardianPhone, '')) LIKE LOWER(:searchString)
        )`,
        { searchString: like }
      );
    }

    // Se shelterName foi enviado mas shelterFilters não, usar shelterName
    if (shelterName?.trim() && !shelterFilters?.trim()) {
      const like = `%${shelterName.trim()}%`;
      qb.andWhere(
        `LOWER(shelter.name) LIKE LOWER(:shelterName)`,
        { shelterName: like }
      );
    }

    // Filtro específico por shelter ID
    if (shelterId?.trim()) {
      qb.andWhere('shelter.id = :shelterId', { shelterId });
    }

    // Filtros de cidade e estado (legados)
    if (city?.trim()) {
      qb.andWhere('LOWER(addr.city) LIKE LOWER(:city)', { city: `%${city.trim()}%` });
    }
    if (state?.trim()) {
      qb.andWhere('LOWER(addr.state) LIKE LOWER(:state)', { state: `%${state.trim()}%` });
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