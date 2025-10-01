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

      if (dto.leaderProfileIds !== undefined) {
        const myLeaderId = await this.sheltersRepository.getLeaderProfileIdByUserId(ctx.userId!);
        if (!myLeaderId) throw new ForbiddenException('Acesso negado');

        // Verificar se o líder atual está na lista ou se está removendo todos
        if (dto.leaderProfileIds.length > 0 && !dto.leaderProfileIds.includes(myLeaderId)) {
          throw new ForbiddenException('Não é permitido atribuir outros líderes');
        }
      }
    }

    return this.sheltersRepository.updateShelter(id, dto);
  }

  async assignLeaders(id: string, leaderProfileIds: string[], req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');

      const myLeaderId = await this.sheltersRepository.getLeaderProfileIdByUserId(ctx.userId!);
      if (!myLeaderId) throw new ForbiddenException('Acesso negado');

      // Verificar se o líder atual está na lista
      if (!leaderProfileIds.includes(myLeaderId)) {
        throw new ForbiddenException('Não é permitido atribuir outros líderes');
      }
    }

    return this.sheltersRepository.assignLeaders(id, leaderProfileIds);
  }

  async removeLeaders(id: string, leaderProfileIds: string[], req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');

      const myLeaderId = await this.sheltersRepository.getLeaderProfileIdByUserId(ctx.userId!);
      if (!myLeaderId) throw new ForbiddenException('Acesso negado');

      // Verificar se está tentando remover outros líderes além de si mesmo
      const otherLeaders = leaderProfileIds.filter(id => id !== myLeaderId);
      if (otherLeaders.length > 0) {
        throw new ForbiddenException('Não é permitido remover outros líderes');
      }
    }

    return this.sheltersRepository.removeLeaders(id, leaderProfileIds);
  }

  async assignTeachers(id: string, teacherProfileIds: string[], req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');
    }

    return this.sheltersRepository.assignTeachers(id, teacherProfileIds);
  }

  async removeTeachers(id: string, teacherProfileIds: string[], req: Request) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');
    }

    return this.sheltersRepository.removeTeachers(id, teacherProfileIds);
  }
}