import {
  IsOptional,
  IsUUID,
  IsString,
  ValidateIf,
  ValidateNested,
  IsArray,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressPatchDto {
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() complement?: string;
}

export class UpdateShelterDto {
  @IsOptional() @IsString() @Length(2, 255)
  name?: string;

  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string')
  @Matches(/^([01]?\d|2[0-3]):([0-5]\d)$/, { message: 'time deve ser H:mm ou HH:mm (0:00–23:59)' })
  time?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  leaderProfileId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPatchDto)
  address?: AddressPatchDto;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teacherProfileIds?: string[];
}
