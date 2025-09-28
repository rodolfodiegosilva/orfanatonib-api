import {
  IsOptional,
  IsUUID,
  ValidateNested,
  IsString,
  IsArray,
  ArrayUnique,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressInputDto {
  @IsString() street!: string;
  @IsOptional() @IsString() number?: string;
  @IsString() district!: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsString() postalCode!: string;
  @IsOptional() @IsString() complement?: string;
}

export class CreateShelterDto {
  @IsString() @Length(2, 255)
  name!: string;

  @IsOptional()
  @Matches(/^([01]?\d|2[0-3]):([0-5]\d)$/, { message: 'time deve ser H:mm ou HH:mm (0:00–23:59)' })
  time?: string;

  @ValidateNested()
  @Type(() => AddressInputDto)
  address!: AddressInputDto;

  @IsOptional() @IsUUID()
  leaderProfileId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  teacherProfileIds?: string[];
}
