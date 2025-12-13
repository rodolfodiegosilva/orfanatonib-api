import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamEntity } from '../entities/team.entity';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { LeaderProfileEntity } from 'src/modules/leader-profiles/entities/leader-profile.entity/leader-profile.entity';
import { TeacherProfileEntity } from 'src/modules/teacher-profiles/entities/teacher-profile.entity/teacher-profile.entity';
import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';

@Injectable()
export class TeamsRepository {
  private readonly logger = new Logger(TeamsRepository.name);

  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(LeaderProfileEntity)
    private readonly leaderRepo: Repository<LeaderProfileEntity>,
    @InjectRepository(TeacherProfileEntity)
    private readonly teacherRepo: Repository<TeacherProfileEntity>,
    @InjectRepository(ShelterEntity)
    private readonly shelterRepo: Repository<ShelterEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamEntity> {
    this.logger.debug(`🔵 [create] Iniciando criação de equipe: numberTeam=${dto.numberTeam}, shelterId=${dto.shelterId}`);
    return this.dataSource.transaction(async (manager) => {
      const txTeam = manager.withRepository(this.teamRepo);
      const txShelter = manager.withRepository(this.shelterRepo);

      // Verificar se o shelter existe
      this.logger.debug(`🔍 [create] Buscando shelter com ID: ${dto.shelterId}`);
      const shelter = await txShelter.findOne({ where: { id: dto.shelterId } });
      if (!shelter) {
        this.logger.error(`❌ [create] Shelter não encontrado: ${dto.shelterId}`);
        throw new NotFoundException('Shelter não encontrado');
      }
      this.logger.debug(`✅ [create] Shelter encontrado: ${shelter.id} - ${shelter.name}`);

      // Criar a equipe usando o repositório do TypeORM mas sem relações
      // Isso evita problemas com relações bidirecionais
      this.logger.debug(`🏗️ [create] Criando entidade Team...`);
      const team = txTeam.create({
        numberTeam: dto.numberTeam,
        description: dto.description,
        shelter: shelter as any,
      });
      this.logger.debug(`📝 [create] Team criado: numberTeam=${team.numberTeam}, shelter.id=${team.shelter?.id}`);
      
      // Salvar a equipe
      this.logger.debug(`💾 [create] Salvando equipe no banco...`);
      const savedTeam = await txTeam.save(team);
      this.logger.debug(`✅ [create] Equipe salva: ID=${savedTeam.id}, shelter_id=${savedTeam.shelter?.id || 'N/A'}`);
      
      // Verificar se foi salvo corretamente
      if (!savedTeam || !savedTeam.id) {
        this.logger.error(`❌ [create] Erro: equipe não tem ID após salvar`);
        throw new Error('Erro ao criar equipe: não foi possível obter o ID');
      }
      
      const teamId = savedTeam.id;
      this.logger.debug(`🆔 [create] Team ID: ${teamId}`);

      // Atribuir líderes se fornecidos usando raw SQL
      if (dto.leaderProfileIds && dto.leaderProfileIds.length > 0) {
        this.logger.debug(`👥 [create] Processando ${dto.leaderProfileIds.length} líder(es)...`);
        // Verificar quais líderes já estão na equipe para evitar duplicatas
        const placeholders = dto.leaderProfileIds.map(() => '?').join(',');
        const existingLinks = await manager.query(
          `SELECT leader_id FROM leader_teams WHERE team_id = ? AND leader_id IN (${placeholders})`,
          [teamId, ...dto.leaderProfileIds]
        );
        const existingLeaderIds = existingLinks.map((row: any) => row.leader_id);
        this.logger.debug(`📊 [create] Líderes já na equipe: ${existingLeaderIds.length}`);
        
        // Inserir apenas os líderes que ainda não estão na equipe
        const leadersToAdd = dto.leaderProfileIds.filter(
          (id: string) => !existingLeaderIds.includes(id)
        );
        this.logger.debug(`➕ [create] Líderes para adicionar: ${leadersToAdd.length}`);
        
        if (leadersToAdd.length > 0) {
          // Inserir na tabela de junção usando raw SQL com placeholders seguros
          const values = leadersToAdd.map(() => '(?, ?)').join(', ');
          const params: any[] = [];
          leadersToAdd.forEach((leaderId: string) => {
            params.push(leaderId, teamId);
          });
          this.logger.debug(`💾 [create] Inserindo ${leadersToAdd.length} líder(es) na tabela leader_teams...`);
          await manager.query(
            `INSERT INTO leader_teams (leader_id, team_id) VALUES ${values}`,
            params
          );
          this.logger.debug(`✅ [create] Líderes inseridos com sucesso`);
        }
      } else {
        this.logger.debug(`⏭️ [create] Nenhum líder para adicionar`);
      }

      // Atribuir professores se fornecidos usando raw SQL
      // IMPORTANTE: Um professor só pode estar em UMA equipe
      if (dto.teacherProfileIds && dto.teacherProfileIds.length > 0) {
        this.logger.debug(`👨‍🏫 [create] Processando ${dto.teacherProfileIds.length} professor(es)...`);
        // Primeiro, remover professores de suas equipes anteriores
        const placeholders = dto.teacherProfileIds.map(() => '?').join(',');
        this.logger.debug(`🗑️ [create] Removendo professores de equipes anteriores...`);
        const removeResult = await manager.query(
          `UPDATE teacher_profiles SET team_id = NULL WHERE id IN (${placeholders}) AND team_id IS NOT NULL AND team_id != ?`,
          [...dto.teacherProfileIds, teamId]
        );
        this.logger.debug(`✅ [create] Professores removidos de equipes anteriores: ${removeResult.affectedRows || 0} linha(s) afetada(s)`);

        // Agora atribuir todos os professores à nova equipe
        this.logger.debug(`➕ [create] Atribuindo professores à equipe ${teamId}...`);
        const assignResult = await manager.query(
          `UPDATE teacher_profiles SET team_id = ? WHERE id IN (${placeholders})`,
          [teamId, ...dto.teacherProfileIds]
        );
        this.logger.debug(`✅ [create] Professores atribuídos: ${assignResult.affectedRows || 0} linha(s) afetada(s)`);
      } else {
        this.logger.debug(`⏭️ [create] Nenhum professor para adicionar`);
      }

      // Recarregar a equipe do banco sem relações para garantir estado consistente
      // Não carregar relações de professores/líderes para evitar problemas de sincronização
      this.logger.debug(`🔄 [create] Recarregando equipe do banco (sem relações)...`);
      const finalTeam = await txTeam.findOne({
        where: { id: teamId },
      });

      if (!finalTeam) {
        this.logger.error(`❌ [create] Equipe não encontrada após criação: ${teamId}`);
        throw new Error('Equipe não encontrada após criação');
      }

      this.logger.debug(`✅ [create] Equipe recarregada: ID=${finalTeam.id}, shelter_id=${(finalTeam as any).shelter_id || finalTeam.shelter?.id || 'N/A'}`);
      this.logger.debug(`✅ [create] Criação de equipe concluída com sucesso: ID=${finalTeam.id}`);
      return finalTeam;
    });
  }

