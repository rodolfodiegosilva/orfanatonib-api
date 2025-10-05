import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TeacherProfilesService } from './services/teacher-profiles.service';
import {
  AssignTeacherToShelterDto,
  UnassignTeacherFromShelterDto,
} from './dto/teacher-profile.request.dto';
import { TeacherResponseDto } from './dto/teacher-profile.response.dto';
import { TeacherSimpleListDto } from './dto/teacher-simple-list.dto';
import { PageDto, TeacherProfilesQueryDto } from './dto/teacher-profiles.query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('teacher-profiles')
@UseGuards(JwtAuthGuard)
export class TeacherProfilesController {
  constructor(private readonly service: TeacherProfilesService) {}

  @Get()
  findPage(
    @Req() req: Request,
    @Query() query: TeacherProfilesQueryDto,
  ): Promise<PageDto<TeacherResponseDto>> {
    return this.service.findPage(req, query);
  }

  @Get('simple')
  listSimple(@Req() req: Request): Promise<TeacherSimpleListDto[]> {
    return this.service.list(req);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<TeacherResponseDto> {
    return this.service.findOne(id, req);
  }

  @Get('by-shelter/:shelterId')
  findByShelterId(
    @Param('shelterId', new ParseUUIDPipe()) shelterId: string,
    @Req() req: Request,
  ): Promise<TeacherResponseDto[]> {
    return this.service.findByShelterId(shelterId, req);
  }

  @Patch(':teacherId/assign-shelter')
  async assignShelter(
    @Param('teacherId', new ParseUUIDPipe()) teacherId: string,
    @Body() dto: AssignTeacherToShelterDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.service.assignShelter(teacherId, dto.shelterId, req);
    return { message: 'Teacher atribuído ao shelter com sucesso' };
  }

  @Patch(':teacherId/unassign-shelter')
  async unassignShelter(
    @Param('teacherId', new ParseUUIDPipe()) teacherId: string,
    @Body() dto: UnassignTeacherFromShelterDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.service.unassignShelter(teacherId, dto.shelterId, req);
    return { message: 'Teacher removido do shelter com sucesso' };
  }
}
