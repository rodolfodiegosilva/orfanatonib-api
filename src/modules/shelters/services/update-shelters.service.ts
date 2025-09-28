import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { SheltersRepository } from '../repositories/shelters.repository';
import { UpdateShelterDto } from '../dto/update-shelter.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class UpdateSheltersService {
  constructor(
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
  ) { }

  private async getCtx(req: Request): Promise<Ctx> {
    const p = await this.authCtx.tryGetPayload(req);
    return { role: p?.role?.toLowerCase(), userId: p?.sub ?? null };
  }

  async update(id: string, dto: UpdateShelterDto, req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');

      if (dto.leaderProfileId !== undefined) {
        const myLeaderId = await this.sheltersRepository.getLeaderProfileIdByUserId(ctx.userId!);
        if (!myLeaderId) throw new ForbiddenException('Acesso negado');

        if (dto.leaderProfileId !== null && dto.leaderProfileId !== myLeaderId) {
          throw new ForbiddenException('Não é permitido atribuir outro líder');
        }
        if (dto.leaderProfileId === undefined) {
          dto.leaderProfileId = myLeaderId;
        }
      }
    }

    return this.sheltersRepository.updateShelter(id, dto);
  }
}