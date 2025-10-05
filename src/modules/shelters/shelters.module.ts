import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SheltersController } from './shelters.controller';
import { DeleteSheltersService } from './services/delete-shelters.service';
import { UpdateSheltersService } from './services/update-shelters.service';
import { GetSheltersService } from './services/get-shelters.service';
import { CreateSheltersService } from './services/create-shelters.service';

import { SheltersRepository } from './repositories/shelters.repository';
import { ShelterEntity } from './entities/shelter.entity/shelter.entity';

import { TeacherProfilesModule } from '../teacher-profiles/teacher-profiles.module';
import { AddressesModule } from '../addresses/addresses.module';
import { LeaderProfilesModule } from '../leader-profiles/leader-profiles.module';
import { AddressEntity } from '../addresses/entities/address.entity/address.entity';
import { ShelteredModule } from '../sheltered/sheltered.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShelterEntity, AddressEntity]),
    forwardRef(() => AddressesModule),
    forwardRef(() => TeacherProfilesModule),
    forwardRef(() => LeaderProfilesModule),
    forwardRef(() => ShelteredModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [SheltersController],
  providers: [
    DeleteSheltersService,
    UpdateSheltersService,
    GetSheltersService,
    CreateSheltersService,
    SheltersRepository,
  ],
  exports: [
    DeleteSheltersService,
    UpdateSheltersService,
    GetSheltersService,
    CreateSheltersService,
    SheltersRepository,
    TypeOrmModule,
  ],
})
export class SheltersModule { }
