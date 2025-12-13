import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { RouteEntity } from '../route-page.entity';
import { RouteRepository } from '../route-page.repository';
import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';
import { MeditationEntity } from 'src/meditation/entities/meditation.entity';
import { DayEntity } from 'src/meditation/entities/day.entity';
import { EventEntity } from 'src/pages/event-page/entities/event.entity';
import { DocumentEntity } from 'src/documents/entities/document.entity';
import { VisitMaterialsPageEntity } from 'src/pages/visit-material-page/entities/visit-material-page.entity';
import { VideosPage } from 'src/pages/video-page/entities/video-page.entity';
import { ImagePageEntity } from 'src/pages/image-page/entity/Image-page.entity';
import { IdeasPageEntity } from 'src/pages/ideas-page/entities/ideas-page.entity';
import { InformativeEntity } from 'src/informative/entities/informative.entity';

/**
 * Mapeamento de entityType para a entidade correspondente
 */
const ENTITY_TYPE_MAP: Record<string, { entity: any; tableName: string; checkMethod?: 'entity' | 'meditation' }> = {
  'shelterPage': { entity: ShelterEntity, tableName: 'shelters' },
  'ShelterPage': { entity: ShelterEntity, tableName: 'shelters' },
  'ShelterEntity': { entity: ShelterEntity, tableName: 'shelters' },
  'Meditation': { entity: MeditationEntity, tableName: 'meditations' },
  'MeditationDay': { entity: DayEntity, tableName: 'meditation_days', checkMethod: 'meditation' }, // entityId aponta para meditation.id, mas verifica DayEntity
  'Event': { entity: EventEntity, tableName: 'events' },
  'Document': { entity: DocumentEntity, tableName: 'documents' },
  'VisitMaterialsPage': { entity: VisitMaterialsPageEntity, tableName: 'visit_materials_pages' },
  'VideosPage': { entity: VideosPage, tableName: 'videos_pages' },
  'ImagesPage': { entity: ImagePageEntity, tableName: 'images_pages' },
  'IdeasPage': { entity: IdeasPageEntity, tableName: 'ideas_pages' },
  'Informative': { entity: InformativeEntity, tableName: 'informatives' },
};

