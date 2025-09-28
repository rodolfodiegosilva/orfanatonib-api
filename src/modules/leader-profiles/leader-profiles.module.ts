import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeaderProfileEntity } from './entities/leader-profile.entity/leader-profile.entity';
import { LeaderProfilesRepository } from './repositories/leader-profiles.repository';
import { LeaderProfilesService } from './services/leader-profiles.service';
import { LeaderProfilesController } from './leader-profiles.controller';

import { TeacherProfilesModule } from '../teacher-profiles/teacher-profiles.module';
import { SheltersModule } from '../shelters/shelters.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaderProfileEntity]),
    forwardRef(() => TeacherProfilesModule),
    forwardRef(() => SheltersModule),
    forwardRef(() => UserModule),
  ],
  controllers: [LeaderProfilesController],
  providers: [LeaderProfilesRepository, LeaderProfilesService],
  exports: [LeaderProfilesRepository, LeaderProfilesService, TypeOrmModule],
})
export class LeaderProfilesModule {}
