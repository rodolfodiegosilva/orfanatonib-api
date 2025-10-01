import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaderProfilesService } from './services/leader-profiles.service';
import { LeaderResponseDto } from './dto/leader-profile.response.dto';
import { AssignShelterDto, MoveShelterDto, UnassignShelterDto } from './dto/add-shelter.dto';
import { LeaderSimpleListDto } from './dto/leader-simple-list.dto';
import { LeaderProfilesQueryDto, PageDto } from './dto/leader-profiles.query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Paginated } from 'src/share/dto/paginated.dto';

@Controller('leader-profiles')
@UseGuards(JwtAuthGuard)
export class LeaderProfilesController {
  constructor(private readonly service: LeaderProfilesService) { }

  @Post('create-for-user/:userId')
  async createForUser(@Param('userId') userId: string): Promise<LeaderResponseDto> {
    const leaderProfile = await this.service.createForUser(userId);
    return this.service.findOne(leaderProfile.id);
  }

  @Get()
  async findPage(
    @Query() query: LeaderProfilesQueryDto,
  ): Promise<Paginated<LeaderResponseDto>> {
    const pageDto = await this.service.findPage(query);
    return new Paginated(pageDto.items, pageDto.total, pageDto.page, pageDto.limit);
  }

  @Get('simple')
  listSimple(): Promise<LeaderSimpleListDto[]> {
    return this.service.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<LeaderResponseDto> {
    return this.service.findOne(id);
  }

  @Get('by-shelter/:shelterId')
  findByShelter(
    @Param('shelterId') shelterId: string,
  ): Promise<LeaderResponseDto> {
    return this.service.findByShelterId(shelterId);
  }

  @Patch(':leaderId/assign-shelter')
  async assignShelter(
    @Param('leaderId') leaderId: string,
    @Body() dto: AssignShelterDto,
  ): Promise<{ message: string }> {
    await this.service.assignShelter(leaderId, dto.shelterId);
    return { message: 'Líder atribuído ao shelter com sucesso' };
  }

  @Patch(':leaderId/unassign-shelter')
  async unassignShelter(
    @Param('leaderId') leaderId: string,
    @Body() dto: UnassignShelterDto,
  ): Promise<{ message: string }> {
    await this.service.unassignShelter(leaderId, dto.shelterId);
    return { message: 'Líder removido do shelter com sucesso' };
  }

  @Patch(':fromLeaderId/move-shelter')
  async moveShelter(
    @Param('fromLeaderId') fromLeaderId: string,
    @Body() dto: MoveShelterDto,
  ): Promise<{ message: string }> {
    await this.service.moveShelter(fromLeaderId, dto.shelterId, dto.toLeaderId);
    return { message: 'Shelter movido com sucesso' };
  }
}
