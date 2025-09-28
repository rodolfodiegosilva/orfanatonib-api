import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { DeleteSheltersService } from './services/delete-shelters.service';
import { UpdateSheltersService } from './services/update-shelters.service';
import { GetSheltersService } from './services/get-shelters.service';
import { CreateSheltersService } from './services/create-shelters.service';

import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { QuerySheltersDto } from './dto/query-shelters.dto';
import { Paginated } from 'src/share/dto/paginated.dto';
import { ShelterResponseDto, ShelterSimpleResponseDto, toShelterDto } from './dto/shelter.response.dto';
import { ShelterSelectOptionDto } from './dto/shelter-select-option.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('shelters')
@UseGuards(JwtAuthGuard)
export class SheltersController {
  constructor(
    private readonly deleteService: DeleteSheltersService,
    private readonly updateService: UpdateSheltersService,
    private readonly getService: GetSheltersService,
    private readonly createService: CreateSheltersService,
  ) {}

  @Get()
  findAllPaginated(
    @Query() q: QuerySheltersDto,
    @Req() req: Request,
  ): Promise<Paginated<ShelterResponseDto>> {
    return this.getService.findAllPaginated(q, req);
  }

  @Get('simple')
  async findAllSimple(@Req() req: Request): Promise<ShelterSimpleResponseDto[]> {
    return this.getService.findAllSimple(req);
  }

  @Get('list')
  async list(@Req() req: Request): Promise<ShelterSelectOptionDto[]> {
    return this.getService.list(req);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    return this.getService.findOne(id, req);
  }

  @Post()
  async create(
    @Body() dto: CreateShelterDto,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.createService.create(dto, req);
    return toShelterDto(entity);
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateShelterDto,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.updateService.update(id, dto, req);
    return toShelterDto(entity);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.deleteService.remove(id, req);
  }
}