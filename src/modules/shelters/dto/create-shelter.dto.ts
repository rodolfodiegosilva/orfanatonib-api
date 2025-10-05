import {
  IsOptional,
  IsUUID,
  ValidateNested,
  IsString,
  IsArray,
  ArrayUnique,
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


  @ValidateNested()
  @Type(() => AddressInputDto)
  address!: AddressInputDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  leaderProfileIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  teacherProfileIds?: string[];
}
