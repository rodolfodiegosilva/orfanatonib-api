import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AwsS3Service } from 'src/aws/aws-s3.service';
import { RouteService } from 'src/route/route.service';
import { RouteEntity, RouteType } from 'src/route/route-page.entity';
import { MediaTargetType } from 'src/share/media/media-target-type.enum';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { MediaItemEntity, MediaType, UploadType } from 'src/share/media/media-item/media-item.entity';
import { VisitMaterialsPageEntity } from '../entities/visit-material-page.entity';
import { MediaItemDto } from 'src/share/share-dto/media-item-dto';
import { UpdateVisitMaterialsPageDto } from '../dto/update-visit-material.dto';
import { VisitMaterialsPageResponseDTO } from '../dto/visit-material-response.dto';

@Injectable()
export class VisitMaterialsPageUpdateService {
  private readonly logger = new Logger(VisitMaterialsPageUpdateService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly s3: AwsS3Service,
    private readonly routeService: RouteService,
    private readonly mediaItemProcessor: MediaItemProcessor,
  ) {
  }

  async updateFromRaw(
    id: string,
    raw: string,
    files: Express.Multer.File[],
  ): Promise<VisitMaterialsPageResponseDTO> {
    this.logger.debug(`✏️ Processando dados brutos para atualização da página ID=${id}`);

    if (!raw) {
      throw new BadRequestException('visitMaterialsPageData é obrigatório.');
    }

    try {
      const parsed = JSON.parse(raw);
      const dto = plainToInstance(UpdateVisitMaterialsPageDto, parsed);
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      if (errors.length > 0) {
        throw new BadRequestException('Dados inválidos na requisição');
      }

      const filesDict = Object.fromEntries(files.map((f) => [f.fieldname, f]));

      const result = await this.updateVisitMaterialsPage(id, dto, filesDict);
      
      // Buscar mídias atualizadas para incluir no response
      const mediaItems = await this.mediaItemProcessor.findMediaItemsByTarget(
        result.id,
        MediaTargetType.VisitMaterialsPage,
      );

      return VisitMaterialsPageResponseDTO.fromEntity(result, mediaItems);
    } catch (err) {
      this.logger.error(`❌ Erro ao processar dados para atualização ID=${id}`, err);
      throw new BadRequestException('Erro ao atualizar a página de materiais: ' + err.message);
    }
  }

