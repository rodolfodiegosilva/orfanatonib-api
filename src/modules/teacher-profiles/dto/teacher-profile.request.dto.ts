import { IsOptional, IsUUID } from 'class-validator';

export class AssignTeacherToShelterDto {
  @IsUUID()
  shelterId!: string;
}

export class UnassignTeacherFromShelterDto {
  @IsOptional()
  @IsUUID()
  shelterId?: string;
}
