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
  // Paginação
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number = 20;

  // 🔍 Busca unificada: nome do abrigo, nome do responsável ou telefone do responsável
  @IsOptional() @IsString()
  searchString?: string;

  // ✝️ Filtro: aceitou Jesus
  // 'accepted' - tem pelo menos uma decisão de aceitar Jesus (ACCEPTED ou RECONCILED)
  // 'not_accepted' - não tem nenhuma decisão ou todas são null
  // 'all' ou undefined - retorna todos (padrão)
  @IsOptional() @IsIn(['accepted', 'not_accepted', 'all'])
  acceptedJesus?: 'accepted' | 'not_accepted' | 'all' = 'all';

  // ✅ Filtro: status ativo
  // 'active' - apenas abrigados ativos
  // 'inactive' - apenas abrigados inativos
  // 'all' ou undefined - retorna todos (padrão)
  @IsOptional() @IsIn(['active', 'inactive', 'all'])
  active?: 'active' | 'inactive' | 'all' = 'all';
}