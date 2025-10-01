import {
  IsOptional,
  IsUUID,
  IsString,
  ValidateIf,
  ValidateNested,
  IsArray,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class UpdateShelterDto {
  @IsOptional() @IsString() @Length(2, 255)
  name?: string;


  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  leaderProfileIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPatchDto)
  address?: AddressPatchDto;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teacherProfileIds?: string[];
}
