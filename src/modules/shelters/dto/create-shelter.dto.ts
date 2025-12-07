import {
  IsOptional,
  IsUUID,
  ValidateNested,
  IsString,
  IsArray,
  ArrayUnique,
  Length,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UploadType, PlatformType } from 'src/share/media/media-item/media-item.entity';

class AddressInputDto {
  @IsString() street!: string;
  @IsOptional() @IsString() number?: string;
  @IsString() district!: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsString() postalCode!: string;
  @IsOptional() @IsString() complement?: string;
}

class MediaItemInputDto {
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

export class CreateShelterDto {
  @IsString() @Length(2, 255)
  name!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber() @IsNumber({}, { message: 'teamsQuantity deve ser um número' })
  teamsQuantity!: number;

  @ValidateNested()
  @Type(() => AddressInputDto)
  address!: AddressInputDto;

  // ❌ REMOVIDO: leaderProfileIds - Agora feito através de Teams
  // ❌ REMOVIDO: teacherProfileIds - Agora feito através de Teams

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaItemInputDto)
  mediaItem?: MediaItemInputDto;
}
