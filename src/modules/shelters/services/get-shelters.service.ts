import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { SheltersRepository } from '../repositories/shelters.repository';
import { QuerySheltersDto } from '../dto/query-shelters.dto';
import {
  ShelterResponseDto,
  ShelterSimpleResponseDto,
  toShelterDto,
  toShelterSimpleDto,
} from '../dto/shelter.response.dto';
import { Paginated } from 'src/share/dto/paginated.dto';
import { ShelterSelectOptionDto } from '../dto/shelter-select-option.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class GetSheltersService {
  constructor(
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
  ) {}

  private async getCtx(req: Request): Promise<Ctx> {
    const p = await this.authCtx.tryGetPayload(req);
    return { role: p?.role?.toLowerCase(), userId: p?.sub ?? null };
  }

  async findAllPaginated(q: QuerySheltersDto, req: Request): Promise<Paginated<ShelterResponseDto>> {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    const { page = 1, limit = 10 } = q;
    const { items, total } = await this.sheltersRepository.findAllPaginated(q, ctx);

    return new Paginated(items.map(toShelterDto), total, page, limit);
  }

  async findAllSimple(req: Request): Promise<ShelterSimpleResponseDto[]> {
    const ctx = await this.getCtx(req);
    const shelters = await this.sheltersRepository.findAllSimple(ctx);
    return shelters.map(toShelterSimpleDto);
  }

  async findOne(id: string, req: Request): Promise<ShelterResponseDto> {
    const ctx = await this.getCtx(req);
    const shelter = await this.sheltersRepository.findOneOrFailForResponse(id, ctx);
    if (!shelter) throw new NotFoundException('Shelter não encontrado');
    return toShelterDto(shelter);
  }

  async list(req: Request): Promise<ShelterSelectOptionDto[]> {
    const ctx = await this.getCtx(req);
    return await this.sheltersRepository.list(ctx);
  }
}