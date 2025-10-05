import { ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SheltersRepository } from '../repositories/shelters.repository';
import { CreateShelterDto } from '../dto/create-shelter.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class CreateSheltersService {
  constructor(
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
  ) { }

  private async getCtx(req: Request): Promise<Ctx> {
    const p = await this.authCtx.tryGetPayload(req);
    return { role: p?.role?.toLowerCase(), userId: p?.sub ?? null };
  }

  async create(dto: CreateShelterDto, req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') {
      throw new ForbiddenException('Acesso negado');
    }

    if (ctx.role === 'leader') {
      const myLeaderId = await this.sheltersRepository.getLeaderProfileIdByUserId(ctx.userId!);
      if (!myLeaderId) throw new ForbiddenException('Acesso negado');

      if (dto.leaderProfileIds && dto.leaderProfileIds.length > 0) {
        // Verificar se o líder atual está na lista
        if (!dto.leaderProfileIds.includes(myLeaderId)) {
          throw new ForbiddenException('Não é permitido atribuir outros líderes');
        }
      } else {
        // Se não especificado, usar apenas o líder atual
        dto.leaderProfileIds = [myLeaderId];
      }
    }

    return this.sheltersRepository.createShelter(dto);
  }
}