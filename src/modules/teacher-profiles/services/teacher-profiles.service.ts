import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';

import { TeacherProfilesRepository } from '../repositories/teacher-profiles.repository';
import {
  TeacherResponseDto,
  toTeacherDto,
} from '../dto/teacher-profile.response.dto';
import { TeacherSimpleListDto } from '../dto/teacher-simple-list.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';
import { PageDto, TeacherProfilesQueryDto } from '../dto/teacher-profiles.query.dto';

type AccessCtx = { role?: string; userId?: string | null };

@Injectable()
export class TeacherProfilesService {
  constructor(
    private readonly repo: TeacherProfilesRepository,
    private readonly authCtx: AuthContextService,
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
    query: TeacherProfilesQueryDto,
  ): Promise<PageDto<TeacherResponseDto>> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    const { items, total, page, limit } = await this.repo.findPageWithFilters(query, ctx);
    return {
      items: items.map(toTeacherDto),
      total,
      page,
      limit,
    };
  }
  private assertAllowed(ctx: AccessCtx) {
    if (!ctx.role) throw new ForbiddenException('Acesso negado');
    if (ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');
  }

  async findAll(req: Request): Promise<TeacherResponseDto[]> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    const teachers = await this.repo.findAllWithShelterAndLeader(ctx);
    return teachers.map(toTeacherDto);
  }

  async list(req: Request): Promise<TeacherSimpleListDto[]> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    return await this.repo.list(ctx);
  }

  async findOne(id: string, req: Request): Promise<TeacherResponseDto> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    const teacher = await this.repo.findOneWithShelterAndLeaderOrFail(id, ctx);
    return toTeacherDto(teacher);
  }

  async findByShelterId(shelterId: string, req: Request): Promise<TeacherResponseDto[]> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    const teachers = await this.repo.findByShelterIdWithLeader(shelterId, ctx);
    return teachers.map(toTeacherDto);
  }

  async assignShelter(teacherId: string, shelterId: string, req: Request): Promise<void> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    if (ctx.role !== 'admin') {
      const allowed = await this.repo.userHasAccessToShelter(shelterId, ctx);
      if (!allowed) throw new ForbiddenException('Sem acesso ao shelter informado');
    }
    await this.repo.assignTeacherToShelter(teacherId, shelterId);
  }

  async unassignShelter(teacherId: string, expectedShelterId: string | undefined, req: Request): Promise<void> {
    const ctx = await this.getCtx(req);
    this.assertAllowed(ctx);

    if (ctx.role !== 'admin') {
      if (expectedShelterId) {
        const allowed = await this.repo.userHasAccessToShelter(expectedShelterId, ctx);
        if (!allowed) throw new ForbiddenException('Sem acesso ao shelter informado');
      } else {
        const t = await this.repo.findOneWithShelterAndLeaderOrFail(teacherId, ctx);
        const currentShelterId = t.shelter?.id;
        if (currentShelterId) {
          const allowed = await this.repo.userHasAccessToShelter(currentShelterId, ctx);
          if (!allowed) throw new ForbiddenException('Sem acesso ao shelter atual do teacher');
        } else {
          throw new ForbiddenException('Teacher não possui shelter para desvincular');
        }
      }
    }

    await this.repo.unassignTeacherFromShelter(teacherId, expectedShelterId);
  }

  async createForUser(userId: string) {
    return this.repo.createForUser(userId);
  }

  async removeByUserId(userId: string) {
    return this.repo.removeByUserId(userId);
  }
}
