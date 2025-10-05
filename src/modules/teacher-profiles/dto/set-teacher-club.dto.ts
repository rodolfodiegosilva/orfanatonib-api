import { IsInt, Min } from 'class-validator';

export class SetTeacherChelterDto {
  @IsInt()
  @Min(1)
  clubNumber!: number;
}
