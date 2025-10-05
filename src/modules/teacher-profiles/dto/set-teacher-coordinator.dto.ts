import { IsUUID } from 'class-validator';

export class SetTeacherCoordinatorDto {
  @IsUUID()
  leaderUserId!: string;
}