  async updateVisitMaterialsPage(
    id: string,
    dto: any,
    filesDict: Record<string, Express.Multer.File>,
  ): Promise<VisitMaterialsPageEntity> {
    this.logger.debug(`🚀 Iniciando atualização da página ID=${id}`);
    const queryRunner = this.dataSource.createQueryRunner();
    this.logger.debug('🔗 Conectando ao QueryRunner');
    await queryRunner.connect();
    this.logger.debug('🔄 Iniciando transação');
    await queryRunner.startTransaction();

    try {
      const existingPage = await this.validatePage(id, queryRunner);
      const existingRoute = await this.validateRoute(existingPage.id);
      const existingVideos = await this.validateVideoMedia(existingPage.id);
      const existingDocuments = await this.validateDocumentMedia(existingPage.id);
      const existingImages = await this.validateImageMedia(existingPage.id);
      const existingAudios = await this.validateAudioMedia(existingPage.id);

      const { pageTitle, pageSubtitle, pageDescription, videos, documents, images, audios, currentWeek, testament } = dto;
      this.logger.debug(`📋 Dados extraídos: title="${pageTitle}", subtitle="${pageSubtitle}", testament="${testament}", vídeos=${videos?.length || 0}, documentos=${documents?.length || 0}, imagens=${images?.length || 0}, áudios=${audios?.length || 0}`);

      await this.deleteVideoMedia(existingVideos, videos);
      await this.deleteDocumentMedia(existingDocuments, documents);
      await this.deleteImageMedia(existingImages, images);
      await this.deleteAudioMedia(existingAudios, audios);

      for (const video of videos || []) {
        if (video.id) {
          await this.upsertVideoMedia(video, existingPage.id, filesDict, queryRunner);
        } else {
          await this.addVideoMedia(video, existingPage.id, filesDict, queryRunner);
        }
      }
      for (const document of documents || []) {
        if (document.id) {
          await this.upsertDocumentMedia(document, existingPage.id, filesDict, queryRunner);
        } else {
          await this.addDocumentMedia(document, existingPage.id, filesDict, queryRunner);
        }
      }
      for (const image of images || []) {
        if (image.id) {
          await this.upsertImageMedia(image, existingPage.id, filesDict, queryRunner);
        } else {
          await this.addImageMedia(image, existingPage.id, filesDict, queryRunner);
        }
      }
      for (const audio of audios || []) {
        if (audio.id) {
          await this.upsertAudioMedia(audio, existingPage.id, filesDict, queryRunner);
        } else {
          await this.addAudioMedia(audio, existingPage.id, filesDict, queryRunner);
        }
      }

      const routeUpsert = await this.upsertRoute(existingRoute.id, { pageTitle, pageSubtitle, pageDescription, currentWeek }, existingPage.id, existingRoute.public, existingRoute.current);

      existingPage.title = pageTitle;
      existingPage.subtitle = pageSubtitle;
      existingPage.description = pageDescription;
      existingPage.currentWeek = currentWeek;
      if (testament !== undefined) {
        existingPage.testament = testament;
      }
      existingPage.route = routeUpsert;
      const updatedPage = await queryRunner.manager.save(VisitMaterialsPageEntity, existingPage);

      await queryRunner.commitTransaction();
      this.logger.debug(`✅ Página atualizada com sucesso. ID=${updatedPage.id}`);
      return updatedPage;
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar página', error.stack);
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Erro ao atualizar a página de materiais.');
    } finally {
      await queryRunner.release();
    }
  }

  private async upsertRoute(
    routeId: string,
    pageData: { pageTitle: string; pageSubtitle: string; pageDescription: string, currentWeek: boolean },
    visitMaterialsPageId: string,
    existingRoutePublic: boolean,
    existingRouteCurrent?: boolean,
  ): Promise<RouteEntity> {
    this.logger.debug(`🔄 Iniciando upsert da rota ID: ${routeId}`);
    const routeData: Partial<RouteEntity> = {
      title: pageData.pageTitle,
      subtitle: pageData.pageSubtitle,
      description: pageData.pageDescription,
      idToFetch: visitMaterialsPageId,
      entityType: 'VisitMaterialsPage',
      entityId: visitMaterialsPageId,
      public: existingRoutePublic,
      current: existingRouteCurrent,
      type: RouteType.PAGE,
      path: 'materiais_visita_',
      image: 'https://clubinho-nib.s3.us-east-1.amazonaws.com/production/cards/card_materiais.png',
    };
    const savedRoute = await this.routeService.upsertRoute(routeId, routeData);
    this.logger.debug(`✅ Rota upsertada: ${savedRoute.id}, path: ${savedRoute.path}`);
    return savedRoute;
  }

  private async validatePage(id: string, queryRunner: QueryRunner): Promise<VisitMaterialsPageEntity> {
    this.logger.debug(`🔍 Buscando página ID=${id}`);
    const page = await queryRunner.manager.findOne(VisitMaterialsPageEntity, {
      where: { id },
      relations: ['route'],
    });
    if (!page) {
      this.logger.warn(`⚠️ Página ID=${id} não encontrada`);
      throw new NotFoundException('Página não encontrada');
    }
    this.logger.debug(`✅ Página ID=${id} encontrada`);
    return page;
  }

