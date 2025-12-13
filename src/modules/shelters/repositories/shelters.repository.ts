import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
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
import { RouteEntity } from 'src/route/route-page.entity';
import { MediaItemEntity } from 'src/share/media/media-item/media-item.entity';
import { AwsS3Service } from 'src/aws/aws-s3.service';

type RoleCtx = { role?: string; userId?: string | null };

@Injectable()
export class SheltersRepository {
  private readonly logger = new Logger(SheltersRepository.name);

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

    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,

    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,

    @InjectRepository(MediaItemEntity)
    private readonly mediaRepo: Repository<MediaItemEntity>,

    private readonly s3Service: AwsS3Service,
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
            JOIN leader_teams lt ON lt.team_id = t.id
            JOIN leader_profiles lp ON lp.id = lt.leader_id
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

  /**
   * Busca os IDs dos abrigos onde o líder está em pelo menos uma equipe
   * Usado para depois buscar todos os abrigos com todas as equipes
   */
  async findShelterIdsForLeader(userId: string): Promise<string[]> {
    const result = await this.shelterRepo
      .createQueryBuilder('shelter')
      .innerJoin('shelter.teams', 'team')
      .innerJoin('team.leaders', 'leader')
      .innerJoin('leader.user', 'leaderUser')
      .where('leaderUser.id = :userId', { userId })
      .select('DISTINCT shelter.id', 'id')
      .getRawMany();

    return result.map((row: any) => row.id);
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
    const logger = new Logger('SheltersRepository.findOneOrFailForResponseTx');
    logger.debug(`🔵 [findOneOrFailForResponseTx] Buscando abrigo: ID=${id}`);
    
    // Usar SQL raw para garantir que vemos os dados atualizados
    logger.debug(`🔍 [findOneOrFailForResponseTx] Buscando dados do abrigo...`);
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

    // Buscar líderes através de teams usando SQL raw (usando tabela de junção ManyToMany)
    const leadersData = await manager.query(`
      SELECT lp.id, lp.active, lp.createdAt, lp.updatedAt, lp.user_id,
             u.id as user_id, u.name, u.email, u.phone, u.active as user_active, u.completed, u.commonUser, u.role,
             t.id as team_id, t.numberTeam as team_numberTeam
      FROM leader_profiles lp
      JOIN users u ON u.id = lp.user_id
      JOIN leader_teams lt ON lt.leader_id = lp.id
      JOIN teams t ON t.id = lt.team_id
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
    logger.debug(`🏗️ [findOneOrFailForResponseTx] Construindo ${teamsData.length} equipe(s)...`);
    shelterEntity.teams = teamsData.map((teamData, index) => {
      logger.debug(`   🏗️ [findOneOrFailForResponseTx] Construindo equipe ${index + 1}/${teamsData.length}: ID=${teamData.id}, shelter_id=${teamData.shelter_id}`);
      const teamEntity = new TeamEntity();
      teamEntity.id = teamData.id;
      teamEntity.numberTeam = teamData.numberTeam;
      teamEntity.description = teamData.description;
      teamEntity.createdAt = teamData.createdAt;
      teamEntity.updatedAt = teamData.updatedAt;
      // IMPORTANTE: Associar o shelter à equipe para evitar problemas de sincronização do TypeORM
      teamEntity.shelter = shelterEntity;
      logger.debug(`   ✅ [findOneOrFailForResponseTx] Equipe construída: ID=${teamEntity.id}, shelter.id=${teamEntity.shelter?.id}`);

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
      logger.debug(`   ✅ [findOneOrFailForResponseTx] Equipe completa: ID=${teamEntity.id}, ${teamLeaders.length} líder(es), ${teamTeachers.length} professor(es)`);
      return teamEntity;
        });

      logger.debug(`✅ [findOneOrFailForResponseTx] Abrigo construído: ID=${shelterEntity.id}, ${shelterEntity.teams.length} equipe(s)`);
      return shelterEntity;
    }

  async list(ctx?: RoleCtx): Promise<ShelterSelectOptionDto[]> {
    const qb = this.buildShelterBaseQB().orderBy('shelter.name', 'ASC');
    this.applyRoleFilter(qb, ctx);
    const items = await qb.getMany();
    return items.map(toShelterSelectOption);
  }

  async createShelter(dto: CreateShelterDto): Promise<ShelterEntity> {
    const logger = new Logger('SheltersRepository.createShelter');
    logger.debug(`🔵 [createShelter] Iniciando criação de abrigo: ${dto.name}`);
    return this.dataSource.transaction(async (manager) => {
      const shelterRepo = manager.withRepository(this.shelterRepo);
      const addressRepo = manager.withRepository(this.addressRepo);
      
      logger.debug(`🏗️ [createShelter] Criando endereço...`);
      const address = addressRepo.create(dto.address);
      await addressRepo.save(address);
      logger.debug(`✅ [createShelter] Endereço criado: ID=${address.id}`);

      logger.debug(`🏗️ [createShelter] Criando abrigo...`);
      const shelter = shelterRepo.create({
        name: dto.name,
        description: dto.description,
        teamsQuantity: dto.teamsQuantity,
        address,
      });

      try {
        logger.debug(`💾 [createShelter] Salvando abrigo no banco...`);
        await shelterRepo.save(shelter);
        logger.debug(`✅ [createShelter] Abrigo salvo: ID=${shelter.id}`);
      } catch (e: any) {
        logger.error(`❌ [createShelter] Erro ao salvar abrigo: ${e.message}`);
        if (e?.code === 'ER_DUP_ENTRY' || e?.code === '23505') {
          throw new ConflictException('Já existe um Shelter com esse nome');
        }
        throw e;
      }

      // ❌ REMOVIDO: Associação direta de líderes e professores
      // Agora isso é feito através de Teams

      // Retornar apenas o shelter básico sem equipes
      // As equipes serão criadas depois e o abrigo completo será buscado no final
      logger.debug(`✅ [createShelter] Abrigo criado com sucesso: ID=${shelter.id}`);
      return shelter;
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
          // Atualizar apenas os campos fornecidos (ignorar id, createdAt, updatedAt)
          const addressUpdate: any = {};
          if (dto.address.street !== undefined) addressUpdate.street = dto.address.street;
          if (dto.address.number !== undefined) addressUpdate.number = dto.address.number;
          if (dto.address.district !== undefined) addressUpdate.district = dto.address.district;
          if (dto.address.city !== undefined) addressUpdate.city = dto.address.city;
          if (dto.address.state !== undefined) addressUpdate.state = dto.address.state;
          if (dto.address.postalCode !== undefined) addressUpdate.postalCode = dto.address.postalCode;
          if (dto.address.complement !== undefined) addressUpdate.complement = dto.address.complement;
          
          Object.assign(shelter.address, addressUpdate);
          await addressRepo.save(shelter.address);
        } else {
          // Criar novo endereço (remover id, createdAt, updatedAt se existirem)
          const { id, createdAt, updatedAt, ...addressData } = dto.address as any;
          const newAddress = addressRepo.create(addressData);
          const savedAddress = await addressRepo.save(newAddress);
          // Garantir que savedAddress é uma única entidade, não um array
          shelter.address = Array.isArray(savedAddress) ? savedAddress[0] : savedAddress;
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
      const txTeam = manager.withRepository(this.teamRepo);

      const shelter = await txShelter.findOne({
        where: { id },
        relations: { address: true },
      });
      if (!shelter) throw new NotFoundException('Shelter não encontrado');

      // Buscar todas as equipes do abrigo
      const teams = await txTeam.find({
        where: { shelter: { id } },
      });

      // Para cada equipe, limpar relacionamentos antes de deletar usando raw SQL
      // Isso evita problemas com relações bidirecionais do TypeORM
      for (const team of teams) {
        this.logger.debug(`   🔗 [deleteById] Limpando relacionamentos da equipe ${team.id}...`);
        
        // 1. Remover líderes da equipe (ManyToMany - tabela leader_teams) usando raw SQL
        await manager.query(
          `DELETE FROM leader_teams WHERE team_id = ?`,
          [team.id]
        );
        this.logger.debug(`   ✅ [deleteById] Líderes desvinculados da equipe ${team.id}`);

        // 2. Remover professores da equipe (ManyToOne - setar team_id = null) usando raw SQL
        await manager.query(
          `UPDATE teacher_profiles SET team_id = NULL WHERE team_id = ?`,
          [team.id]
        );
        this.logger.debug(`   ✅ [deleteById] Professores desvinculados da equipe ${team.id}`);
      }

      // 3. Deletar todas as equipes do abrigo
      if (teams.length > 0) {
        this.logger.debug(`🗑️ [deleteById] Deletando ${teams.length} equipe(s)...`);
        await txTeam.remove(teams);
        this.logger.debug(`✅ [deleteById] Equipes deletadas`);
      }

      // 4. Deletar a mídia relacionada ao abrigo
      this.logger.debug(`🗑️ [deleteById] Deletando mídia relacionada...`);
      const txMedia = manager.withRepository(this.mediaRepo);
      const mediaItems = await txMedia.find({
        where: { targetId: id, targetType: 'ShelterEntity' },
      });
      if (mediaItems.length > 0) {
        this.logger.debug(`   🗑️ [deleteById] Encontradas ${mediaItems.length} mídia(s) para deletar`);
        // Deletar arquivos do S3 antes de remover do banco
        for (const media of mediaItems) {
          if (media.isLocalFile && media.url) {
            try {
              this.logger.debug(`   🗑️ [deleteById] Deletando arquivo do S3: ${media.url}`);
              await this.s3Service.delete(media.url);
              this.logger.debug(`   ✅ [deleteById] Arquivo deletado do S3`);
            } catch (error: any) {
              // Log mas não falha se não conseguir deletar do S3
              this.logger.warn(`   ⚠️ [deleteById] Erro ao deletar arquivo do S3: ${error.message}`);
            }
          }
        }
        // Deletar mídias do banco
        await txMedia.remove(mediaItems);
        this.logger.debug(`✅ [deleteById] ${mediaItems.length} mídia(s) deletada(s) do banco`);
      } else {
        this.logger.debug(`⏭️ [deleteById] Nenhuma mídia encontrada para deletar`);
      }

      // 5. Deletar a rota relacionada ao abrigo
      this.logger.debug(`🗑️ [deleteById] Deletando rota relacionada...`);
      const txRoute = manager.withRepository(this.routeRepo);
      const route = await txRoute.findOne({
        where: { entityType: 'shelterPage', entityId: id },
      });
      if (route) {
        await txRoute.remove(route);
        this.logger.debug(`✅ [deleteById] Rota deletada: ID=${route.id}`);
      } else {
        this.logger.debug(`⏭️ [deleteById] Nenhuma rota encontrada para deletar`);
      }

      // 6. Deletar o abrigo
      this.logger.debug(`🗑️ [deleteById] Deletando abrigo...`);
      const addressId = shelter.address?.id;
      await txShelter.delete(shelter.id);
      this.logger.debug(`✅ [deleteById] Abrigo deletado`);

      // 7. Deletar o endereço se existir
      if (addressId) {
        this.logger.debug(`🗑️ [deleteById] Deletando endereço...`);
        await txAddress.delete(addressId);
        this.logger.debug(`✅ [deleteById] Endereço deletado`);
      }

      this.logger.log(`✅ [deleteById] Abrigo e recursos relacionados deletados com sucesso: ID=${id}`);
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