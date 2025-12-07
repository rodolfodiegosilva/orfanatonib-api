import {
  IsOptional,
  IsUUID,
  IsString,
  ValidateIf,
  ValidateNested,
  IsArray,
  Length,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UploadType, PlatformType } from 'src/share/media/media-item/media-item.entity';

export class AddressPatchDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() createdAt?: string;
  @IsOptional() @IsString() updatedAt?: string;
}

export class MediaItemDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(UploadType) uploadType?: UploadType;
  @IsOptional() @IsEnum(PlatformType) platformType?: PlatformType;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsBoolean() isLocalFile?: boolean;
  @IsOptional() @IsString() originalName?: string;
  @IsOptional() @IsNumber() size?: number;
  @IsOptional() @IsString() fieldKey?: string;
}

export class UpdateShelterDto {
  @IsOptional() @IsString() @Length(2, 255)
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber() @IsNumber({}, { message: 'teamsQuantity deve ser um número' })
  teamsQuantity!: number;

  // ❌ REMOVIDO: leaderProfileIds - Agora feito através de Teams
  // ❌ REMOVIDO: teacherProfileIds - Agora feito através de Teams

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPatchDto)
  address?: AddressPatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaItemDto)
  mediaItem?: MediaItemDto;
}
