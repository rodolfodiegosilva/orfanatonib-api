import { Exclude, Expose, Type, Transform, plainToInstance } from 'class-transformer';
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
class TeamMiniDto {
  @Expose() id!: string;
  @Expose() numberTeam!: number;
  @Expose() description?: string;
}

@Exclude()
export class ShelterMiniWithCoordinatorDto {
  @Expose() id!: string;
  @Expose() name!: string;

  @Expose()
  @Type(() => TeamMiniDto)
  team!: TeamMiniDto | null;

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
  @Type(() => ShelterMiniWithCoordinatorDto)
  @Transform(({ obj }) => {
    // Se o líder não tem equipe, não tem abrigo
    if (!obj.team || !obj.team.shelter) {
      return null;
    }

    // Montar o shelter com a equipe dentro
    return {
      id: obj.team.shelter.id,
      name: obj.team.shelter.name,
      team: {
        id: obj.team.id,
        numberTeam: obj.team.numberTeam,
        description: obj.team.description,
      },
      teachers: obj.team.teachers && Array.isArray(obj.team.teachers)
        ? obj.team.teachers.map((t: any) => ({
            id: t.id,
            active: t.active,
            user: t.user,
          }))
        : [],
    };
  })
  shelter!: ShelterMiniWithCoordinatorDto | null;

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