  private async validateRoute(entityId: string): Promise<RouteEntity> {
    this.logger.debug(`🔍 Buscando rota para entityId=${entityId}`);
    const route = await this.routeService.findRouteByEntityId(entityId);
    if (!route) {
      this.logger.warn(`⚠️ Rota para entityId=${entityId} não encontrada`);
      throw new NotFoundException('Rota não encontrada');
    }
    this.logger.debug(`✅ Rota ID=${route.id} encontrada`);
    return route;
  }

  private async validateVideoMedia(pageId: string): Promise<MediaItemEntity[]> {
    this.logger.debug(`🔍 Buscando vídeos para página ID=${pageId}`);
    const items = await this.mediaItemProcessor.findMediaItemsByTarget(pageId, MediaTargetType.VisitMaterialsPage);
    const videos = items.filter(item => item.mediaType === MediaType.VIDEO);
    this.logger.debug(`✅ Encontrados ${videos.length} vídeos`);
    return videos;
  }

  private async validateDocumentMedia(pageId: string): Promise<MediaItemEntity[]> {
    this.logger.debug(`🔍 Buscando documentos para página ID=${pageId}`);
    const items = await this.mediaItemProcessor.findMediaItemsByTarget(pageId, MediaTargetType.VisitMaterialsPage);
    const documents = items.filter(item => item.mediaType === MediaType.DOCUMENT);
    this.logger.debug(`✅ Encontrados ${documents.length} documentos`);
    return documents;
  }

  private async validateImageMedia(pageId: string): Promise<MediaItemEntity[]> {
    this.logger.debug(`🔍 Buscando imagens para página ID=${pageId}`);
    const items = await this.mediaItemProcessor.findMediaItemsByTarget(pageId, MediaTargetType.VisitMaterialsPage);
    const images = items.filter(item => item.mediaType === MediaType.IMAGE);
    this.logger.debug(`✅ Encontradas ${images.length} imagens`);
    return images;
  }

  private async validateAudioMedia(pageId: string): Promise<MediaItemEntity[]> {
    this.logger.debug(`🔍 Buscando áudios para página ID=${pageId}`);
    const items = await this.mediaItemProcessor.findMediaItemsByTarget(pageId, MediaTargetType.VisitMaterialsPage);
    const audios = items.filter(item => item.mediaType === MediaType.AUDIO);
    this.logger.debug(`✅ Encontrados ${audios.length} áudios`);
    return audios;
  }

  private async deleteVideoMedia(
    existingVideos: MediaItemEntity[],
    incomingVideos: any[],
  ): Promise<void> {
    this.logger.debug(`🗑️ Verificando vídeos para exclusão. Existentes: ${existingVideos.length}, Recebidos: ${incomingVideos?.length || 0}`);
    const incomingIds = new Set((incomingVideos || []).map((v) => v.id).filter(Boolean));
    const videosToRemove = existingVideos.filter((video) => !incomingIds.has(video.id));
    if (videosToRemove.length > 0) {
      this.logger.debug(`🗑️ Removendo ${videosToRemove.length} vídeos`);
      await this.mediaItemProcessor.deleteMediaItems(videosToRemove, this.s3.delete.bind(this.s3));
      this.logger.debug(`✅ ${videosToRemove.length} vídeos removidos`);
    } else {
      this.logger.debug('ℹ️ Nenhum vídeo para remover');
    }
  }

  private async deleteDocumentMedia(
    existingDocuments: MediaItemEntity[],
    incomingDocuments: any[],
  ): Promise<void> {
    this.logger.debug(`🗑️ Verificando documentos para exclusão. Existentes: ${existingDocuments.length}, Recebidos: ${incomingDocuments?.length || 0}`);
    const incomingIds = new Set((incomingDocuments || []).map((d) => d.id).filter(Boolean));
    const documentsToRemove = existingDocuments.filter((doc) => !incomingIds.has(doc.id));
    if (documentsToRemove.length > 0) {
      this.logger.debug(`🗑️ Removendo ${documentsToRemove.length} documentos`);
      await this.mediaItemProcessor.deleteMediaItems(documentsToRemove, this.s3.delete.bind(this.s3));
      this.logger.debug(`✅ ${documentsToRemove.length} documentos removidos`);
    } else {
      this.logger.debug('ℹ️ Nenhum documento para remover');
    }
  }

