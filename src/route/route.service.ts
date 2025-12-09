import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { RouteRepository } from './route-page.repository';
import { RouteEntity, RouteType } from './route-page.entity';
import { EntityManager } from 'typeorm';
import { GetMeditationService } from 'src/meditation/services/get-meditation.service';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  constructor(
    private readonly routeRepo: RouteRepository,
    private readonly getMeditationService: GetMeditationService

  ) { }

  generateRoute(title: string, prefix: string): string {
    const route = (
      prefix +
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim()
    );
    this.logger.debug(`🔤 Rota gerada: ${route}`);
    return route;
  }

  async generateAvailablePath(baseName: string, prefix: string): Promise<string> {
    const basePath = this.generateRoute(baseName, prefix);
    let candidate = basePath;
    let count = 1;

    while (await this.routeRepo.findByPath(candidate)) {
      candidate = `${basePath}_${count++}`;
    }

    this.logger.debug(`🆗 Caminho disponível: ${candidate}`);
    return candidate;
  }

  async createRoute(data: {
    title: string;
    public?: boolean;
    subtitle: string;
    idToFetch: string;
    path?: string;
    entityType: string;
    description: string;
    entityId: string;
    type: RouteType;
    image?: string;
    prefix?: string;
  }): Promise<RouteEntity> {
    const path = data.path || (await this.generateAvailablePath(data.title, data.prefix ?? ''));
    this.logger.debug(`🚧 Criando rota com path: "${path}"`);

    const route = new RouteEntity();
    Object.assign(route, {
      title: data.title,
      public: data.public ?? true,
      subtitle: data.subtitle,
      idToFetch: data.idToFetch,
      path,
      entityType: data.entityType,
      description: data.description,
      entityId: data.entityId,
      type: data.type,
      image: data.image || '',
    });

    const saved = await this.routeRepo.save(route);
    this.logger.debug(`✅ Rota criada: ID=${saved.id}`);
    return saved;
  }

  async updateRoute(id: string, updateData: Partial<Pick<RouteEntity, 'title' | 'description' | 'path' | 'subtitle'>>): Promise<RouteEntity> {
    const route = await this.routeRepo.findOne({ where: { id } });
    if (!route) throw new NotFoundException('Rota não encontrada');

    if (updateData.path) {
      const existing = await this.routeRepo.findByPath(updateData.path);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`A rota "${updateData.path}" já está em uso`);
      }
    }

    Object.assign(route, updateData);
    const updated = await this.routeRepo.save(route);

    this.logger.debug(`✏️ Rota atualizada: ID=${updated.id}`);
    return updated;
  }

  async findAllRoutes(): Promise<RouteEntity[]> {
    this.logger.debug(`📄 Buscando todas as rotas`);

    const meditation = await this.getMeditationService.getThisWeekMeditation();
    const routes = await this.routeRepo.find();

    const meditationData = meditation.meditation;
    if (!meditationData) return routes;

    const dayRoutes = meditationData.days.map((day) => ({
      id: day.id,
      title: day.topic,
      subtitle: day.verse,
      description: day.verse,
      path: day.day,
      public: false,
      current: false,
      image: meditationData.media?.url,
      idToFetch: meditationData.id,
      entityType: 'MeditationDay',
      entityId: meditationData.id,
      type: 'page',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RouteEntity));

    routes.push(...dayRoutes);
    return routes;
  }


  async findById(id: string): Promise<RouteEntity | null> {
    this.logger.debug(`🔍 Buscando rota ID=${id}`);
    return this.routeRepo.findOne({ where: { id } });
  }

  async findRouteByEntityId(entityId: string): Promise<RouteEntity | null> {
    const route = await this.routeRepo.findOne({ where: { entityId } });
    if (!route) {
      this.logger.warn(`⚠️ Nenhuma rota encontrada para entityId=${entityId}`);
    }
    return route;
  }

  async removeRoute(id: string): Promise<void> {
    const route = await this.routeRepo.findOne({ where: { id } });
    if (!route) {
      this.logger.warn(`⚠️ Tentativa de remover rota inexistente ID=${id}`);
      return;
    }

    await this.routeRepo.remove(route);
    this.logger.debug(`🗑️ Rota removida: ID=${id}`);
  }

  async removeRouteByEntity(entityType: string, entityId: string): Promise<void> {
    const route = await this.routeRepo.findOne({ where: { entityType, entityId } });
    if (!route) {
      this.logger.warn(`⚠️ Nenhuma rota encontrada para ${entityType} com ID=${entityId}`);
      return;
    }

    await this.routeRepo.remove(route);
    this.logger.log(`✅ Rota removida: ID=${route.id}`);
  }

  async createRouteWithManager(
    manager: EntityManager,
    data: {
      title: string;
      public?: boolean;
      subtitle: string;
      idToFetch: string;
      path: string;
      entityType: string;
      description: string;
      entityId: string;
      type: RouteType;
      image?: string;
      current?: boolean
    },
  ): Promise<RouteEntity> {
    const route = manager.create(RouteEntity, {
      ...data,
      public: data.public ?? true,
      image: data.image || '',
    });

    return await manager.save(route);
  }

  async upsertRoute(routeId: string, updateData: Partial<RouteEntity>): Promise<RouteEntity> {
    // Buscar a rota existente para verificar o path atual
    const existingRoute = await this.routeRepo.findById(routeId);
    
    // Extrair o prefixo do path existente ou do updateData.path
    let prefix = '';
    if (updateData.path && updateData.path.endsWith('_')) {
      // Se updateData.path é um prefixo (termina com _), usar ele
      prefix = updateData.path;
    } else if (existingRoute?.path) {
      // Extrair prefixo do path existente (tudo antes do último _ seguido do título)
      const parts = existingRoute.path.split('_');
      if (parts.length > 1) {
        // Pegar todas as partes exceto a última (que é o título)
        prefix = parts.slice(0, -1).join('_') + '_';
      }
    } else if (updateData.path) {
      prefix = updateData.path;
    }
    
    // Se temos um título, sempre gerar/atualizar o path
    if (updateData.title) {
      // Verificar se o título mudou, se não temos rota existente, ou se temos um prefixo
      const titleChanged = !existingRoute || existingRoute.title !== updateData.title;
      const hasPrefix = updateData.path && updateData.path.endsWith('_');
      
      // Se título mudou, não temos rota existente, ou temos um prefixo, gerar novo path
      if (titleChanged || !existingRoute || hasPrefix) {
        // Título mudou, rota não existe, ou temos um prefixo - gerar novo path
        const generatedPath = this.generateRoute(updateData.title, prefix);
        
        // Verificar se o path gerado já existe em outra rota
        const existingPathRoute = await this.routeRepo.findByPath(generatedPath);
        if (existingPathRoute && existingPathRoute.id !== routeId) {
          // Path já existe em outra rota, gerar um path disponível automaticamente
          // Isso criará paths como: materiais_visita_nome_material_repetido_2
          const availablePath = await this.generateAvailablePath(updateData.title, prefix);
          updateData.path = availablePath;
          this.logger.debug(`🔄 Path duplicado detectado, usando path disponível: "${availablePath}"`);
        } else {
          updateData.path = generatedPath;
        }
      } else {
        // Título não mudou e não temos prefixo, manter o path existente
        updateData.path = existingRoute.path;
      }
    } else if (updateData.path && !updateData.path.endsWith('_')) {
      // Se o path foi fornecido diretamente (não é prefixo), verificar se não está duplicado
      const existingPathRoute = await this.routeRepo.findByPath(updateData.path);
      if (existingPathRoute && existingPathRoute.id !== routeId) {
        // Path duplicado, mas sem título para gerar novo - usar generateAvailablePath com o path atual como base
        const pathParts = updateData.path.split('_');
        const baseTitle = pathParts[pathParts.length - 1] || 'route';
        const pathPrefix = pathParts.slice(0, -1).join('_') + '_';
        const availablePath = await this.generateAvailablePath(baseTitle, pathPrefix);
        updateData.path = availablePath;
        this.logger.debug(`🔄 Path duplicado detectado, usando path disponível: "${availablePath}"`);
      }
    } else if (existingRoute) {
      // Manter o path existente se não foi alterado
      updateData.path = existingRoute.path;
    } else if (updateData.path && updateData.path.endsWith('_')) {
      // Temos apenas um prefixo sem título - não podemos gerar path, manter o prefixo
      // Mas isso não deve acontecer normalmente, então logamos um aviso
      this.logger.warn(`⚠️ Tentativa de upsert com apenas prefixo "${updateData.path}" sem título`);
      // Não definir path, deixar o repositório lidar com isso
    }

    // Garantir que sempre temos um path válido antes de fazer upsert
    // NUNCA usar um prefixo como path completo
    if (!updateData.path || updateData.path.endsWith('_')) {
      if (updateData.title && prefix) {
        // Gerar path do zero usando título e prefixo
        const generatedPath = this.generateRoute(updateData.title, prefix);
        const existingPathRoute = await this.routeRepo.findByPath(generatedPath);
        if (existingPathRoute && existingPathRoute.id !== routeId) {
          // Path duplicado, gerar um disponível
          updateData.path = await this.generateAvailablePath(updateData.title, prefix);
          this.logger.debug(`🔄 Path gerado automaticamente: "${updateData.path}"`);
        } else {
          updateData.path = generatedPath;
        }
      } else if (existingRoute) {
        updateData.path = existingRoute.path;
      } else {
        throw new BadRequestException('Não foi possível gerar um path válido para a rota. Título é obrigatório.');
      }
    }

    this.logger.debug(`🛠️ Upsert da rota ID=${routeId}, path="${updateData.path}"`);
    return this.routeRepo.upsertRoute(routeId, updateData);
  }
}
