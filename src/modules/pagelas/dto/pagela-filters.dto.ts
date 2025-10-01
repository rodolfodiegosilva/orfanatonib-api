import { IsBooleanString, IsInt, IsOptional, IsUUID, Max, Min, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PagelaFiltersDto {
  @IsOptional()
  @IsUUID()
  shelteredId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(9999)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  visit?: number;

  @IsOptional()
  @IsBooleanString()
  present?: 'true' | 'false';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchString?: string;
}
