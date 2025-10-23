import { Exclude, Expose, Type, Transform, plainToInstance } from 'class-transformer';
import { AddressResponseDto } from 'src/modules/addresses/dto/address.response.dto';
import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';
import { MediaItemEntity, MediaType, UploadType, PlatformType } from 'src/share/media/media-item/media-item.entity';

@Exclude()
class UserMiniDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() email!: string;
  @Expose() phone!: string;
  @Expose() active!: boolean;
  @Expose() completed!: boolean;
  @Expose() commonUser!: boolean;
}

@Exclude()
class MediaItemResponseDto {
  @Expose() id!: string;
  @Expose() title!: string;
  @Expose() description!: string;
  @Expose() mediaType!: MediaType; // Sempre será MediaType.IMAGE
  @Expose() uploadType!: UploadType;
  @Expose() url!: string;
  @Expose() isLocalFile!: boolean;
  @Expose() platformType?: PlatformType;
  @Expose() originalName?: string;
  @Expose() size?: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  static fromEntity(entity: MediaItemEntity): MediaItemResponseDto {
    return plainToInstance(MediaItemResponseDto, entity, { excludeExtraneousValues: true });
  }
}

@Exclude()
class CoordinatorWithUserDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
class TeacherWithUserDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserMiniDto)
  user!: UserMiniDto;
}

@Exclude()
export class ChelterMiniDto {
  @Expose() id!: string;
  @Expose() name!: string;
}

@Exclude()
export class ShelterSimpleResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() description?: string;

  @Expose()
  @Type(() => AddressResponseDto)
  address!: AddressResponseDto;

  @Expose()
  @Type(() => MediaItemResponseDto)
  @Transform(({ value }) => value ? MediaItemResponseDto.fromEntity(value) : null)
  mediaItem?: MediaItemResponseDto | null;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

@Exclude()
export class ShelterResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() description?: string;

  @Expose()
  @Type(() => AddressResponseDto)
  address!: AddressResponseDto;

  @Expose()
  @Type(() => CoordinatorWithUserDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  leaders!: CoordinatorWithUserDto[];

  @Expose()
  @Type(() => TeacherWithUserDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  teachers!: TeacherWithUserDto[];

  @Expose()
  @Type(() => MediaItemResponseDto)
  @Transform(({ value }) => value ? MediaItemResponseDto.fromEntity(value) : null)
  mediaItem?: MediaItemResponseDto | null;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

export function toShelterSimpleDto(entity: ShelterEntity): ShelterSimpleResponseDto {
  return plainToInstance(ShelterSimpleResponseDto, entity, { excludeExtraneousValues: true });
}
export function toShelterDto(entity: ShelterEntity): ShelterResponseDto {
  return plainToInstance(ShelterResponseDto, entity, { excludeExtraneousValues: true });
}
