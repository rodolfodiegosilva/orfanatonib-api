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
   * Agora um líder pode estar em múltiplas equipes (do mesmo ou de diferentes abrigos)
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
      // Verificar se o líder já está na equipe
      const isAlreadyInTeam = targetTeam.leaders.some(l => l.id === leaderId);
      
      if (!isAlreadyInTeam) {
        // Adicionar o líder à equipe (sem remover de outras equipes)
        const currentLeaderIds = targetTeam.leaders.map(l => l.id);
        await this.teamsService.update(targetTeam.id, {
          leaderProfileIds: [...currentLeaderIds, leaderId],
        });
      }
    }

    return this.findOne(leaderId, req);
  }
}