  private async deleteImageMedia(
    existingImages: MediaItemEntity[],
    incomingImages: any[],
  ): Promise<void> {
    this.logger.debug(`🗑️ Verificando imagens para exclusão. Existentes: ${existingImages.length}, Recebidas: ${incomingImages?.length || 0}`);
    const incomingIds = new Set((incomingImages || []).map((i) => i.id).filter(Boolean));
    const imagesToRemove = existingImages.filter((img) => !incomingIds.has(img.id));
    if (imagesToRemove.length > 0) {
      this.logger.debug(`🗑️ Removendo ${imagesToRemove.length} imagens`);
      await this.mediaItemProcessor.deleteMediaItems(imagesToRemove, this.s3.delete.bind(this.s3));
      this.logger.debug(`✅ ${imagesToRemove.length} imagens removidas`);
    } else {
      this.logger.debug('ℹ️ Nenhuma imagem para remover');
    }
  }

  private async deleteAudioMedia(
    existingAudios: MediaItemEntity[],
    incomingAudios: any[],
  ): Promise<void> {
    this.logger.debug(`🗑️ Verificando áudios para exclusão. Existentes: ${existingAudios.length}, Recebidos: ${incomingAudios?.length || 0}`);
    const incomingIds = new Set((incomingAudios || []).map((a) => a.id).filter(Boolean));
    const audiosToRemove = existingAudios.filter((audio) => !incomingIds.has(audio.id));
    if (audiosToRemove.length > 0) {
      this.logger.debug(`🗑️ Removendo ${audiosToRemove.length} áudios`);
      await this.mediaItemProcessor.deleteMediaItems(audiosToRemove, this.s3.delete.bind(this.s3));
      this.logger.debug(`✅ ${audiosToRemove.length} áudios removidos`);
    } else {
      this.logger.debug('ℹ️ Nenhum áudio para remover');
    }
  }
  private async addVideoMedia(
    videoInput: MediaItemDto,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`🆕 Construindo novo vídeo: "${videoInput.title}"`);

    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...videoInput, mediaType: MediaType.VIDEO },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );

    const isUpload = videoInput.uploadType === UploadType.UPLOAD || videoInput.isLocalFile === true;

    if (isUpload) {
      media.platformType = undefined;
      if (!videoInput.fieldKey) {
        this.logger.error(`❌ FieldKey ausente para mídia "${videoInput.title}"`);
        throw new BadRequestException(`FieldKey ausente para mídia "${videoInput.title}"`);
      }
      const file = filesDict[videoInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para mídia "${videoInput.title}" (fieldKey: ${videoInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para mídia "${videoInput.title}"`);
      }

      this.logger.debug(`⬆️ Fazendo upload do vídeo "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = videoInput.isLocalFile;
      media.originalName = file.originalname;
      media.size = file.size;
      media.platformType = undefined;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = videoInput.title || media.title;
      media.description = videoInput.description || media.description;
      media.uploadType = videoInput.uploadType || media.uploadType;
      media.platformType = videoInput.platformType || media.platformType;
      media.mediaType = videoInput.mediaType || media.mediaType;
      media.url = videoInput.url?.trim() || media.url;
      media.originalName = videoInput.originalName || media.originalName;
      media.isLocalFile = videoInput.isLocalFile || media.isLocalFile;
      media.size = videoInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para vídeo: "${media.url}"`);
    }

    this.logger.debug(`💾 Salvando vídeo no banco`);
    const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
    this.logger.debug(`✅ Vídeo salvo com ID=${savedMedia.id}`);
    return savedMedia;
  }

  private async addDocumentMedia(
    documentInput: any,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`🆕 Construindo novo documento: "${documentInput.title}"`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...documentInput, mediaType: MediaType.DOCUMENT },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );

    if (documentInput.uploadType === UploadType.UPLOAD || documentInput.isLocalFile === true) {
      media.platformType = undefined;
      const file = filesDict[documentInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para documento "${documentInput.title}" (fieldKey: ${documentInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para documento "${documentInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload do documento "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = documentInput.isLocalFile;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = documentInput.title || media.title;
      media.description = documentInput.description || media.description;
      media.uploadType = documentInput.uploadType || media.uploadType;
      media.platformType = documentInput.platformType || media.platformType;
      media.mediaType = documentInput.mediaType || media.mediaType;
      media.url = documentInput.url?.trim() || media.url;
      media.originalName = documentInput.originalName || media.originalName;
      media.isLocalFile = documentInput.isLocalFile || media.isLocalFile;
      media.size = documentInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para documento: "${media.url}"`);
    }

    this.logger.debug(`💾 Salvando documento no banco`);
    const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
    this.logger.debug(`✅ Documento salvo com ID=${savedMedia.id}`);
    return savedMedia;
  }

  private async addImageMedia(
    imageInput: any,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`🆕 Construindo nova imagem: "${imageInput.title}"`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...imageInput, mediaType: MediaType.IMAGE },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );

    if (imageInput.uploadType === UploadType.UPLOAD || imageInput.isLocalFile === true) {
      media.platformType = undefined;
      const file = filesDict[imageInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para imagem "${imageInput.title}" (fieldKey: ${imageInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para imagem "${imageInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload da imagem "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = imageInput.isLocalFile;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = imageInput.title || media.title;
      media.description = imageInput.description || media.description;
      media.uploadType = imageInput.uploadType || media.uploadType;
      media.platformType = imageInput.platformType || media.platformType;
      media.mediaType = imageInput.mediaType || media.mediaType;
      media.url = imageInput.url?.trim() || media.url;
      media.originalName = imageInput.originalName || media.originalName;
      media.isLocalFile = imageInput.isLocalFile || media.isLocalFile;
      media.size = imageInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para imagem: "${media.url}"`);
    }

    this.logger.debug(`💾 Salvando imagem no banco`);
    const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
    this.logger.debug(`✅ Imagem salva com ID=${savedMedia.id}`);
    return savedMedia;
  }


  private async addAudioMedia(
    audioInput: any,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`🆕 Construindo novo áudio: "${audioInput.title}"`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...audioInput, mediaType: MediaType.AUDIO },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );

    if (audioInput.uploadType === UploadType.UPLOAD || audioInput.isLocalFile === true) {
      media.platformType = undefined;
      const file = filesDict[audioInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para áudio "${audioInput.title}" (fieldKey: ${audioInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para áudio "${audioInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload do áudio "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = true;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = audioInput.title || media.title;
      media.description = audioInput.description || media.description;
      media.uploadType = audioInput.uploadType || media.uploadType;
      media.platformType = audioInput.platformType || media.platformType;
      media.mediaType = audioInput.mediaType || media.mediaType;
      media.url = audioInput.url?.trim() || media.url;
      media.originalName = audioInput.originalName || media.originalName;
      media.isLocalFile = audioInput.isLocalFile || media.isLocalFile;
      media.size = audioInput.size || media.size;
      media.isLocalFile = false;
      this.logger.debug(`🔗 Usando URL externa para áudio: "${media.url}"`);
    }

    this.logger.debug(`💾 Salvando áudio no banco`);
    const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
    this.logger.debug(`✅ Áudio salvo com ID=${savedMedia.id}`);
    return savedMedia;
  }


  private async upsertVideoMedia(
    videoInput: MediaItemDto,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {

    this.logger.debug(`✏️ Construindo atualização de vídeo ID=${videoInput.id}`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...videoInput, mediaType: MediaType.VIDEO },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );

    if (videoInput.uploadType === UploadType.UPLOAD && videoInput.isLocalFile && videoInput.fieldKey) {
      this.logger.debug(`🔍 Verificando vídeo existente ID=${videoInput.id}`);
      const existing = await queryRunner.manager.findOne(MediaItemEntity, {
        where: { id: videoInput.id },
      });
      if (existing && existing.isLocalFile) {
        this.logger.debug(`🗑️ Removendo arquivo existente do S3: ${existing.url}`);
        await this.s3.delete(existing.url);
      }
      const file = filesDict[videoInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para vídeo "${videoInput.title}" (fieldKey: ${videoInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para vídeo "${videoInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload do novo vídeo "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.description = videoInput.description || media.description;

      media.isLocalFile = videoInput.isLocalFile;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = videoInput.title || media.title;
      media.description = videoInput.description || media.description;
      media.uploadType = videoInput.uploadType || media.uploadType;
      media.platformType = videoInput.platformType || media.platformType;
      media.mediaType = videoInput.mediaType || media.mediaType;
      media.url = videoInput.url?.trim() || media.url;
      media.originalName = videoInput.originalName || media.originalName;
      media.isLocalFile = videoInput.isLocalFile || media.isLocalFile;
      media.size = videoInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para vídeo: "${media.url}"`);
    }
    this.logger.debug(`💾 Atualizando vídeo no banco`);
    const updatedMedia = await this.mediaItemProcessor.upsertMediaItem(videoInput.id, media);
    this.logger.debug(`✅ Vídeo atualizado com ID=${updatedMedia.id}`);
    return updatedMedia;
  }

  private async upsertDocumentMedia(
    documentInput: MediaItemDto,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`✏️ Construindo atualização de documento ID=${documentInput.id}`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...documentInput, mediaType: MediaType.DOCUMENT },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );
    if (documentInput.uploadType === UploadType.UPLOAD && documentInput.isLocalFile && documentInput.fieldKey) {
      this.logger.debug(`🔍 Verificando documento existente ID=${documentInput.id}`);
      const existing = await queryRunner.manager.findOne(MediaItemEntity, {
        where: { id: documentInput.id },
      });
      if (existing && existing.isLocalFile) {
        this.logger.debug(`🗑️ Removendo arquivo existente do S3: ${existing.url}`);
        await this.s3.delete(existing.url);
      }
      const file = filesDict[documentInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para documento "${documentInput.title}" (fieldKey: ${documentInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para documento "${documentInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload do novo documento "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = true;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = documentInput.title || media.title;
      media.description = documentInput.description || media.description;
      media.uploadType = documentInput.uploadType || media.uploadType;
      media.platformType = documentInput.platformType || media.platformType;
      media.mediaType = documentInput.mediaType || media.mediaType;
      media.url = documentInput.url?.trim() || media.url;
      media.originalName = documentInput.originalName || media.originalName;
      media.isLocalFile = documentInput.isLocalFile || media.isLocalFile;
      media.size = documentInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para documento: "${media.url}"`);
    }
    this.logger.debug(`💾 Atualizando documento no banco`);
    const updatedMedia = await this.mediaItemProcessor.upsertMediaItem(documentInput.id, media);
    this.logger.debug(`✅ Documento atualizado com ID=${updatedMedia.id}`);
    return updatedMedia;
  }

  private async upsertImageMedia(
    imageInput: MediaItemDto,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`✏️ Construindo atualização de imagem ID=${imageInput.id}`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...imageInput, mediaType: MediaType.IMAGE },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );
    if (imageInput.uploadType === UploadType.UPLOAD && imageInput.isLocalFile && imageInput.fieldKey) {
      this.logger.debug(`🔍 Verificando imagem existente ID=${imageInput.id}`);
      const existing = await queryRunner.manager.findOne(MediaItemEntity, {
        where: { id: imageInput.id },
      });
      if (existing && existing.isLocalFile) {
        this.logger.debug(`🗑️ Removendo arquivo existente do S3: ${existing.url}`);
        await this.s3.delete(existing.url);
      }
      const file = filesDict[imageInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para imagem "${imageInput.title}" (fieldKey: ${imageInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para imagem "${imageInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload da nova imagem "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = true;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = imageInput.title || media.title;
      media.description = imageInput.description || media.description;
      media.uploadType = imageInput.uploadType || media.uploadType;
      media.platformType = imageInput.platformType || media.platformType;
      media.mediaType = imageInput.mediaType || media.mediaType;
      media.url = imageInput.url?.trim() || media.url;
      media.originalName = imageInput.originalName || media.originalName;
      media.isLocalFile = imageInput.isLocalFile || media.isLocalFile;
      media.size = imageInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para imagem: "${media.url}"`);
    }
    this.logger.debug(`💾 Atualizando imagem no banco`);
    const updatedMedia = await this.mediaItemProcessor.upsertMediaItem(imageInput.id, media);
    this.logger.debug(`✅ Imagem atualizada com ID=${updatedMedia.id}`);
    return updatedMedia;
  }

  private async upsertAudioMedia(
    audioInput: MediaItemDto,
    pageId: string,
    filesDict: Record<string, Express.Multer.File>,
    queryRunner: QueryRunner,
  ): Promise<MediaItemEntity> {
    this.logger.debug(`✏️ Construindo atualização de áudio ID=${audioInput.id}`);
    const media = this.mediaItemProcessor.buildBaseMediaItem(
      { ...audioInput, mediaType: MediaType.AUDIO },
      pageId,
      MediaTargetType.VisitMaterialsPage,
    );
    if (audioInput.uploadType === UploadType.UPLOAD && audioInput.isLocalFile && audioInput.fieldKey) {
      this.logger.debug(`🔍 Verificando áudio existente ID=${audioInput.id}`);
      const existing = await queryRunner.manager.findOne(MediaItemEntity, {
        where: { id: audioInput.id },
      });
      if (existing && existing.isLocalFile) {
        this.logger.debug(`🗑️ Removendo arquivo existente do S3: ${existing.url}`);
        await this.s3.delete(existing.url);
      }
      const file = filesDict[audioInput.fieldKey];
      if (!file) {
        this.logger.error(`❌ Arquivo ausente para áudio "${audioInput.title}" (fieldKey: ${audioInput.fieldKey})`);
        throw new BadRequestException(`Arquivo ausente para áudio "${audioInput.title}"`);
      }
      this.logger.debug(`⬆️ Fazendo upload do novo áudio "${file.originalname}" para S3`);
      media.url = await this.s3.upload(file);
      media.isLocalFile = audioInput.isLocalFile;
      media.originalName = file.originalname;
      media.size = file.size;
      this.logger.debug(`✅ Upload concluído. URL=${media.url}`);
    } else {
      media.title = audioInput.title || media.title;
      media.description = audioInput.description || media.description;
      media.uploadType = audioInput.uploadType || media.uploadType;
      media.platformType = audioInput.platformType || media.platformType;
      media.mediaType = audioInput.mediaType || media.mediaType;
      media.url = audioInput.url?.trim() || media.url;
      media.originalName = audioInput.originalName || media.originalName;
      media.isLocalFile = audioInput.isLocalFile || media.isLocalFile;
      media.size = audioInput.size || media.size;
      this.logger.debug(`🔗 Usando URL externa para áudio: "${media.url}"`);
    }

    this.logger.debug(`💾 Atualizando áudio no banco`);
    const updatedMedia = await this.mediaItemProcessor.upsertMediaItem(audioInput.id, media);
    this.logger.debug(`✅ Áudio atualizado com ID=${updatedMedia.id}`);
    return updatedMedia;
  }
}