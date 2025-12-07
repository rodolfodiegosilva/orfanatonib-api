import { ForbiddenException, Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SheltersRepository } from '../repositories/shelters.repository';
import { UpdateShelterDto } from '../dto/update-shelter.dto';
import { UpdateShelterRequestDto } from '../dto/update-shelter-request.dto';
import { UpdateShelterMediaRequestDto } from '../dto/update-shelter-media-request.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { AwsS3Service } from 'src/aws/aws-s3.service';
import { MediaType, UploadType } from 'src/share/media/media-item/media-item.entity';
import { RouteService } from 'src/route/route.service';
import { RouteType } from 'src/route/route-page.entity';
import { GetSheltersService } from './get-shelters.service';
import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';
import { TeamsService } from 'src/modules/teams/services/teams.service';
import { CreateTeamDto } from 'src/modules/teams/dto/create-team.dto';
import { UpdateTeamDto } from 'src/modules/teams/dto/update-team.dto';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class UpdateSheltersService {
  constructor(
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
    private readonly mediaItemProcessor: MediaItemProcessor,
    private readonly s3Service: AwsS3Service,
    private readonly routeService: RouteService,
    @Inject(forwardRef(() => GetSheltersService))
    private readonly getService: GetSheltersService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
  ) { }

  private async getCtx(req: Request): Promise<Ctx> {
    const p = await this.authCtx.tryGetPayload(req);
    return { role: p?.role?.toLowerCase(), userId: p?.sub ?? null };
  }

  /**
   * Parseia e valida o body (form-data ou JSON) retornando o DTO validado
   */
  parseAndValidateBody(body: any): UpdateShelterDto {
    let dto: UpdateShelterDto;
    
    // Verificar se veio como form-data com shelterData
    if (body.shelterData) {
      const parsed = typeof body.shelterData === 'string' 
        ? JSON.parse(body.shelterData) 
        : body.shelterData;
      dto = plainToInstance(UpdateShelterDto, parsed);
    } else {
      // Se veio como JSON puro
      dto = plainToInstance(UpdateShelterDto, body);
    }

    return dto;
  }

  /**
   * Valida o DTO e lança exceção se houver erros
   */
  async validateDto(dto: UpdateShelterDto): Promise<void> {
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }

  /**
   * Mapeia array de arquivos para um dicionário por fieldname
   */
  mapFiles(files: Express.Multer.File[]): Record<string, Express.Multer.File> {
    const filesDict: Record<string, Express.Multer.File> = {};
    files.forEach((file) => {
      filesDict[file.fieldname] = file;
    });
    return filesDict;
  }

  /**
   * Atualiza um shelter a partir de body e arquivos brutos
   */
  async updateFromRaw(id: string, body: any, files: Express.Multer.File[], req: Request): Promise<ShelterEntity> {
    const dto = this.parseAndValidateBody(body);
    await this.validateDto(dto);
    const filesDict = this.mapFiles(files);
    return this.update(id, dto, req, filesDict);
  }

  /**
   * Atualiza apenas a mídia de um shelter
   */
  async updateMediaFromRaw(id: string, body: any, files: Express.Multer.File[], req: Request): Promise<ShelterEntity> {
    // Buscar o abrigo atual para obter os campos obrigatórios no DTO
    const currentShelter = await this.getService.findOne(id, req);
    if (!currentShelter) {
      throw new BadRequestException('Abrigo não encontrado');
    }

    // Parsear mediaData
    let mediaDto: { title?: string; description?: string; uploadType?: UploadType; url?: string; isLocalFile?: boolean };
    if (body.mediaData) {
      mediaDto = typeof body.mediaData === 'string' 
        ? JSON.parse(body.mediaData) 
        : body.mediaData;
    } else if (body.title || body.url) {
      mediaDto = {
        title: body.title,
        description: body.description,
        uploadType: body.uploadType,
        url: body.url,
        isLocalFile: body.isLocalFile,
      };
    } else {
      throw new BadRequestException('mediaData é obrigatório ou envie campos diretos (title, url)');
    }

    const filesDict = this.mapFiles(files);
    const hasFile = files.length > 0;
    const uploadTypeValue = mediaDto.uploadType || (hasFile ? UploadType.UPLOAD : UploadType.LINK);

    const updateDto: UpdateShelterDto = {
      teamsQuantity: currentShelter.teamsQuantity || 0,
      mediaItem: {
        title: mediaDto.title || 'Foto do Abrigo',
        description: mediaDto.description || 'Imagem principal do abrigo',
        uploadType: uploadTypeValue,
        url: mediaDto.url,
        isLocalFile: hasFile,
        fieldKey: hasFile ? files[0].fieldname : undefined,
      },
    };

    return this.update(id, updateDto, req, filesDict);
  }

  async update(id: string, dto: UpdateShelterDto, req: Request, filesDict?: Record<string, Express.Multer.File>) {
    const ctx = await this.getCtx(req);
    if (!ctx.role || ctx.role === 'teacher') throw new ForbiddenException('Acesso negado');

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');

      // ❌ REMOVIDO: Validação de leaderProfileIds - Agora feito através de Teams
    }

    // Buscar shelter atual para comparar teamsQuantity
    const currentShelter = await this.sheltersRepository.findOneOrFailForResponse(id, ctx);
    if (!currentShelter) {
      throw new NotFoundException('Shelter não encontrado');
    }
    const currentTeamsQuantity = currentShelter.teamsQuantity ?? 0;

    // Atualizar shelter
    const updatedShelter = await this.sheltersRepository.updateShelter(id, dto);

    // Atualizar equipes se teamsQuantity mudou ou se teams foi fornecido
    if (dto.teamsQuantity !== currentTeamsQuantity || dto.teams) {
      await this.updateTeams(id, dto, currentTeamsQuantity);
    }

    // Atualizar route se nome ou descrição mudaram
    if (dto.name || dto.description) {
      await this.updateRoute(id, dto);
    }

    // Processar media item APENAS se fornecido E se for uma mudança real
    if (dto.mediaItem && this.shouldUpdateMedia(dto.mediaItem, filesDict || {})) {
      await this.updateMediaItem(id, dto.mediaItem, filesDict || {});
    }

    return updatedShelter;
  }

  /**
   * Atualiza as equipes do abrigo baseado em teamsQuantity e teams array
   */
  private async updateTeams(shelterId: string, dto: UpdateShelterDto, currentTeamsQuantity: number): Promise<void> {
    const existingTeams = await this.teamsService.findByShelter(shelterId);
    const existingTeamsMap = new Map<number, { id: string; numberTeam: number }>();
    
    existingTeams.forEach(team => {
      existingTeamsMap.set(team.numberTeam, { id: team.id, numberTeam: team.numberTeam });
    });

    type TeamInput = NonNullable<UpdateShelterDto['teams']>[0];
    const teamsMap = new Map<number, TeamInput>();
    
    // Criar mapa das equipes fornecidas (se houver)
    if (dto.teams && dto.teams.length > 0) {
      for (const team of dto.teams) {
        if (team.numberTeam < 1 || team.numberTeam > dto.teamsQuantity) {
          throw new BadRequestException(
            `numberTeam ${team.numberTeam} deve estar entre 1 e ${dto.teamsQuantity}`
          );
        }
        if (teamsMap.has(team.numberTeam)) {
          throw new BadRequestException(`Duplicata: equipe ${team.numberTeam} já foi definida`);
        }
        teamsMap.set(team.numberTeam, team);
      }
    }

    // Se teamsQuantity diminuiu, remover equipes extras
    if (dto.teamsQuantity < currentTeamsQuantity) {
      for (let i = dto.teamsQuantity + 1; i <= currentTeamsQuantity; i++) {
        const existingTeam = existingTeamsMap.get(i);
        if (existingTeam) {
          await this.teamsService.remove(existingTeam.id);
        }
      }
    }

    // Atualizar ou criar equipes (1 até teamsQuantity)
    for (let i = 1; i <= dto.teamsQuantity; i++) {
      const teamData = teamsMap.get(i);
      const existingTeam = existingTeamsMap.get(i);

      if (existingTeam) {
        // Atualizar equipe existente
        if (teamData) {
          const updateTeamDto: UpdateTeamDto = {
            description: teamData.description,
            leaderProfileIds: teamData.leaderProfileIds,
            teacherProfileIds: teamData.teacherProfileIds,
          };
          await this.teamsService.update(existingTeam.id, updateTeamDto);
        }
      } else {
        // Criar nova equipe
        const createTeamDto: CreateTeamDto = {
          numberTeam: i,
          description: teamData?.description,
          shelterId: shelterId,
          leaderProfileIds: teamData?.leaderProfileIds,
          teacherProfileIds: teamData?.teacherProfileIds,
        };
        await this.teamsService.create(createTeamDto);
      }
    }
  }

  private shouldUpdateMedia(
    mediaInput: { 
      id?: string; 
      url?: string; 
      uploadType?: UploadType; 
    }, 
    filesDict: Record<string, Express.Multer.File>
  ): boolean {
    // Se tem arquivo novo para upload
    if (filesDict && Object.keys(filesDict).length > 0) {
      return true;
    }

    // Se tem URL nova (mas não tem ID, é criação)
    if (mediaInput.url && !mediaInput.id) {
      return true;
    }

    // Se tem ID e mudou a URL (trocar de uma URL para outra)
    if (mediaInput.id && mediaInput.url && mediaInput.uploadType !== UploadType.UPLOAD) {
      return true;
    }

    // Se tem ID, uploadType é upload mas NÃO tem arquivo = não mudou nada
    if (mediaInput.id && mediaInput.uploadType === UploadType.UPLOAD && !mediaInput.url?.startsWith('http')) {
      return false;
    }

    return false;
  }

  private async updateRoute(shelterId: string, dto: UpdateShelterDto) {
    const route = await this.routeService.findRouteByEntityId(shelterId);
    
    if (route) {
      // ✅ Route EXISTE → ATUALIZAR
      const updateData: any = {};
      
      if (dto.name) {
        updateData.title = dto.name;
      }
      if (dto.description) {
        updateData.description = dto.description;
      }
      
      // Se tiver endereço, atualizar subtitle
      if (dto.address && (dto.address.city || dto.address.state || dto.address.district || dto.address.number)) {
        // Buscar endereço atualizado
        const updatedShelter = await this.sheltersRepository.findOneOrFailForResponse(shelterId, {});
        if (updatedShelter && updatedShelter.address) {
          const addr = updatedShelter.address;
          updateData.subtitle = `${addr.city} - ${addr.state}, ${addr.district} ${addr.number || ''}`.trim();
        }
      }

      if (Object.keys(updateData).length > 0) {
        await this.routeService.updateRoute(route.id, updateData);
      }
    } else {
      // ✅ Route NÃO EXISTE → CRIAR
      const shelter = await this.sheltersRepository.findOneOrFailForResponse(shelterId, {});
      
      if (shelter) {
        const routePath = this.generateRoutePath(shelter.name);
        const subtitle = shelter.address
          ? `${shelter.address.city} - ${shelter.address.state}, ${shelter.address.district} ${shelter.address.number || ''}`.trim()
          : '';

        // Buscar media item se existir
        const mediaItem = await this.mediaItemProcessor.findMediaItemByTarget(shelterId, 'ShelterEntity');

        const newRoute = await this.routeService.createRoute({
          title: shelter.name,
          subtitle: subtitle,
          description: shelter.description || '',
          path: routePath,
          entityType: 'ShelterPage',
          entityId: shelterId,
          idToFetch: shelterId,
          type: RouteType.PAGE,
          image: mediaItem?.url || '',
          public: true,
        });

        // Vincular route ao shelter
        await this.sheltersRepository.updateShelter(shelterId, { route: newRoute } as any);
      }
    }
  }

  private generateRoutePath(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async updateMediaItem(
    shelterId: string,
    mediaInput: { 
      id?: string;
      title?: string;
      description?: string;
      uploadType?: UploadType;
      url?: string;
      isLocalFile?: boolean;
      fieldKey?: string;
    },
    filesDict: Record<string, Express.Multer.File>,
  ) {
    // Buscar media item existente
    const existingMedia = await this.mediaItemProcessor.findMediaItemByTarget(shelterId, 'ShelterEntity');

    if (existingMedia) {
      // ATUALIZAR media existente
      const media = this.mediaItemProcessor.buildBaseMediaItem(
        { ...mediaInput, mediaType: MediaType.IMAGE },
        shelterId,
        'ShelterEntity',
      );

      if (mediaInput.uploadType === UploadType.UPLOAD && mediaInput.isLocalFile) {
        // Upload de novo arquivo
        const file = filesDict[mediaInput.fieldKey || ''];
        if (!file) {
          throw new BadRequestException('Arquivo não encontrado para upload');
        }

        // ⚠️ REMOVER arquivo antigo do S3 se existir (SEMPRE)
        if (existingMedia.isLocalFile && existingMedia.url) {
          try {
            await this.s3Service.delete(existingMedia.url);
          } catch (error) {
            // Log mas não falha se não conseguir deletar
            console.warn(`⚠️ Não foi possível deletar arquivo antigo: ${existingMedia.url}`);
          }
        }

        // Upload novo arquivo
        media.url = await this.s3Service.upload(file);
        media.isLocalFile = true;
        media.originalName = file.originalname;
        media.size = file.size;
      } else if (mediaInput.url) {
        // Trocar para URL externa
        // ⚠️ REMOVER arquivo do S3 se estava usando arquivo local antes
        if (existingMedia.isLocalFile && existingMedia.url) {
          try {
            await this.s3Service.delete(existingMedia.url);
          } catch (error) {
            console.warn(`⚠️ Não foi possível deletar arquivo antigo: ${existingMedia.url}`);
          }
        }
        
        media.url = mediaInput.url;
        media.isLocalFile = false;
      }

      await this.mediaItemProcessor.upsertMediaItem(existingMedia.id, media);
      
      // Atualizar imagem na route
      await this.updateRouteImage(shelterId, media.url);
    } else {
      // CRIAR novo media item (não existe ainda)
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
        throw new BadRequestException('URL ou arquivo é necessário');
      }

      const savedMedia = await this.mediaItemProcessor.saveMediaItem(media);
      
      // Atualizar imagem na route
      await this.updateRouteImage(shelterId, savedMedia.url);
    }
  }

  private async updateRouteImage(shelterId: string, imageUrl: string) {
    const route = await this.routeService.findRouteByEntityId(shelterId);
    
    if (route) {
      // ✅ Route EXISTE → ATUALIZAR imagem
      if (imageUrl) {
        await this.routeService.updateRoute(route.id, { image: imageUrl } as any);
      }
    } else {
      // ✅ Route NÃO EXISTE → CRIAR com imagem
      const shelter = await this.sheltersRepository.findOneOrFailForResponse(shelterId, {});
      
      if (shelter) {
        const routePath = this.generateRoutePath(shelter.name);
        const subtitle = shelter.address
          ? `${shelter.address.city} - ${shelter.address.state}, ${shelter.address.district} ${shelter.address.number || ''}`.trim()
          : '';

        const newRoute = await this.routeService.createRoute({
          title: shelter.name,
          subtitle: subtitle,
          description: shelter.description || '',
          path: routePath,
          entityType: 'ShelterEntity',
          entityId: shelterId,
          idToFetch: shelterId,
          type: RouteType.PAGE,
          image: imageUrl || '',
          public: true,
        });

        // Vincular route ao shelter
        await this.sheltersRepository.updateShelter(shelterId, { route: newRoute } as any);
      }
    }
  }

  // ❌ REMOVIDO: assignLeaders - Agora feito através de Teams
  // ❌ REMOVIDO: removeLeaders - Agora feito através de Teams
  // ❌ REMOVIDO: assignTeachers - Agora feito através de Teams
  // ❌ REMOVIDO: removeTeachers - Agora feito através de Teams
}