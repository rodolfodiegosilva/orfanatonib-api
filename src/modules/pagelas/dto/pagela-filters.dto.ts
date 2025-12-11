import { IsOptional, IsUUID, IsString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Decorator customizado para boolean que funciona antes da conversão implícita
const BooleanQuery = () => {
  return Transform(({ value, key, obj }) => {
    // Intercepta o valor original antes de qualquer conversão
    const originalValue = obj[key];
    
    if (originalValue === undefined || originalValue === null || originalValue === '') return undefined;
    
    // Se já é boolean, retorna como está
    if (typeof originalValue === 'boolean') return originalValue;
    
    // Se é string, converte baseado no conteúdo
    const s = String(originalValue).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(s)) return true;
    if (['false', '0', 'no', 'n'].includes(s)) return false;
    
    return undefined;
  });
};

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
  @BooleanQuery()
  @IsBoolean()
  present?: boolean;

  // 🔍 Busca unificada: número da visita, ano, observação ou nome do professor que lançou a pagela
  @IsOptional()
  @IsString()
  searchString?: string;
}
