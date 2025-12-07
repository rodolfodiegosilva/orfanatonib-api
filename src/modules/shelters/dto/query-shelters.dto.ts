import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString, IsIn } from 'class-validator';

/**
 * 📋 DTO para query de shelters com filtros simplificados
 */
export class QuerySheltersDto {
  // Paginação
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 10;

  // Ordenação
  @IsOptional() @IsIn(['name', 'createdAt', 'updatedAt', 'city', 'state'])
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'city' | 'state' = 'name';

  @IsOptional() @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC';

  // 🔍 Busca unificada: nome do abrigo, cidade, UF, bairro, nome de professores ou líderes
  @IsOptional() @IsString()
  searchString?: string;

  // 🔍 Filtro específico por nome do abrigo (alternativa ao searchString)
  @IsOptional() @IsString()
  shelterName?: string;
}
