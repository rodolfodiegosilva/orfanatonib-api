import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString, IsIn, IsArray, IsUUID, IsBoolean } from 'class-validator';

/**
 * 📋 DTO para query de shelters com filtros agrupados logicamente
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

  // 🏠 Filtro de nome do abrigo
  @IsOptional() @IsString()
  shelterName?: string;

  // 👥 Filtros de staff (líderes e professores)
  @IsOptional() @IsString()
  staffFilters?: string;

  // 🏙️ Filtro de endereço
  @IsOptional() @IsString()
  addressFilter?: string;

  // Filtros legados (para compatibilidade)
  @IsOptional() @IsString() @IsUUID()
  shelterId?: string;
}
