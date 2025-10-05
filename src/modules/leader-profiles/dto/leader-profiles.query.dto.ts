import { Transform, Type, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Decorator customizado para boolean que funciona antes da conversão implícita
const BooleanQuery = () => {
  return Transform(({ value, key, obj }) => {
    // Intercepta o valor original antes de qualquer conversão
    const originalValue = obj[key];
    console.log(`BooleanQuery interceptou ${key}:`, originalValue, 'tipo:', typeof originalValue);
    
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
const toInt = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
};
const trimOrUndef = (v: any): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t : undefined;
};

export class LeaderProfilesQueryDto {
  // 🔍 FILTROS CONSOLIDADOS
  
  // Busca pelos dados do líder: nome, email, telefone
  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  leaderSearchString?: string;

  // Busca por todos os campos do shelter
  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  shelterSearchString?: string;

  // Se está vinculado a algum shelter ou não
  @IsOptional()
  @BooleanQuery()
  hasShelter?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 12;

  @IsOptional()
  @IsIn(['updatedAt', 'createdAt', 'name'])
  sort: 'updatedAt' | 'createdAt' | 'name' = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

export class PageDto<T> {
  items!: T[];
  total!: number;
  page!: number;
  limit!: number;
}
