import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';

import { UserRepository } from './user.repository';
import { CreateUserService } from './services/create-user.service';
import { GetUsersService } from './services/get-user.service';
import { UserController } from './user.controller';

import { TeacherProfilesModule } from 'src/modules/teacher-profiles/teacher-profiles.module';
import { LeaderProfilesModule } from 'src/modules/leader-profiles/leader-profiles.module';
import { UpdateUserService } from './services/update-user.service';
import { DeleteUserService } from './services/delete-user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ShelterEntity]),
    TeacherProfilesModule,
    LeaderProfilesModule,
  ],
  providers: [UserRepository, CreateUserService, GetUsersService, UpdateUserService, DeleteUserService],
  controllers: [UserController],
  exports: [UserRepository,  CreateUserService, GetUsersService, UpdateUserService, DeleteUserService, TypeOrmModule],
})
export class UserModule {}
