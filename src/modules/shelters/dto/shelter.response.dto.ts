import { Exclude, Expose, Type, Transform, plainToInstance } from 'class-transformer';
import { AddressResponseDto } from 'src/modules/addresses/dto/address.response.dto';
import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';

@Exclude()
class UserMiniDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() email!: string;
  @Expose() phone!: string;
  @Expose() active!: boolean;
  @Expose() completed!: boolean;
  @Expose() commonUser!: boolean;
}

@Exclude()
class CoordinatorWithUserDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
class TeacherWithUserDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class ChelterMiniDto {
  @Expose() id!: string;
  @Expose() name!: string;
}

@Exclude()
export class ShelterSimpleResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;

  @Expose()
  @Type(() => AddressResponseDto)
  address!: AddressResponseDto;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

@Exclude()
export class ShelterResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;

  @Expose()
  @Type(() => AddressResponseDto)
  address!: AddressResponseDto;

  @Expose()
  @Type(() => CoordinatorWithUserDto)
  @Transform(({ value }) => value ?? null)
  leader!: CoordinatorWithUserDto | null;

  @Expose()
  @Type(() => TeacherWithUserDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  teachers!: TeacherWithUserDto[];

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

export function toShelterSimpleDto(entity: ShelterEntity): ShelterSimpleResponseDto {
  return plainToInstance(ShelterSimpleResponseDto, entity, { excludeExtraneousValues: true });
}
export function toShelterDto(entity: ShelterEntity): ShelterResponseDto {
  return plainToInstance(ShelterResponseDto, entity, { excludeExtraneousValues: true });
}
