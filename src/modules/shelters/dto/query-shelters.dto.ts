import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString, IsIn } from 'class-validator';

export class QuerySheltersDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;

  @IsOptional() @IsString()
  searchString?: string;

  @IsOptional() @IsString()
  nameSearchString?: string;

  @IsOptional() @IsString()
  leaderId?: string;

  @IsOptional()
  @IsIn(['name', 'time', 'createdAt', 'updatedAt', 'city', 'state'])
  sort?: 'name' | 'time' | 'createdAt' | 'updatedAt' | 'city' | 'state' = 'name';

  @IsOptional() @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC';
}
