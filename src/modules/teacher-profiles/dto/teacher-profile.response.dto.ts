import { Exclude, Expose, Type, Transform, plainToInstance } from 'class-transformer';
import { TeacherProfileEntity } from '../entities/teacher-profile.entity/teacher-profile.entity';

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
export class TeacherMiniDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class CoordinatorMiniDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class ShelterMiniWithCoordinatorDto {
  @Expose() id!: string;
  @Expose() name!: string;

  @Expose()
  @Type(() => CoordinatorMiniDto)
  @Transform(({ value }) => value ?? null)
  leader!: CoordinatorMiniDto | null;
}

@Exclude()
export class TeacherResponseDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;

  @Expose()
  @Type(() => ShelterMiniWithCoordinatorDto)
  @Transform(({ value }) => value ?? null)
  shelter!: ShelterMiniWithCoordinatorDto | null;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

export function toTeacherDto(entity: TeacherProfileEntity): TeacherResponseDto {
  return plainToInstance(TeacherResponseDto, entity, { excludeExtraneousValues: true });
}
