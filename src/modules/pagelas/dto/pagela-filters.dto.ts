import { IsOptional, IsUUID, IsString } from 'class-validator';

export class PagelaFiltersDto {
  @IsOptional()
  @IsUUID()
  shelteredId?: string;

  // 🔍 Busca unificada: número da visita, ano, observação ou nome do professor que lançou a pagela
  @IsOptional()
  @IsString()
  searchString?: string;
}
