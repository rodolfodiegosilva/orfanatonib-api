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

  // 👶 Filtro de nome do abrigado
  @IsOptional() @IsString()
  shelteredName?: string;

  // 🏠 Filtros de abrigo
  @IsOptional() @IsString()
  shelterFilters?: string;

  // 🏙️ Filtro de endereço
  @IsOptional() @IsString()
  addressFilter?: string;

  // 🌍 Busca geográfica - busca em todos os campos geográficos
  @IsOptional() @IsString()
  geographicSearchString?: string;

  // 👤 Filtros pessoais
  @IsOptional() @IsString()
  gender?: string;

  @IsOptional() @IsString()
  birthDate?: string;

  @IsOptional() @IsString()
  birthDateFrom?: string;

  @IsOptional() @IsString()
  birthDateTo?: string;

  @IsOptional() @IsString()
  joinedAt?: string;

  @IsOptional() @IsString()
  joinedFrom?: string;

  @IsOptional() @IsString()
  joinedTo?: string;

  // Filtros legados (para compatibilidade)
  @IsOptional() @IsString()
  searchString?: string;

  @IsOptional() @IsUUID()
  shelterId?: string;

  @IsOptional() @IsString()
  shelterName?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  state?: string;
}

export class QueryShelteredSimpleDto {
  @IsOptional() @IsString()
  searchString?: string;

  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number = 20;
}