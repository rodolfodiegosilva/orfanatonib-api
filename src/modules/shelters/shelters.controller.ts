import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { DeleteSheltersService } from './services/delete-shelters.service';
import { UpdateSheltersService } from './services/update-shelters.service';
import { GetSheltersService } from './services/get-shelters.service';
import { CreateSheltersService } from './services/create-shelters.service';

import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { QuerySheltersDto } from './dto/query-shelters.dto';
import { Paginated } from 'src/share/dto/paginated.dto';
import { ShelterResponseDto, ShelterSimpleResponseDto, toShelterDto } from './dto/shelter.response.dto';
import { ShelterSelectOptionDto } from './dto/shelter-select-option.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadType } from 'src/share/media/media-item/media-item.entity';

@Controller('shelters')
@UseGuards(JwtAuthGuard)
export class SheltersController {
  private readonly logger = new Logger(SheltersController.name);

  constructor(
    private readonly deleteService: DeleteSheltersService,
    private readonly updateService: UpdateSheltersService,
    private readonly getService: GetSheltersService,
    private readonly createService: CreateSheltersService,
  ) {}

  private mapFiles(files: Express.Multer.File[]): Record<string, Express.Multer.File> {
    const filesDict: Record<string, Express.Multer.File> = {};
    files.forEach((file) => {
      this.logger.debug(`📎 Arquivo recebido - fieldname: ${file.fieldname}`);
      filesDict[file.fieldname] = file;
    });
    return filesDict;
  }

  @Get()
  findAllPaginated(
    @Query() q: QuerySheltersDto,
    @Req() req: Request,
  ): Promise<Paginated<ShelterResponseDto>> {
    return this.getService.findAllPaginated(q, req);
  }

  @Get('simple')
  async findAllSimple(@Req() req: Request): Promise<ShelterSimpleResponseDto[]> {
    return this.getService.findAllSimple(req);
  }

  @Get('list')
  async list(@Req() req: Request): Promise<ShelterSelectOptionDto[]> {
    return this.getService.list(req);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    return this.getService.findOne(id, req);
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() body: any,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    this.logger.debug('🚀 Criando novo shelter');
    this.logger.debug(`📦 Body recebido: ${JSON.stringify(Object.keys(body))}`);

    try {
      let dto: CreateShelterDto;
      
      // Verificar se veio como form-data com shelterData
      if (body.shelterData) {
        this.logger.debug('📝 Parseando shelterData do form-data');
        const parsed = typeof body.shelterData === 'string' 
          ? JSON.parse(body.shelterData) 
          : body.shelterData;
        dto = plainToInstance(CreateShelterDto, parsed);
      } else if (body.name) {
        // Se veio como JSON puro ou form-data com campos separados
        this.logger.debug('📝 Usando body direto como DTO');
        dto = plainToInstance(CreateShelterDto, body);
      } else {
        throw new BadRequestException('Dados do shelter não fornecidos. Use "shelterData" no form-data ou envie JSON direto.');
      }

      // Validar DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        this.logger.error('❌ Erros de validação:', errors);
        throw new BadRequestException(errors);
      }

      const filesDict = this.mapFiles(files);
      const entity = await this.createService.create(dto, req, filesDict);
      
      this.logger.log(`✅ Shelter criado: ID=${entity.id}`);
      return toShelterDto(entity);
    } catch (error) {
      this.logger.error('❌ Erro ao criar shelter', error);
      throw error;
    }
  }

  @Put(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() body: any,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    this.logger.debug(`🚀 Atualizando shelter ID=${id}`);
    this.logger.debug(`📦 Body recebido: ${JSON.stringify(Object.keys(body))}`);

    try {
      let dto: UpdateShelterDto;
      
      // Verificar se veio como form-data com shelterData
      if (body.shelterData) {
        this.logger.debug('📝 Parseando shelterData do form-data');
        const parsed = typeof body.shelterData === 'string' 
          ? JSON.parse(body.shelterData) 
          : body.shelterData;
        dto = plainToInstance(UpdateShelterDto, parsed);
      } else {
        // Se veio como JSON puro
        this.logger.debug('📝 Usando body direto como DTO');
        dto = plainToInstance(UpdateShelterDto, body);
      }

      // Validar DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        this.logger.error('❌ Erros de validação:', errors);
        throw new BadRequestException(errors);
      }

      const filesDict = this.mapFiles(files);
      const entity = await this.updateService.update(id, dto, req, filesDict);
      
      this.logger.log(`✅ Shelter atualizado: ID=${id}`);
      return toShelterDto(entity);
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar shelter', error);
      throw error;
    }
  }

  @Patch(':id/media')
  @UseInterceptors(AnyFilesInterceptor())
  async updateMedia(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() body: any,
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    this.logger.debug(`🚀 Atualizando media do shelter ID=${id}`);
    this.logger.debug(`📦 Body recebido: ${JSON.stringify(Object.keys(body))}`);

    try {
      let mediaDto: any;
      
      // Se veio como form-data com mediaData
      if (body.mediaData) {
        this.logger.debug('📝 Parseando mediaData do form-data');
        mediaDto = typeof body.mediaData === 'string' 
          ? JSON.parse(body.mediaData) 
          : body.mediaData;
      } else if (body.title || body.url) {
        // Se veio como JSON puro ou campos diretos
        this.logger.debug('📝 Usando body direto');
        mediaDto = body;
      } else {
        throw new BadRequestException('mediaData é obrigatório ou envie campos diretos (title, url)');
      }

      const filesDict = this.mapFiles(files);

      // Determinar se é upload ou link
      const hasFile = files.length > 0;
      const uploadTypeValue = mediaDto.uploadType || (hasFile ? UploadType.UPLOAD : UploadType.LINK);

      const updateDto: UpdateShelterDto = {
        mediaItem: {
          title: mediaDto.title || 'Foto do Abrigo',
          description: mediaDto.description || 'Imagem principal do abrigo',
          uploadType: uploadTypeValue,
          url: mediaDto.url,
          isLocalFile: hasFile,
          fieldKey: hasFile ? files[0].fieldname : undefined,
        },
      };

      const entity = await this.updateService.update(id, updateDto, req, filesDict);
      this.logger.log(`✅ Media atualizado para shelter ID=${id}`);
      return toShelterDto(entity);
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar media', error);
      throw error;
    }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.deleteService.remove(id, req);
  }

  @Patch(':id/leaders')
  async assignLeaders(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { leaderProfileIds: string[] },
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.updateService.assignLeaders(id, body.leaderProfileIds, req);
    return toShelterDto(entity);
  }

  @Delete(':id/leaders')
  async removeLeaders(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { leaderProfileIds: string[] },
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.updateService.removeLeaders(id, body.leaderProfileIds, req);
    return toShelterDto(entity);
  }

  @Patch(':id/teachers')
  async assignTeachers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { teacherProfileIds: string[] },
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.updateService.assignTeachers(id, body.teacherProfileIds, req);
    return toShelterDto(entity);
  }

  @Delete(':id/teachers')
  async removeTeachers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { teacherProfileIds: string[] },
    @Req() req: Request,
  ): Promise<ShelterResponseDto> {
    const entity = await this.updateService.removeTeachers(id, body.teacherProfileIds, req);
    return toShelterDto(entity);
  }
}