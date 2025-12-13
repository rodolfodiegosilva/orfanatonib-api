import { ForbiddenException, Injectable, BadRequestException, Inject, forwardRef, NotFoundException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SheltersRepository } from '../repositories/shelters.repository';
import { CreateShelterDto } from '../dto/create-shelter.dto';
import { CreateShelterRequestDto } from '../dto/create-shelter-request.dto';
import { AuthContextService } from 'src/auth/services/auth-context.service';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { AwsS3Service } from 'src/aws/aws-s3.service';
import { MediaType, UploadType } from 'src/share/media/media-item/media-item.entity';
import { RouteService } from 'src/route/route.service';
import { RouteType } from 'src/route/route-page.entity';
import { ShelterEntity } from '../entities/shelter.entity/shelter.entity';
import { TeamsService } from 'src/modules/teams/services/teams.service';
import { CreateTeamDto } from 'src/modules/teams/dto/create-team.dto';

type Ctx = { role?: string; userId?: string | null };

@Injectable()
export class CreateSheltersService {
  private readonly logger = new Logger(CreateSheltersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly sheltersRepository: SheltersRepository,
    private readonly authCtx: AuthContextService,
    private readonly mediaItemProcessor: MediaItemProcessor,
    private readonly s3Service: AwsS3Service,
    private readonly routeService: RouteService,
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
  parseAndValidateBody(body: any): CreateShelterDto {
    let dto: CreateShelterDto;
    
    // Verificar se veio como form-data com shelterData
    if (body.shelterData) {
      const parsed = typeof body.shelterData === 'string' 
        ? JSON.parse(body.shelterData) 
        : body.shelterData;
      dto = plainToInstance(CreateShelterDto, parsed);
    } else if (body.name) {
      // Se veio como JSON puro ou form-data com campos separados
      dto = plainToInstance(CreateShelterDto, body);
    } else {
      throw new BadRequestException('Dados do shelter não fornecidos. Use "shelterData" no form-data ou envie JSON direto.');
    }

    return dto;
  }

  /**
   * Valida o DTO e lança exceção se houver erros
   */
  async validateDto(dto: CreateShelterDto): Promise<void> {
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
   * Cria um shelter a partir de body e arquivos brutos
   */
  async createFromRaw(body: any, files: Express.Multer.File[], req: Request): Promise<ShelterEntity> {
    const dto = this.parseAndValidateBody(body);
    await this.validateDto(dto);
    const filesDict = this.mapFiles(files);
    return this.create(dto, req, filesDict);
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
      this.logger.debug(`🏗️ [create] Criando abrigo...`);
      const shelter = await this.sheltersRepository.createShelter(dto);
      this.logger.debug(`✅ [create] Abrigo criado: ID=${shelter.id}`);

      // Criar equipes (obrigatório)
      this.logger.debug(`🏗️ [create] Criando ${dto.teamsQuantity} equipe(s)...`);
      await this.createTeams(shelter.id, dto);
      this.logger.debug(`✅ [create] Equipes criadas com sucesso`);

      // Se fornecido mediaItem, criar DENTRO da transação para garantir rollback
      let imageUrl = '';
      if (dto.mediaItem && filesDict) {
        this.logger.debug(`🖼️ [create] Criando mídia...`);
        imageUrl = await this.createMediaItem(shelter.id, dto.mediaItem, filesDict);
        this.logger.debug(`✅ [create] Mídia criada: ${imageUrl}`);
      }

      // Criar route para o shelter (já com a imagem se houver)
      this.logger.debug(`🛤️ [create] Criando rota...`);
      await this.createRoute(queryRunner, shelter, dto, imageUrl);
      this.logger.debug(`✅ [create] Rota criada`);

      this.logger.debug(`💾 [create] Commitando transação...`);
      await queryRunner.commitTransaction();
      this.logger.log(`✅ [create] Transação commitada com sucesso`);

      // Buscar o abrigo completo com todas as relações após o commit
      // Isso evita problemas com entidades construídas manualmente dentro da transação
      this.logger.debug(`🔄 [create] Buscando abrigo completo para resposta...`);
      const completeShelter = await this.sheltersRepository.findOneOrFailForResponse(shelter.id);
      if (!completeShelter) {
        this.logger.error(`❌ [create] Abrigo não encontrado após criação: ${shelter.id}`);
        throw new NotFoundException('Abrigo não encontrado após criação');
      }
      this.logger.log(`✅ [create] Abrigo criado com sucesso: ID=${completeShelter.id}, teams=${completeShelter.teams?.length || 0}`);
      return completeShelter;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cria as equipes para o abrigo baseado em teamsQuantity
   * Se teams array for fornecido, usa os dados para vincular líderes/professores
   * 
   * Regras:
   * - Um professor só pode estar em UMA equipe
   * - Um líder pode estar em VÁRIAS equipes
   * - Uma equipe pode ter VÁRIOS líderes e VÁRIOS professores
   */
  private async createTeams(shelterId: string, dto: CreateShelterDto): Promise<void> {
    this.logger.debug(`🔵 [createTeams] Iniciando criação de equipes para abrigo: ${shelterId}`);
    type TeamInput = NonNullable<CreateShelterDto['teams']>[0];
    const teamsMap = new Map<number, TeamInput>();
    const teacherIdsUsed = new Set<string>();
    
    // Criar mapa das equipes fornecidas (se houver)
    if (dto.teams && dto.teams.length > 0) {
      this.logger.debug(`📋 [createTeams] Processando ${dto.teams.length} equipe(s) fornecida(s)...`);
      for (const team of dto.teams) {
        this.logger.debug(`   📋 [createTeams] Processando equipe ${team.numberTeam}...`);
        if (team.numberTeam < 1 || team.numberTeam > dto.teamsQuantity) {
          this.logger.error(`❌ [createTeams] numberTeam ${team.numberTeam} inválido`);
          throw new BadRequestException(
            `numberTeam ${team.numberTeam} deve estar entre 1 e ${dto.teamsQuantity}`
          );
        }
        if (teamsMap.has(team.numberTeam)) {
          this.logger.error(`❌ [createTeams] Duplicata: equipe ${team.numberTeam}`);
          throw new BadRequestException(`Duplicata: equipe ${team.numberTeam} já foi definida`);
        }
        
        // Validar: um professor só pode estar em UMA equipe
        if (team.teacherProfileIds && team.teacherProfileIds.length > 0) {
          this.logger.debug(`   👨‍🏫 [createTeams] Validando ${team.teacherProfileIds.length} professor(es)...`);
          for (const teacherId of team.teacherProfileIds) {
            if (teacherIdsUsed.has(teacherId)) {
              this.logger.error(`❌ [createTeams] Professor ${teacherId} duplicado`);
              throw new BadRequestException(
                `Professor com ID ${teacherId} não pode estar em múltiplas equipes. Um professor só pode pertencer a uma equipe.`
              );
            }
            teacherIdsUsed.add(teacherId);
          }
        }
        
        teamsMap.set(team.numberTeam, team);
        this.logger.debug(`   ✅ [createTeams] Equipe ${team.numberTeam} adicionada ao mapa`);
      }
    } else {
      this.logger.debug(`📋 [createTeams] Nenhuma equipe fornecida, criando equipes vazias`);
    }

    // Criar todas as equipes (1 até teamsQuantity)
    this.logger.debug(`🏗️ [createTeams] Criando ${dto.teamsQuantity} equipe(s)...`);
    for (let i = 1; i <= dto.teamsQuantity; i++) {
      const teamData = teamsMap.get(i);
      this.logger.debug(`   🏗️ [createTeams] Criando equipe ${i}/${dto.teamsQuantity}...`);
      
      const createTeamDto: CreateTeamDto = {
        numberTeam: i,
        description: teamData?.description,
        shelterId: shelterId,
        leaderProfileIds: teamData?.leaderProfileIds,
        teacherProfileIds: teamData?.teacherProfileIds,
      };

      this.logger.debug(`   📝 [createTeams] DTO da equipe ${i}: ${JSON.stringify({
        numberTeam: createTeamDto.numberTeam,
        shelterId: createTeamDto.shelterId,
        leaderCount: createTeamDto.leaderProfileIds?.length || 0,
        teacherCount: createTeamDto.teacherProfileIds?.length || 0,
      })}`);
      
      await this.teamsService.create(createTeamDto);
      this.logger.debug(`   ✅ [createTeams] Equipe ${i} criada com sucesso`);
    }
    this.logger.debug(`✅ [createTeams] Todas as equipes criadas com sucesso`);
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
    mediaInput: { 
      uploadType?: UploadType; 
      isLocalFile?: boolean; 
      fieldKey?: string; 
      url?: string;
      title?: string;
      description?: string;
    },
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