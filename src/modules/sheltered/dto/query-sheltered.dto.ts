import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 📋 DTO para query de sheltered com filtros agrupados logicamente
 */
export class QueryShelteredDto {
  // Paginação
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number = 20;

  // Ordenação
  @IsOptional() @IsIn(['name', 'birthDate', 'joinedAt', 'createdAt', 'updatedAt'])
  orderBy?: 'name' | 'birthDate' | 'joinedAt' | 'createdAt' | 'updatedAt' = 'name';

  @IsOptional() @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC';

  // 🔍 Busca unificada: nome do abrigado, nome do responsável ou número do responsável
  @IsOptional() @IsString()
  searchString?: string;

  // Filtro por ID do abrigo
  @IsOptional() @IsUUID()
  shelterId?: string;
}

export class QueryShelteredSimpleDto {
  @IsOptional() @IsString()
  searchString?: string;

  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number = 20;
}