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

  // 🔍 FILTROS CONSOLIDADOS
  
  // Busca geral: nome do abrigado, responsável ou telefone
  @IsOptional() @IsString()
  shelteredSearchingString?: string;

  // Filtro de endereço: todos os campos de endereço
  @IsOptional() @IsString()
  addressFilter?: string;

  // Filtro por gênero
  @IsOptional() @IsIn(['M', 'F'])
  gender?: string;

  // Range de data de nascimento
  @IsOptional() @IsString()
  birthDateFrom?: string;

  @IsOptional() @IsString()
  birthDateTo?: string;

  // Range de data "no abrigo desde"
  @IsOptional() @IsString()
  joinedFrom?: string;

  @IsOptional() @IsString()
  joinedTo?: string;
}

export class QueryShelteredSimpleDto {
  @IsOptional() @IsString()
  searchString?: string;

  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number = 20;
}