import { IsString, IsUUID } from 'class-validator';

export class AssignShelterDto {
  @IsUUID()
  shelterId!: string;
}

export class UnassignShelterDto {
  @IsUUID()
  shelterId!: string;
}

export class MoveShelterDto {
  @IsUUID()
  shelterId!: string;

  @IsUUID()
  toLeaderId!: string;
}
