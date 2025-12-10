import { ForbiddenException, Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(UpdateSheltersService.name);

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
    this.logger.debug('🔍 [parseAndValidateBody] Iniciando parse do body');
    this.logger.debug(`📥 Body recebido: ${JSON.stringify(body, null, 2)}`);
    
    let dto: UpdateShelterDto;
    
    // Verificar se veio como form-data com shelterData
    if (body.shelterData) {
      this.logger.debug('📋 Body veio como form-data (shelterData presente)');
      const parsed = typeof body.shelterData === 'string' 
        ? JSON.parse(body.shelterData) 
        : body.shelterData;
      this.logger.debug(`📦 Dados parseados: ${JSON.stringify(parsed, null, 2)}`);
      dto = plainToInstance(UpdateShelterDto, parsed);
    } else {
      this.logger.debug('📋 Body veio como JSON puro');
      dto = plainToInstance(UpdateShelterDto, body);
    }

    this.logger.debug(`✅ DTO criado: ${JSON.stringify(dto, null, 2)}`);
    return dto;
  }

  /**
   * Valida o DTO e lança exceção se houver erros
   */
  async validateDto(dto: UpdateShelterDto): Promise<void> {
    this.logger.debug('🔍 [validateDto] Iniciando validação do DTO');
    const errors = await validate(dto);
    if (errors.length > 0) {
      this.logger.error(`❌ Erros de validação encontrados: ${JSON.stringify(errors, null, 2)}`);
      throw new BadRequestException(errors);
    }
    this.logger.debug('✅ DTO validado com sucesso');
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
    this.logger.log(`🚀 [updateFromRaw] Iniciando atualização do abrigo ID=${id}`);
    this.logger.debug(`📥 Body recebido: ${JSON.stringify(body, null, 2)}`);
    this.logger.debug(`📁 Arquivos: ${files.length} arquivo(s)`);
    
    const dto = this.parseAndValidateBody(body);
    this.logger.debug(`✅ DTO parseado: teamsQuantity=${dto.teamsQuantity}, teams=${dto.teams?.length || 0} equipe(s)`);
    
    await this.validateDto(dto);
    const filesDict = this.mapFiles(files);
    this.logger.debug(`📁 Arquivos mapeados: ${Object.keys(filesDict).length} arquivo(s)`);
    
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
    this.logger.log(`🔄 [update] Iniciando atualização do abrigo ID=${id}`);
    this.logger.debug(`📋 DTO recebido: ${JSON.stringify(dto, null, 2)}`);
    
    const ctx = await this.getCtx(req);
    this.logger.debug(`👤 Contexto: role=${ctx.role}, userId=${ctx.userId}`);
    
    if (!ctx.role || ctx.role === 'teacher') {
      this.logger.warn(`❌ Acesso negado: role=${ctx.role}`);
      throw new ForbiddenException('Acesso negado');
    }

    if (ctx.role === 'leader') {
      const allowed = await this.sheltersRepository.userHasAccessToShelter(id, ctx);
      this.logger.debug(`🔐 Líder tem acesso: ${allowed}`);
      if (!allowed) throw new NotFoundException('Shelter não encontrado');
    }

    // Buscar shelter atual para comparar teamsQuantity
    this.logger.debug('🔍 Buscando abrigo atual...');
    const currentShelter = await this.sheltersRepository.findOneOrFailForResponse(id, ctx);
    if (!currentShelter) {
      this.logger.error(`❌ Abrigo não encontrado: ID=${id}`);
      throw new NotFoundException('Shelter não encontrado');
    }
    const currentTeamsQuantity = currentShelter.teamsQuantity ?? 0;
    this.logger.debug(`📊 Abrigo atual: teamsQuantity=${currentTeamsQuantity}, nome=${currentShelter.name}`);

    // Atualizar shelter
    this.logger.debug('💾 Atualizando dados do abrigo...');
    const updatedShelter = await this.sheltersRepository.updateShelter(id, dto);
    this.logger.debug('✅ Dados do abrigo atualizados');

    // Atualizar equipes se teamsQuantity mudou ou se teams foi fornecido
    const shouldUpdateTeams = dto.teamsQuantity !== currentTeamsQuantity || dto.teams;
    this.logger.debug(`🔍 Verificando atualização de equipes: shouldUpdateTeams=${shouldUpdateTeams}`);
    this.logger.debug(`   - teamsQuantity mudou: ${dto.teamsQuantity !== currentTeamsQuantity} (${currentTeamsQuantity} -> ${dto.teamsQuantity})`);
    this.logger.debug(`   - teams fornecido: ${!!dto.teams} (${dto.teams?.length || 0} equipe(s))`);
    
    if (shouldUpdateTeams) {
      this.logger.log('👥 Atualizando equipes...');
      await this.updateTeams(id, dto, currentTeamsQuantity);
      this.logger.log('✅ Equipes atualizadas');
    } else {
      this.logger.debug('⏭️ Pulando atualização de equipes (não necessário)');
    }

    // Atualizar route se nome ou descrição mudaram
    const shouldUpdateRoute = dto.name || dto.description;
    this.logger.debug(`🔍 Verificando atualização de route: shouldUpdateRoute=${shouldUpdateRoute}`);
    if (shouldUpdateRoute) {
      this.logger.log('🛣️ Atualizando route...');
      await this.updateRoute(id, dto);
      this.logger.log('✅ Route atualizada');
    }

    // Processar media item APENAS se fornecido E se for uma mudança real
    const shouldUpdateMedia = dto.mediaItem && this.shouldUpdateMedia(dto.mediaItem, filesDict || {});
    this.logger.debug(`🔍 Verificando atualização de mídia: shouldUpdateMedia=${shouldUpdateMedia}`);
    if (shouldUpdateMedia && dto.mediaItem) {
      this.logger.log('🖼️ Atualizando mídia...');
      
      // Se uploadType é UPLOAD e tem arquivo, mas não tem fieldKey, usar o primeiro arquivo disponível
      const mediaItemToUpdate = { ...dto.mediaItem };
      if (mediaItemToUpdate.uploadType === UploadType.UPLOAD && filesDict && Object.keys(filesDict).length > 0 && !mediaItemToUpdate.fieldKey) {
        // Pegar o primeiro arquivo disponível (geralmente vem como "image")
        const firstFileKey = Object.keys(filesDict)[0];
        mediaItemToUpdate.fieldKey = firstFileKey;
        mediaItemToUpdate.isLocalFile = true;
        this.logger.debug(`📁 Arquivo encontrado: fieldKey=${firstFileKey}, filename=${filesDict[firstFileKey]?.originalname}`);
      }
      
      await this.updateMediaItem(id, mediaItemToUpdate, filesDict || {});
      this.logger.log('✅ Mídia atualizada');
    }

    this.logger.log(`✅ [update] Abrigo atualizado com sucesso ID=${id}`);
    return updatedShelter;
  }

  /**
   * Atualiza as equipes do abrigo baseado em teamsQuantity e teams array
   */
  private async updateTeams(shelterId: string, dto: UpdateShelterDto, currentTeamsQuantity: number): Promise<void> {
    this.logger.log(`👥 [updateTeams] Iniciando atualização de equipes para abrigo ID=${shelterId}`);
    this.logger.debug(`📊 Parâmetros: currentTeamsQuantity=${currentTeamsQuantity}, newTeamsQuantity=${dto.teamsQuantity}`);
    this.logger.debug(`📋 Teams fornecidos: ${dto.teams ? JSON.stringify(dto.teams, null, 2) : 'nenhum'}`);
    
    this.logger.debug('🔍 Buscando equipes existentes...');
    const existingTeams = await this.teamsService.findByShelter(shelterId);
    this.logger.debug(`📊 Equipes existentes encontradas: ${existingTeams.length}`);
    
    const existingTeamsMap = new Map<number, { id: string; numberTeam: number }>();
    existingTeams.forEach(team => {
      existingTeamsMap.set(team.numberTeam, { id: team.id, numberTeam: team.numberTeam });
      this.logger.debug(`   - Equipe ${team.numberTeam}: ID=${team.id}`);
    });

    type TeamInput = NonNullable<UpdateShelterDto['teams']>[0];
    const teamsMap = new Map<number, TeamInput>();
    
    // Criar mapa das equipes fornecidas (se houver)
    if (dto.teams && dto.teams.length > 0) {
      this.logger.debug(`📋 Processando ${dto.teams.length} equipe(s) fornecida(s)...`);
      for (const team of dto.teams) {
        this.logger.debug(`   - Processando equipe ${team.numberTeam}: ${JSON.stringify(team)}`);
        if (team.numberTeam < 1 || team.numberTeam > dto.teamsQuantity) {
          this.logger.error(`❌ numberTeam ${team.numberTeam} inválido (deve estar entre 1 e ${dto.teamsQuantity})`);
          throw new BadRequestException(
            `numberTeam ${team.numberTeam} deve estar entre 1 e ${dto.teamsQuantity}`
          );
        }
        if (teamsMap.has(team.numberTeam)) {
          this.logger.error(`❌ Duplicata: equipe ${team.numberTeam} já foi definida`);
          throw new BadRequestException(`Duplicata: equipe ${team.numberTeam} já foi definida`);
        }
        teamsMap.set(team.numberTeam, team);
        this.logger.debug(`   ✅ Equipe ${team.numberTeam} adicionada ao mapa`);
      }
    } else {
      this.logger.debug('📋 Nenhuma equipe fornecida no DTO');
    }

    // Se teamsQuantity diminuiu, remover equipes extras
    if (dto.teamsQuantity < currentTeamsQuantity) {
      this.logger.log(`🗑️ Removendo ${currentTeamsQuantity - dto.teamsQuantity} equipe(s) extra(s)...`);
      for (let i = dto.teamsQuantity + 1; i <= currentTeamsQuantity; i++) {
        const existingTeam = existingTeamsMap.get(i);
        if (existingTeam) {
          this.logger.debug(`   🗑️ Removendo equipe ${i} (ID=${existingTeam.id})`);
          await this.teamsService.remove(existingTeam.id);
          this.logger.debug(`   ✅ Equipe ${i} removida`);
        }
      }
    }

    // Atualizar ou criar equipes (1 até teamsQuantity)
    this.logger.log(`🔄 Processando equipes de 1 até ${dto.teamsQuantity}...`);
    for (let i = 1; i <= dto.teamsQuantity; i++) {
      const teamData = teamsMap.get(i);
      const existingTeam = existingTeamsMap.get(i);

      this.logger.debug(`🔍 Processando equipe ${i}:`);
      this.logger.debug(`   - Existe no banco: ${!!existingTeam}`);
      this.logger.debug(`   - Dados fornecidos: ${!!teamData ? JSON.stringify(teamData) : 'nenhum'}`);

      if (existingTeam) {
        // Atualizar equipe existente - SEMPRE desvincular tudo e vincular o que vem no payload
        this.logger.log(`   ✏️ Atualizando equipe ${i} (ID=${existingTeam.id})...`);
        
        // Se teamData existe, usar os dados; senão, desvincular todos (arrays vazios)
        const leaderIds = teamData ? (teamData.leaderProfileIds ?? []) : [];
        const teacherIds = teamData ? (teamData.teacherProfileIds ?? []) : [];
        
        this.logger.debug(`   🔍 teamData existe: ${!!teamData}`);
        this.logger.debug(`   🔍 teamData.leaderProfileIds: ${teamData ? JSON.stringify(teamData.leaderProfileIds) : 'N/A'}`);
        this.logger.debug(`   🔍 teamData.teacherProfileIds: ${teamData ? JSON.stringify(teamData.teacherProfileIds) : 'N/A'}`);
        this.logger.debug(`   🔍 leaderIds final: ${JSON.stringify(leaderIds)} (length=${leaderIds.length})`);
        this.logger.debug(`   🔍 teacherIds final: ${JSON.stringify(teacherIds)} (length=${teacherIds.length})`);
        
        const updateTeamDto: UpdateTeamDto = {
          description: teamData?.description,
          // Sempre passar os arrays: se teamData existe, usa os arrays dele; senão, usa arrays vazios para desvincular tudo
          leaderProfileIds: leaderIds,
          teacherProfileIds: teacherIds,
        };
        
        this.logger.debug(`   📋 DTO de atualização: ${JSON.stringify(updateTeamDto, null, 2)}`);
        this.logger.debug(`   🔄 Desvinculando todos e vinculando apenas o que vem no payload`);
        
        await this.teamsService.update(existingTeam.id, updateTeamDto);
        this.logger.log(`   ✅ Equipe ${i} atualizada`);
      } else {
        // Criar nova equipe
        this.logger.log(`   ➕ Criando nova equipe ${i}...`);
        const createTeamDto: CreateTeamDto = {
          numberTeam: i,
          description: teamData?.description,
          shelterId: shelterId,
          leaderProfileIds: teamData?.leaderProfileIds,
          teacherProfileIds: teamData?.teacherProfileIds,
        };
        this.logger.debug(`   📋 DTO de criação: ${JSON.stringify(createTeamDto, null, 2)}`);
        await this.teamsService.create(createTeamDto);
        this.logger.log(`   ✅ Equipe ${i} criada`);
      }
    }
    
    this.logger.log(`✅ [updateTeams] Atualização de equipes concluída para abrigo ID=${shelterId}`);
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
    this.logger.debug(`🖼️ [updateMediaItem] Iniciando atualização de mídia para abrigo ID=${shelterId}`);
    this.logger.debug(`📋 mediaInput: ${JSON.stringify(mediaInput, null, 2)}`);
    this.logger.debug(`📁 filesDict keys: ${Object.keys(filesDict).join(', ')}`);
    this.logger.debug(`📁 filesDict: ${JSON.stringify(Object.keys(filesDict).map(key => ({ key, filename: filesDict[key]?.originalname })), null, 2)}`);
    
    // Buscar media item existente
    const existingMedia = await this.mediaItemProcessor.findMediaItemByTarget(shelterId, 'ShelterEntity');
    this.logger.debug(`🔍 Media existente: ${existingMedia ? `ID=${existingMedia.id}, URL=${existingMedia.url}` : 'não encontrada'}`);

    if (existingMedia) {
      // ATUALIZAR media existente
      const media = this.mediaItemProcessor.buildBaseMediaItem(
        { ...mediaInput, mediaType: MediaType.IMAGE },
        shelterId,
        'ShelterEntity',
      );

      if (mediaInput.uploadType === UploadType.UPLOAD && mediaInput.isLocalFile) {
        // Upload de novo arquivo
        this.logger.debug(`📤 Upload de novo arquivo - fieldKey=${mediaInput.fieldKey}`);
        const file = filesDict[mediaInput.fieldKey || ''];
        if (!file) {
          this.logger.error(`❌ Arquivo não encontrado! fieldKey=${mediaInput.fieldKey}, filesDict keys=${Object.keys(filesDict).join(', ')}`);
          throw new BadRequestException(`Arquivo não encontrado para upload. FieldKey: ${mediaInput.fieldKey}, Arquivos disponíveis: ${Object.keys(filesDict).join(', ')}`);
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
        this.logger.debug(`📤 Criando novo media item com upload - fieldKey=${mediaInput.fieldKey}`);
        const file = filesDict[mediaInput.fieldKey || ''];
        if (!file) {
          this.logger.error(`❌ Arquivo não encontrado! fieldKey=${mediaInput.fieldKey}, filesDict keys=${Object.keys(filesDict).join(', ')}`);
          throw new BadRequestException(`Arquivo não encontrado para upload. FieldKey: ${mediaInput.fieldKey}, Arquivos disponíveis: ${Object.keys(filesDict).join(', ')}`);
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