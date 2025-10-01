import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { TeacherProfilesService } from 'src/modules/teacher-profiles/services/teacher-profiles.service';
import { LeaderProfilesService } from 'src/modules/leader-profiles/services/leader-profiles.service';

@Injectable()
export class DeleteUserService {
  private readonly logger = new Logger(DeleteUserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly teacherService: TeacherProfilesService,
    private readonly leaderService: LeaderProfilesService,
  ) {}

  async remove(id: string): Promise<{ message: string }> {
    this.logger.debug(`Removing user ID: ${id}`);
    await this.teacherService.removeByUserId(id);
    await this.leaderService.removeByUserId(id);
    await this.userRepo.delete(id);
    this.logger.log(`User removed: ${id}`);
    return { message: 'UserEntity deleted' };
  }
}