@Injectable()
export class CleanupOrphanRoutesService {
  private readonly logger = new Logger(CleanupOrphanRoutesService.name);

  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Deleta todas as rotas órfãs (rotas cujas entidades relacionadas não existem mais)
   */
  async cleanupOrphanRoutes(): Promise<{
    totalRoutes: number;
    orphanRoutes: number;
    deletedRoutes: string[];
    errors: Array<{ routeId: string; error: string }>;
  }> {
    this.logger.log('🔍 Iniciando limpeza de rotas órfãs...');

    // Buscar todas as rotas diretamente do banco (sem rotas virtuais)
    const allRoutes = await this.routeRepo.find({
      order: { createdAt: 'ASC' },
    });
    this.logger.log(`📊 Total de rotas encontradas no banco: ${allRoutes.length}`);

    const orphanRoutes: RouteEntity[] = [];
    const deletedRoutes: string[] = [];
    const errors: Array<{ routeId: string; error: string }> = [];

    // Agrupar rotas por entityType para processar em lote
    const routesByType = new Map<string, RouteEntity[]>();
    for (const route of allRoutes) {
      if (!routesByType.has(route.entityType)) {
        routesByType.set(route.entityType, []);
      }
      routesByType.get(route.entityType)!.push(route);
    }

    this.logger.log(`📋 Tipos de entidades encontrados: ${routesByType.size}`);
    for (const [type, routes] of routesByType.entries()) {
      this.logger.log(`   📌 ${type}: ${routes.length} rota(s)`);
    }

    // Processar cada tipo de entidade
    for (const [entityType, routes] of routesByType.entries()) {
      this.logger.log(`🔍 Processando ${routes.length} rota(s) do tipo: ${entityType}`);

      const entityConfig = ENTITY_TYPE_MAP[entityType];
      if (!entityConfig) {
        this.logger.warn(`⚠️ Tipo de entidade desconhecido: ${entityType} - marcando ${routes.length} rota(s) como órfãs`);
        // Tipos desconhecidos são considerados órfãos (não podem ser verificados)
        orphanRoutes.push(...routes);
        this.logger.warn(`   🗑️ ${routes.length} rota(s) marcada(s) como órfã(s) por tipo desconhecido`);
        continue;
      }
      
      this.logger.log(`   ✅ Tipo ${entityType} mapeado para entidade: ${entityConfig.entity.name}, tabela: ${entityConfig.tableName}`);

      // Buscar todos os IDs das entidades que ainda existem usando idToFetch (que é o campo usado para buscar)
      const idsToCheck = routes.map(r => r.idToFetch);
      this.logger.log(`   🔍 Verificando ${idsToCheck.length} ID(s) do tipo ${entityType}`);
      this.logger.log(`   📋 IDs a verificar (primeiros 10): ${idsToCheck.slice(0, 10).join(', ')}`);
      
      // Remover duplicatas
      const uniqueIdsToCheck = [...new Set(idsToCheck)];
      this.logger.log(`   📋 IDs únicos a verificar: ${uniqueIdsToCheck.length} (${idsToCheck.length - uniqueIdsToCheck.length} duplicata(s) removida(s))`);
      
      if (uniqueIdsToCheck.length === 0) {
        this.logger.warn(`   ⚠️ Nenhum ID para verificar! Todas as ${routes.length} rotas serão marcadas como órfãs`);
        orphanRoutes.push(...routes);
        continue;
      }
      
      let existingEntities: any[] = [];

      this.logger.log(`   🔎 Executando query no banco para verificar existência...`);
      if (entityConfig.checkMethod === 'meditation') {
        // Para MeditationDay, idToFetch aponta para meditation.id
        this.logger.log(`   📝 Query: SELECT id FROM meditations WHERE id IN (${uniqueIdsToCheck.slice(0, 3).join(', ')}, ...)`);
        const repository = this.dataSource.getRepository(MeditationEntity);
        const entities = await repository.find({
          where: { id: In(uniqueIdsToCheck) },
          select: ['id'],
        });
        existingEntities = entities.map(e => ({ id: String(e.id) }));
        this.logger.log(`   📊 Query retornou ${entities.length} entidade(s) do tipo MeditationEntity`);
      } else {
        this.logger.log(`   📝 Query: SELECT id FROM ${entityConfig.tableName} WHERE id IN (${uniqueIdsToCheck.slice(0, 3).join(', ')}, ...)`);
        const repository = this.dataSource.getRepository(entityConfig.entity);
        const entities = await repository.find({
          where: { id: In(uniqueIdsToCheck) },
          select: ['id'],
        });
        existingEntities = entities.map(e => ({ id: String(e.id) }));
        this.logger.log(`   📊 Query retornou ${entities.length} entidade(s) do tipo ${entityConfig.entity.name}`);
      }

      this.logger.log(`   ✅ Encontradas ${existingEntities.length} entidade(s) existente(s) de ${uniqueIdsToCheck.length} verificada(s)`);
      this.logger.log(`   📊 IDs retornados pela query (primeiros 10): ${existingEntities.slice(0, 10).map(e => e.id).join(', ')}`);
      
      // Verificar se a query realmente filtrou corretamente
      if (existingEntities.length > uniqueIdsToCheck.length) {
        this.logger.error(`   ❌ ERRO: Query retornou ${existingEntities.length} entidades, mas só procuramos ${uniqueIdsToCheck.length}! A query não está filtrando corretamente!`);
      } else if (existingEntities.length < uniqueIdsToCheck.length) {
        this.logger.warn(`   ⚠️ Query retornou ${existingEntities.length} entidades de ${uniqueIdsToCheck.length} procuradas. ${uniqueIdsToCheck.length - existingEntities.length} entidade(s) não encontrada(s) - possíveis rotas órfãs!`);
      }
      
      // Converter para string para garantir comparação correta (pode haver diferença de tipo UUID vs string)
      const existingIds = new Set(existingEntities.map((e: any) => String(e.id)));
      this.logger.log(`   📊 Set de IDs existentes criado com ${existingIds.size} elemento(s)`);
      this.logger.log(`   📊 IDs existentes (primeiros 10): ${Array.from(existingIds).slice(0, 10).join(', ')}`);
      
      // Verificar se os IDs procurados estão realmente nos IDs retornados
      const idsProcuradosSet = new Set(uniqueIdsToCheck.map(id => String(id)));
      const idsEncontrados = Array.from(existingIds).filter(id => idsProcuradosSet.has(id));
      const idsNaoEncontrados = Array.from(idsProcuradosSet).filter(id => !existingIds.has(id));
      this.logger.log(`   🔍 Verificação cruzada: ${idsEncontrados.length} IDs procurados foram encontrados, ${idsNaoEncontrados.length} não foram encontrados`);
      if (idsNaoEncontrados.length > 0) {
        this.logger.warn(`   ⚠️ IDs não encontrados (primeiros 10): ${idsNaoEncontrados.slice(0, 10).join(', ')}`);
        this.logger.warn(`   ⚠️ Isso indica que essas ${idsNaoEncontrados.length} rota(s) são órfãs!`);
      } else {
        this.logger.log(`   ✅ Todos os ${idsEncontrados.length} IDs procurados foram encontrados na tabela ${entityConfig.tableName}`);
      }

      // Identificar rotas órfãs - verificar se idToFetch existe
      let orphanCountForType = 0;
      this.logger.log(`   🔍 Comparando ${routes.length} rota(s) com IDs existentes...`);
      for (const route of routes) {
        const idToFetchStr = String(route.idToFetch);
        const exists = existingIds.has(idToFetchStr);
        if (!exists) {
          orphanRoutes.push(route);
          orphanCountForType++;
          this.logger.warn(`   🗑️ Rota órfã encontrada: ID=${route.id}, path="${route.path}", entityType=${route.entityType}, idToFetch=${route.idToFetch}, entityId=${route.entityId}`);
        } else {
          this.logger.debug(`   ✅ Rota ID=${route.id}: idToFetch="${idToFetchStr}" existe na tabela ${entityConfig.tableName}`);
        }
      }
      
      if (orphanCountForType > 0) {
        this.logger.warn(`   ⚠️ Total de ${orphanCountForType} rota(s) órfã(s) encontrada(s) para o tipo ${entityType}`);
      } else {
        this.logger.log(`   ✅ Nenhuma rota órfã encontrada para o tipo ${entityType} (todas as ${routes.length} rotas têm entidades correspondentes)`);
      }
    }

    this.logger.log(`🗑️ Total de rotas órfãs encontradas: ${orphanRoutes.length}`);

    // Deletar rotas órfãs
    if (orphanRoutes.length > 0) {
      this.logger.log(`🗑️ Deletando ${orphanRoutes.length} rota(s) órfã(s)...`);
      
      for (const route of orphanRoutes) {
        const routeId = route.id; // Salvar ID antes de deletar
        try {
          await this.routeRepo.remove(route);
          deletedRoutes.push(routeId);
          this.logger.debug(`   ✅ Rota deletada: ID=${routeId}, path="${route.path}"`);
        } catch (error: any) {
          const errorMsg = error.message || 'Erro desconhecido';
          errors.push({ routeId, error: errorMsg });
          this.logger.error(`   ❌ Erro ao deletar rota ID=${routeId}: ${errorMsg}`);
        }
      }
    }

    this.logger.log(`✅ Limpeza concluída: ${deletedRoutes.length} rota(s) deletada(s), ${errors.length} erro(s)`);

    return {
      totalRoutes: allRoutes.length,
      orphanRoutes: orphanRoutes.length,
      deletedRoutes,
      errors,
    };
  }

