import { ForbiddenException, Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { Request } from 'express';
import { LeaderProfilesRepository } from '../repositories/leader-profiles.repository';
import {
  LeaderResponseDto,
  toLeaderDto,
} from '../dto/leader-profile.response.dto';
import { LeaderSimpleListDto } from '../dto/leader-simple-list.dto';
import { LeaderProfilesQueryDto, PageDto } from '../dto/leader-profiles.query.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';
import { TeamsService } from 'src/modules/teams/services/teams.service';
import { ManageLeaderTeamDto } from '../dto/assign-team.dto';

type AccessCtx = { role?: string; userId?: string | null };

@Injectable()
export class LeaderProfilesService {
  constructor(
    private readonly repo: LeaderProfilesRepository,
    private readonly authCtx: AuthContextService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
  ) { }

  private async getCtx(req: Request): Promise<AccessCtx> {
    const payload = await this.authCtx.tryGetPayload(req);
    return {
      role: payload?.role?.toString().toLowerCase(),
      userId: payload?.sub ?? null,
    };
  }

  async findPage(
    req: Request,
    query: LeaderProfilesQueryDto,
  ): Promise<PageDto<LeaderResponseDto>> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    console.log("Buscando página com filtros:", query);
    const { items, total, page, limit } = await this.repo.findPageWithFilters(query);
    return {
      items: items.map(toLeaderDto),
      total,
      page,
      limit,
    };
  }

  private assertAllowed(ctx: AccessCtx) {
    if (!ctx.role) throw new ForbiddenException('Acesso negado');
    if (ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');
  }

  async list(req: Request): Promise<LeaderSimpleListDto[]> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    return await this.repo.list();
  }

  async findOne(id: string, req: Request): Promise<LeaderResponseDto> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    const leader = await this.repo.findOneWithSheltersAndTeachersOrFail(id);
    return toLeaderDto(leader);
  }

  async createForUser(userId: string) {
    return this.repo.createForUser(userId);
  }

  async removeByUserId(userId: string) {
    return this.repo.removeByUserId(userId);
  }

  /**
   * Vincula líder a uma equipe de um abrigo
   * Se já estiver vinculado a outra equipe, move para a nova
   */
  async manageTeam(leaderId: string, dto: ManageLeaderTeamDto, req: Request): Promise<LeaderResponseDto> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    // Buscar o líder
    const leader = await this.repo.findOneWithSheltersAndTeachersOrFail(leaderId);

    // Buscar equipes do abrigo
    const teams = await this.teamsService.findByShelter(dto.shelterId);

    // Buscar ou criar equipe com o número especificado
    let targetTeam = teams.find(t => t.numberTeam === dto.numberTeam);

    if (!targetTeam) {
      // Criar nova equipe
      const newTeam = await this.teamsService.create({
        numberTeam: dto.numberTeam,
        shelterId: dto.shelterId,
        leaderProfileIds: [leaderId],
      });
      targetTeam = newTeam;
    } else {
      // Se o líder já está em outra equipe, remover primeiro
      if (leader.team && leader.team.id !== targetTeam.id) {
        const currentTeam = await this.teamsService.findOne(leader.team.id);
        if (currentTeam) {
          const currentLeaderIds = currentTeam.leaders.map(l => l.id).filter(id => id !== leaderId);
          await this.teamsService.update(currentTeam.id, {
            leaderProfileIds: currentLeaderIds,
          });
        }
      }

      // Adicionar à equipe (se já não estiver nela)
      if (!leader.team || leader.team.id !== targetTeam.id) {
        const currentLeaderIds = targetTeam.leaders.map(l => l.id).filter(id => id !== leaderId);
        await this.teamsService.update(targetTeam.id, {
          leaderProfileIds: [...currentLeaderIds, leaderId],
        });
      }
    }

    return this.findOne(leaderId, req);
  }
}
