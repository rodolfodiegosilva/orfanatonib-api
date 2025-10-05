import { Exclude, Expose, Type, Transform, plainToInstance } from 'class-transformer';
import { Weekday } from 'src/modules/shelters/enums/weekday.enum/weekday.enum';
import { LeaderProfileEntity } from '../entities/leader-profile.entity/leader-profile.entity';

@Exclude()
class UserMiniDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
  @Expose()
  email!: string;
  @Expose()
  phone!: string;
  @Expose()
  active!: boolean;
  @Expose()
  completed!: boolean;
  @Expose()
  commonUser!: boolean;
}

@Exclude()
export class TeacherMiniDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class ShelterWithTeachersDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() number!: number;
  @Expose() weekday!: Weekday;

  @Expose()
  @Type(() => TeacherMiniDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  teachers!: TeacherMiniDto[];
}

@Exclude()
export class LeaderMiniDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class LeaderResponseDto {
  @Expose()
  id!: string;

  @Expose()
  active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;

  @Expose()
  @Type(() => ShelterWithTeachersDto)
  shelter!: ShelterWithTeachersDto | null;

  @Expose()
  createdAt!: Date;
  @Expose()
  updatedAt!: Date;
}

export function toLeaderDto(entity: LeaderProfileEntity): LeaderResponseDto {
  return plainToInstance(LeaderResponseDto, entity, { excludeExtraneousValues: true });
}
export function toLeaderMini(entity: LeaderProfileEntity): LeaderMiniDto {
  return plainToInstance(LeaderMiniDto, entity, { excludeExtraneousValues: true });
}
