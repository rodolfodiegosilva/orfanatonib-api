import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VisitMaterialsPageRepository } from '../visit-material.repository';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { VisitMaterialsPageResponseDTO } from '../dto/visit-material-response.dto';
import { VisitMaterialsPageEntity } from '../entities/visit-material-page.entity';
import { MediaTargetType } from 'src/share/media/media-target-type.enum';
import { MediaItemEntity } from 'src/share/media/media-item/media-item.entity';
import { QueryVisitMaterialsPageDto } from '../dto/query-visit-material-pages.dto';

@Injectable()
export class VisitMaterialsPageGetService {
  private readonly logger = new Logger(VisitMaterialsPageGetService.name);

  constructor(
    private readonly repo: VisitMaterialsPageRepository,
    private readonly mediaItemProcessor: MediaItemProcessor,
  ) { }

  async findAllPages(): Promise<VisitMaterialsPageEntity[]> {
    this.logger.debug('📥 Buscando todas as páginas');
    return this.repo.findAllPages();
  }

  async findOnePage(id: string): Promise<VisitMaterialsPageEntity> {
    this.logger.debug(`📄 Buscando página ID=${id}`);
    const page = await this.repo.findOnePageById(id);
    if (!page) throw new NotFoundException('Página não encontrada');
    return page;
  }

  async findPageWithMedia(id: string): Promise<VisitMaterialsPageResponseDTO> {
    this.logger.debug(`🔍 Buscando página com mídias ID=${id}`);
    const page = await this.findOnePage(id);
    const mediaItems = await this.mediaItemProcessor.findMediaItemsByTarget(
      page.id,
      MediaTargetType.VisitMaterialsPage,
    );
    return VisitMaterialsPageResponseDTO.fromEntity(page, mediaItems);
  }

  async findAllPagesWithMedia(
    query?: QueryVisitMaterialsPageDto,
  ): Promise<VisitMaterialsPageResponseDTO[]> {
    if (query) {
      this.logger.debug(`📥 Buscando páginas com mídias e filtros: ${JSON.stringify(query)}`);
    } else {
      this.logger.debug('📥 Buscando todas as páginas com mídias');
    }
    
    const pages = query
      ? await this.repo.findAllPagesWithFilters(query)
      : await this.repo.findAllPages();
    
    const pageIds = pages.map((p) => p.id);
    const allMedia = await this.mediaItemProcessor.findManyMediaItemsByTargets(
      pageIds,
      MediaTargetType.VisitMaterialsPage,
    );

    const grouped = pageIds.reduce((acc, id) => {
      acc[id] = allMedia.filter((m) => m.targetId === id);
      return acc;
    }, {} as Record<string, MediaItemEntity[]>);

    return pages.map((page) =>
      VisitMaterialsPageResponseDTO.fromEntity(page, grouped[page.id] || []),
    );
  }

  async setCurrentWeek(id: string): Promise<any> {
    this.logger.debug('📥 Iniciando processo para definir "material da semana atual"...');

    try {
      this.logger.debug(`🔎 Buscando página pelo ID: ${id}`);
      const weekPage = await this.repo.findOnePageById(id);

      if (!weekPage) {
        this.logger.warn(`⚠️ Nenhuma página encontrada com ID: ${id}`);
        throw new Error(`Página com ID ${id} não encontrada.`);
      }

      this.logger.debug(`📄 Página alvo encontrada: ${weekPage.id} - ${weekPage.title}`);

      const weekPageCurrent = await this.repo.findCurrentWeek();
      if (weekPageCurrent) {
        this.logger.debug(`📌 Página atual marcada como "semana atual": ${weekPageCurrent.id} - ${weekPageCurrent.title}`);
      } else {
        this.logger.debug('ℹ️ Nenhuma página estava marcada como atual.');
      }

      if (weekPageCurrent && weekPageCurrent.id !== weekPage.id) {
        this.logger.debug(`🧼 Limpando flag "currentWeek" da página anterior: ${weekPageCurrent.id}`);
        weekPageCurrent.currentWeek = false;
        weekPageCurrent.route.current = false;
        await this.repo.savePage(weekPageCurrent);
        this.logger.debug(`✅ Página ${weekPageCurrent.id} atualizada com currentWeek=false`);
      }

      this.logger.debug(`🏁 Atualizando página ${weekPage.id} para currentWeek=true`);
      weekPage.currentWeek = true;
      weekPage.route.current = true;
      weekPage.route.public = true;

      await this.repo.savePage(weekPage);
      this.logger.debug(`✅ Página ${weekPage.id} marcada como material da semana atual.`);

    } catch (error) {
      this.logger.error(`❌ Erro ao definir página como atual: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCurrentWeek(): Promise<VisitMaterialsPageEntity | { message: string }> {
    this.logger.debug(`📄 Buscando página de material da semana atual`);
    const page = await this.repo.findCurrentWeek();
    if (!page) {
      this.logger.debug('Nenhuma página da semana atual encontrada');
      return { message: 'Nenhuma página da semana atual encontrada.' };
    }
    return page;
  }

}