import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.dataSource.transaction(async (manager) => {
      const txTeam = manager.withRepository(this.teamRepo);
      const txLeader = manager.withRepository(this.leaderRepo);
      const txTeacher = manager.withRepository(this.teacherRepo);
      const txShelter = manager.withRepository(this.shelterRepo);

      // Verificar se o shelter existe
      const shelter = await txShelter.findOne({ where: { id: dto.shelterId } });
      if (!shelter) {
        throw new NotFoundException('Shelter não encontrado');
      }

      // Criar a equipe
      const team = txTeam.create({
        numberTeam: dto.numberTeam,
        description: dto.description,
        shelter: shelter as any,
      });
      const savedTeam = await txTeam.save(team);

      // Atribuir líderes se fornecidos
      if (dto.leaderProfileIds && dto.leaderProfileIds.length > 0) {
        const leaders = await txLeader.find({
          where: { id: In(dto.leaderProfileIds) },
        });
        for (const leader of leaders) {
          leader.team = savedTeam as any;
          await txLeader.save(leader);
        }
      }

      // Atribuir professores se fornecidos
      if (dto.teacherProfileIds && dto.teacherProfileIds.length > 0) {
        const teachers = await txTeacher.find({
          where: { id: In(dto.teacherProfileIds) },
        });
        for (const teacher of teachers) {
          teacher.team = savedTeam as any;
          await txTeacher.save(teacher);
        }
      }

      return savedTeam;
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

      // Atualizar líderes se fornecido
      if (dto.leaderProfileIds !== undefined) {
        // Remover líderes atuais da equipe
        const currentLeaders = await txLeader.find({
          where: { team: { id } },
        });
        for (const leader of currentLeaders) {
          leader.team = null as any;
          await txLeader.save(leader);
        }

        // Adicionar novos líderes
        if (dto.leaderProfileIds.length > 0) {
          const leaders = await txLeader.find({
            where: { id: In(dto.leaderProfileIds) },
          });
          for (const leader of leaders) {
            leader.team = team as any;
            await txLeader.save(leader);
          }
        }
      }

      // Atualizar professores se fornecido
      if (dto.teacherProfileIds !== undefined) {
        // Remover professores atuais da equipe
        const currentTeachers = await txTeacher.find({
          where: { team: { id } },
        });
        for (const teacher of currentTeachers) {
          teacher.team = null as any;
          await txTeacher.save(teacher);
        }

        // Adicionar novos professores
        if (dto.teacherProfileIds.length > 0) {
          const teachers = await txTeacher.find({
            where: { id: In(dto.teacherProfileIds) },
          });
          for (const teacher of teachers) {
            teacher.team = team as any;
            await txTeacher.save(teacher);
          }
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

      // Remover líderes da equipe
      const leaders = await txLeader.find({
        where: { team: { id } },
      });
      for (const leader of leaders) {
        leader.team = null as any;
        await txLeader.save(leader);
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