  /**
   * Verifica e retorna informações sobre rotas órfãs sem deletá-las
   */
  async findOrphanRoutes(): Promise<{
    totalRoutes: number;
    orphanRoutes: Array<{
      id: string;
      path: string;
      entityType: string;
      entityId: string;
      idToFetch: string;
      title: string;
    }>;
  }> {
    this.logger.log('🔍 Buscando rotas órfãs...');

    // Buscar todas as rotas diretamente do banco (sem rotas virtuais)
    const allRoutes = await this.routeRepo.find({
      order: { createdAt: 'ASC' },
    });
    this.logger.log(`📊 Total de rotas encontradas no banco: ${allRoutes.length}`);

    const orphanRoutes: Array<{
      id: string;
      path: string;
      entityType: string;
      entityId: string;
      idToFetch: string;
      title: string;
    }> = [];

    // Agrupar rotas por entityType
    const routesByType = new Map<string, RouteEntity[]>();
    for (const route of allRoutes) {
      if (!routesByType.has(route.entityType)) {
        routesByType.set(route.entityType, []);
      }
      routesByType.get(route.entityType)!.push(route);
    }

    this.logger.log(`📋 Tipos de entidades encontrados: ${routesByType.size}`);
    for (const [type, routes] of routesByType.entries()) {
      this.logger.log(`   📌 ${type}: ${routes.length} rota(s)`);
    }

    // Processar cada tipo de entidade
    for (const [entityType, routes] of routesByType.entries()) {
      this.logger.log(`🔍 Processando ${routes.length} rota(s) do tipo: ${entityType}`);

      const entityConfig = ENTITY_TYPE_MAP[entityType];
      if (!entityConfig) {
        this.logger.warn(`⚠️ Tipo de entidade desconhecido: ${entityType} - marcando ${routes.length} rota(s) como órfãs`);
        // Tipos desconhecidos são considerados órfãos
        for (const route of routes) {
          orphanRoutes.push({
            id: route.id,
            path: route.path,
            entityType: route.entityType,
            entityId: route.entityId,
            idToFetch: route.idToFetch,
            title: route.title,
          });
        }
        this.logger.warn(`   🗑️ ${routes.length} rota(s) marcada(s) como órfã(s) por tipo desconhecido`);
        continue;
      }

      this.logger.log(`   ✅ Tipo ${entityType} mapeado para entidade: ${entityConfig.entity.name}, tabela: ${entityConfig.tableName}`);

      // Buscar todos os IDs das entidades que ainda existem usando idToFetch (que é o campo usado para buscar)
      const idsToCheck = routes.map(r => r.idToFetch);
      this.logger.log(`   🔍 Verificando ${idsToCheck.length} ID(s) do tipo ${entityType}`);
      this.logger.log(`   📋 IDs a verificar (primeiros 10): ${idsToCheck.slice(0, 10).join(', ')}`);
      
      // Remover duplicatas
      const uniqueIdsToCheck = [...new Set(idsToCheck)];
      this.logger.log(`   📋 IDs únicos a verificar: ${uniqueIdsToCheck.length} (${idsToCheck.length - uniqueIdsToCheck.length} duplicata(s) removida(s))`);
      
      if (uniqueIdsToCheck.length === 0) {
        this.logger.warn(`   ⚠️ Nenhum ID para verificar! Todas as ${routes.length} rotas serão marcadas como órfãs`);
        for (const route of routes) {
          orphanRoutes.push({
            id: route.id,
            path: route.path,
            entityType: route.entityType,
            entityId: route.entityId,
            idToFetch: route.idToFetch,
            title: route.title,
          });
        }
        continue;
      }
      
      let existingEntities: any[] = [];

      this.logger.log(`   🔎 Executando query no banco para verificar existência...`);
      if (entityConfig.checkMethod === 'meditation') {
        // Para MeditationDay, idToFetch aponta para meditation.id
        this.logger.log(`   📝 Query: SELECT id FROM meditations WHERE id IN (${uniqueIdsToCheck.slice(0, 3).join(', ')}, ...)`);
        const repository = this.dataSource.getRepository(MeditationEntity);
        const entities = await repository.find({
          where: { id: In(uniqueIdsToCheck) },
          select: ['id'],
        });
        existingEntities = entities.map(e => ({ id: String(e.id) }));
        this.logger.log(`   📊 Query retornou ${entities.length} entidade(s) do tipo MeditationEntity`);
      } else {
        this.logger.log(`   📝 Query: SELECT id FROM ${entityConfig.tableName} WHERE id IN (${uniqueIdsToCheck.slice(0, 3).join(', ')}, ...)`);
        const repository = this.dataSource.getRepository(entityConfig.entity);
        const entities = await repository.find({
          where: { id: In(uniqueIdsToCheck) },
          select: ['id'],
        });
        existingEntities = entities.map(e => ({ id: String(e.id) }));
        this.logger.log(`   📊 Query retornou ${entities.length} entidade(s) do tipo ${entityConfig.entity.name}`);
      }

      this.logger.log(`   ✅ Encontradas ${existingEntities.length} entidade(s) existente(s) de ${uniqueIdsToCheck.length} verificada(s)`);
      this.logger.log(`   📊 IDs retornados pela query (primeiros 10): ${existingEntities.slice(0, 10).map(e => e.id).join(', ')}`);
      
      // Converter para string para garantir comparação correta (pode haver diferença de tipo UUID vs string)
      const existingIds = new Set(existingEntities.map((e: any) => String(e.id)));
      this.logger.log(`   📊 Set de IDs existentes criado com ${existingIds.size} elemento(s)`);
      this.logger.log(`   📊 IDs existentes (primeiros 10): ${Array.from(existingIds).slice(0, 10).join(', ')}`);

      // Identificar rotas órfãs - verificar se idToFetch existe
      let orphanCountForType = 0;
      this.logger.log(`   🔍 Comparando ${routes.length} rota(s) com IDs existentes...`);
      
      // Log de exemplo: verificar se os primeiros IDs procurados estão nos IDs retornados
      const firstIdsToCheck = idsToCheck.slice(0, 5);
      const firstIdsFound = firstIdsToCheck.filter(id => existingIds.has(String(id)));
      this.logger.log(`   🔍 Exemplo: Dos primeiros 5 IDs procurados, ${firstIdsFound.length} foram encontrados`);
      if (firstIdsFound.length < firstIdsToCheck.length) {
        const missing = firstIdsToCheck.filter(id => !existingIds.has(String(id)));
        this.logger.warn(`   ⚠️ IDs não encontrados (exemplo): ${missing.join(', ')}`);
      }
      
      for (const route of routes) {
        const idToFetchStr = String(route.idToFetch);
        const exists = existingIds.has(idToFetchStr);
        if (!exists) {
          orphanRoutes.push({
            id: route.id,
            path: route.path,
            entityType: route.entityType,
            entityId: route.entityId,
            idToFetch: route.idToFetch,
            title: route.title,
          });
          orphanCountForType++;
          this.logger.warn(`   🗑️ Rota órfã encontrada: ID=${route.id}, path="${route.path}", entityType=${route.entityType}, idToFetch=${route.idToFetch}, entityId=${route.entityId}`);
        }
      }
      
      if (orphanCountForType > 0) {
        this.logger.warn(`   ⚠️ Total de ${orphanCountForType} rota(s) órfã(s) encontrada(s) para o tipo ${entityType}`);
      } else {
        this.logger.log(`   ✅ Nenhuma rota órfã encontrada para o tipo ${entityType} (todas as ${routes.length} rotas têm entidades correspondentes)`);
      }
    }

    this.logger.log(`📊 Rotas órfãs encontradas: ${orphanRoutes.length}`);

    return {
      totalRoutes: allRoutes.length,
      orphanRoutes,
    };
  }
}