  async findAll(): Promise<TeamEntity[]> {
    return this.teamRepo.find({
      relations: ['shelter', 'leaders', 'leaders.user', 'teachers', 'teachers.user'],
    });
  }

  async findOne(id: string): Promise<TeamEntity | null> {
    return this.teamRepo.findOne({
      where: { id },
      relations: ['shelter', 'leaders', 'leaders.user', 'teachers', 'teachers.user'],
    });
  }

  async findByShelter(shelterId: string): Promise<TeamEntity[]> {
    return this.teamRepo.find({
      where: { shelter: { id: shelterId } },
      relations: ['shelter', 'leaders', 'leaders.user', 'teachers', 'teachers.user'],
    });
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamEntity> {
    return this.dataSource.transaction(async (manager) => {
      const txTeam = manager.withRepository(this.teamRepo);
      const txLeader = manager.withRepository(this.leaderRepo);
      const txTeacher = manager.withRepository(this.teacherRepo);

      const team = await txTeam.findOne({ where: { id } });
      if (!team) {
        throw new NotFoundException('Team não encontrado');
      }

      // Atualizar campos básicos
      if (dto.numberTeam !== undefined) team.numberTeam = dto.numberTeam;
      if (dto.description !== undefined) team.description = dto.description;
      await txTeam.save(team);

      // Atualizar líderes se fornecido - SEMPRE remover todos primeiro, depois adicionar os do array
      if (dto.leaderProfileIds !== undefined) {
        this.logger.debug(`🔄 [update] Atualizando líderes da equipe ID=${id}`);
        this.logger.debug(`📋 leaderProfileIds recebido: ${JSON.stringify(dto.leaderProfileIds)} (length=${dto.leaderProfileIds.length})`);
        
        // PASSO 1: SEMPRE remover TODOS os líderes atuais da equipe ESPECÍFICA
        // IMPORTANTE: Buscar líderes que estão nesta equipe, mas carregar TODAS as equipes deles
        // para não perder vínculos com outras equipes
        this.logger.debug(`🗑️ PASSO 1: Removendo TODOS os líderes atuais da equipe ID=${id}...`);
        
        // Primeiro, buscar os IDs dos líderes que estão nesta equipe
        const leaderIdsInTeam = await txLeader
          .createQueryBuilder('leader')
          .innerJoin('leader.teams', 'team', 'team.id = :teamId', { teamId: id })
          .select('leader.id', 'id')
          .getRawMany();
        
        const leaderIds = leaderIdsInTeam.map((row: any) => row.id);
        this.logger.debug(`📊 IDs dos líderes na equipe: ${JSON.stringify(leaderIds)} (${leaderIds.length} líder(es))`);
        
        if (leaderIds.length > 0) {
          // Agora buscar esses líderes com TODAS as suas equipes carregadas
          const currentLeaders = await txLeader.find({
            where: { id: In(leaderIds) },
            relations: ['teams'],
          });

          this.logger.debug(`📊 Líderes encontrados com todas as equipes: ${currentLeaders.length}`);
          for (const leader of currentLeaders) {
            if (leader.teams && Array.isArray(leader.teams)) {
              const beforeCount = leader.teams.length;
              // Filtrar apenas a equipe específica, mantendo todas as outras
              leader.teams = leader.teams.filter(t => t.id !== id);
              const afterCount = leader.teams.length;
              this.logger.debug(`   🗑️ Líder ID=${leader.id}: removido da equipe ${id} (${beforeCount} -> ${afterCount} equipe(s) restantes)`);
              await txLeader.save(leader);
            }
          }
        }
        this.logger.debug(`✅ PASSO 1 concluído: Todos os líderes foram removidos da equipe ${id}`);

        // PASSO 2: Adicionar apenas os líderes que vêm no array
        // IMPORTANTE: Carregar TODAS as equipes dos líderes para não perder vínculos com outras equipes
        if (dto.leaderProfileIds.length > 0) {
          this.logger.debug(`➕ PASSO 2: Adicionando ${dto.leaderProfileIds.length} líder(es) do array...`);
          const leaders = await txLeader.find({
            where: { id: In(dto.leaderProfileIds) },
            relations: ['teams'],
          });
          this.logger.debug(`📊 Líderes encontrados no banco: ${leaders.length}`);
          
          for (const leader of leaders) {
            if (!leader.teams) {
              leader.teams = [];
            }
            // Verificar se o líder já está na equipe (pode acontecer se não foi removido no PASSO 1)
            const isAlreadyInTeam = leader.teams.some(t => t.id === id);
            if (!isAlreadyInTeam) {
              // Adicionar a equipe ao líder, mantendo todas as outras equipes
              leader.teams.push(team as any);
              await txLeader.save(leader);
              this.logger.debug(`   ✅ Líder ID=${leader.id} vinculado à equipe ${id} (total de ${leader.teams.length} equipe(s))`);
            } else {
              this.logger.debug(`   ⏭️ Líder ID=${leader.id} já está na equipe ${id}, pulando...`);
            }
          }
          this.logger.debug(`✅ PASSO 2 concluído: ${leaders.length} líder(es) processado(s)`);
        } else {
          this.logger.debug(`⏭️ PASSO 2: Nenhum líder para adicionar (array vazio) - equipe ficará sem líderes`);
        }
      }

      // Atualizar professores se fornecido - SEMPRE remover todos primeiro, depois adicionar os do array
      if (dto.teacherProfileIds !== undefined) {
        this.logger.debug(`🔄 [update] Atualizando professores da equipe ID=${id}`);
        this.logger.debug(`📋 teacherProfileIds recebido: ${JSON.stringify(dto.teacherProfileIds)} (length=${dto.teacherProfileIds.length})`);
        
        // PASSO 1: SEMPRE remover TODOS os professores atuais da equipe ESPECÍFICA
        // IMPORTANTE: Buscar apenas professores desta equipe específica (ManyToOne garante que não afeta outras)
        this.logger.debug(`🗑️ PASSO 1: Removendo TODOS os professores atuais da equipe ID=${id}...`);
        const currentTeachers = await txTeacher.find({
          where: { team: { id } },
        });
        this.logger.debug(`📊 Professores atuais encontrados na equipe ${id}: ${currentTeachers.length}`);
        for (const teacher of currentTeachers) {
          teacher.team = null as any;
          await txTeacher.save(teacher);
          this.logger.debug(`   🗑️ Professor ID=${teacher.id}: removido da equipe ${id}`);
        }
        this.logger.debug(`✅ PASSO 1 concluído: Todos os professores foram removidos da equipe ${id}`);

        // PASSO 2: Adicionar apenas os professores que vêm no array
        // IMPORTANTE: Um professor só pode estar em UMA equipe
        if (dto.teacherProfileIds.length > 0) {
          this.logger.debug(`➕ PASSO 2: Adicionando ${dto.teacherProfileIds.length} professor(es) do array...`);
          const teachers = await txTeacher.find({
            where: { id: In(dto.teacherProfileIds) },
            relations: ['team'],
          });
          this.logger.debug(`📊 Professores encontrados no banco: ${teachers.length}`);
          
          for (const teacher of teachers) {
            // Se o professor já está em outra equipe (diferente da atual), remover primeiro
            if (teacher.team && teacher.team.id !== id) {
              this.logger.debug(`   ⚠️ Professor ID=${teacher.id} estava em outra equipe (ID=${teacher.team.id}), removendo...`);
              teacher.team = null as any;
              await txTeacher.save(teacher);
            }
            // Atribuir à nova equipe
            teacher.team = team as any;
            await txTeacher.save(teacher);
            this.logger.debug(`   ✅ Professor ID=${teacher.id} vinculado à equipe`);
          }
          this.logger.debug(`✅ PASSO 2 concluído: ${teachers.length} professor(es) adicionado(s)`);
        } else {
          this.logger.debug(`⏭️ PASSO 2: Nenhum professor para adicionar (array vazio) - equipe ficará sem professores`);
        }
      }

      return team;
    });
  }

  async remove(id: string): Promise<void> {
    const team = await this.teamRepo.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException('Team não encontrado');
    }

    await this.dataSource.transaction(async (manager) => {
      const txLeader = manager.withRepository(this.leaderRepo);
      const txTeacher = manager.withRepository(this.teacherRepo);
      const txTeam = manager.withRepository(this.teamRepo);

      // Remover líderes da equipe através da relação ManyToMany
      const leaders = await txLeader
        .createQueryBuilder('leader')
        .innerJoin('leader.teams', 'team', 'team.id = :teamId', { teamId: id })
        .getMany();
      
      for (const leader of leaders) {
        if (leader.teams) {
          leader.teams = leader.teams.filter(t => t.id !== id);
          await txLeader.save(leader);
        }
      }

      // Remover professores da equipe
      const teachers = await txTeacher.find({
        where: { team: { id } },
      });
      for (const teacher of teachers) {
        teacher.team = null as any;
        await txTeacher.save(teacher);
      }

      // Deletar a equipe
      await txTeam.remove(team);
    });
  }
}

