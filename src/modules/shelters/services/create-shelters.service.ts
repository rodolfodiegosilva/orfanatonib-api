import { ForbiddenException, Injectable, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { SheltersRepository } from '../repositories/shelters.repository';
import { CreateShelterDto } from '../dto/create-shelter.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { AwsS3Service } from 'src/aws/aws-s3.service';
import { MediaType, UploadType } from 'src/share/media/media-item/media-item.entity';
import { RouteService } from 'src/route/route.service';
import { RouteType } from 'src/route/route-page.entity';
import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class CreateSheltersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
    private readonly mediaItemProcessor: MediaItemProcessor,
    private readonly s3Service: AwsS3Service,
    private readonly routeService: RouteService,
  ) { }

  private async getCtx(req: Request): Promise<Ctx> {
    const p = await this.authCtx.tryGetPayload(req);
    return { role: p?.role?.toLowerCase(), userId: p?.sub ?? null };
  }

  async create(dto: CreateShelterDto, req: Request, filesDict?: Record<string, Express.Multer.File>) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') {
      throw new ForbiddenException('Acesso negado');
    }

    // ❌ REMOVIDO: Validação de leaderProfileIds - Agora feito através de Teams

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar shelter primeiro
      const shelter = await this.sheltersRepository.createShelter(dto);

      // Se fornecido mediaItem, criar ANTES da route para ter a imagem
      let imageUrl = '';
      if (dto.mediaItem && filesDict) {
        imageUrl = await this.createMediaItem(shelter.id, dto.mediaItem, filesDict);
      }

      // Criar route para o shelter (já com a imagem se houver)
      await this.createRoute(queryRunner, shelter, dto, imageUrl);

      await queryRunner.commitTransaction();
      return shelter;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createRoute(queryRunner: any, shelter: ShelterEntity, dto: CreateShelterDto, imageUrl: string = '') {
    const path = await this.routeService.generateAvailablePath(shelter.name, 'abrigo_');
    
    // Concatenar endereço: "Cidade - Estado, Bairro Número"
    const address = shelter.address;
    const subtitle = address 
      ? `${address.city} - ${address.state}, ${address.district} ${address.number || ''}`
      : 'Abrigo';
    
    const route = await this.routeService.createRouteWithManager(queryRunner.manager, {
      title: shelter.name, // Nome do shelter
      subtitle: subtitle.trim(), // Cidade - Estado, Bairro Número
      description: dto.description || 'Abrigo dedicado ao cuidado de crianças e adolescentes',
      path,
      type: RouteType.PAGE, // PAGE (não OTHER)
      entityId: shelter.id,
      idToFetch: shelter.id,
      entityType: 'shelterPage', // shelterPage (não ShelterEntity)
      image: imageUrl, // URL do media item se fornecido
      public: true, // Sempre true
    });

    shelter.route = route;
    await queryRunner.manager.save(ShelterEntity, shelter);
  }

  private async createMediaItem(
    shelterId: string,
    mediaInput: any,
    filesDict: Record<string, Express.Multer.File>,
  ): Promise<string> {
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...mediaInput, mediaType: MediaType.IMAGE },
      shelterId,
      'ShelterEntity',
    );

    if (mediaInput.uploadType === UploadType.UPLOAD && mediaInput.isLocalFile) {
      const file = filesDict[mediaInput.fieldKey || ''];
      if (!file) {
        throw new BadRequestException('Arquivo não encontrado para upload');
      }

      media.url = await this.s3Service.upload(file);
      media.isLocalFile = true;
      media.originalName = file.originalname;
      media.size = file.size;
    } else if (mediaInput.url) {
      media.url = mediaInput.url;
      media.isLocalFile = false;
    } else {
      throw new BadRequestException('URL ou arquivo é necessário para media item');
    }

    const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
    
    // Retornar URL para usar na route
    return savedMedia.url;
  }
}