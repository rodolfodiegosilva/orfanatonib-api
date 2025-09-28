import { Injectable } from '@nestjs/common';
import { LeaderProfilesRepository } from '../repositories/leader-profiles.repository';
import {
  LeaderResponseDto,
  toLeaderDto,
} from '../dto/leader-profile.response.dto';
import { LeaderSimpleListDto } from '../dto/leader-simple-list.dto';
import { LeaderProfilesQueryDto, PageDto } from '../dto/leader-profiles.query.dto';

@Injectable()
export class LeaderProfilesService {
  constructor(private readonly repo: LeaderProfilesRepository) { }

    async findPage(query: LeaderProfilesQueryDto): Promise<PageDto<LeaderResponseDto>> {
      console.log("Buscando página com filtros:", query);

    const { items, total, page, limit } = await this.repo.findPageWithFilters(query);
    return {
      items: items.map(toLeaderDto),
      total,
      page,
      limit,
    };
  }

  async findAll(): Promise<LeaderResponseDto[]> {
    const leaders = await this.repo.findAllWithSheltersAndTeachers();
    return leaders.map(toLeaderDto);
  }

  async list(): Promise<LeaderSimpleListDto[]> {
    return await this.repo.list();
  }

  async findOne(id: string): Promise<LeaderResponseDto> {
    const leader = await this.repo.findOneWithSheltersAndTeachersOrFail(id);
    return toLeaderDto(leader);
  }

  async findByShelterId(shelterId: string): Promise<LeaderResponseDto> {
    const leader = await this.repo.findByShelterIdWithTeachersOrFail(shelterId);
    return toLeaderDto(leader);
  }

  async assignShelter(leaderId: string, shelterId: string): Promise<void> {
    await this.repo.assignShelterToLeader(leaderId, shelterId);
  }

  async unassignShelter(leaderId: string, shelterId: string): Promise<void> {
    await this.repo.unassignShelterFromLeader(leaderId, shelterId);
  }

  async moveShelter(fromLeaderId: string, shelterId: string, toLeaderId: string): Promise<void> {
    await this.repo.moveShelterBetweenLeaders(fromLeaderId, shelterId, toLeaderId);
  }

  async createForUser(userId: string) {
    return this.repo.createForUser(userId);
  }
  async removeByUserId(userId: string) {
    return this.repo.removeByUserId(userId);
  }
}
