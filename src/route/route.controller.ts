import {
  Controller,
  Get,
  Delete,
  Param,
  Logger,
  UseGuards,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { RouteService } from './route.service';
import { RouteEntity } from './route-page.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/auth/guards/role-guard';
import { CleanupOrphanRoutesService } from './services/cleanup-orphan-routes.service';

@Controller('routes')
export class RouteController {
  private readonly logger = new Logger(RouteController.name);

  constructor(
    private readonly routeService: RouteService,
    private readonly cleanupService: CleanupOrphanRoutesService,
  ) {}

  @Get()
  async findAll(): Promise<RouteEntity[]> {
    const routes = await this.routeService.findAllRoutes();
    this.logger.debug(`📦 Rotas retornadas: ${routes.length}`);
    return routes;
  }

  @Get('orphans/check')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async checkOrphanRoutes() {
    this.logger.log('🔍 Verificando rotas órfãs...');
    return this.cleanupService.findOrphanRoutes();
  }

  @Post('orphans/cleanup')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async cleanupOrphanRoutes() {
    this.logger.log('🗑️ Iniciando limpeza de rotas órfãs...');
    return this.cleanupService.cleanupOrphanRoutes();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RouteEntity> {
    const route = await this.routeService.findById(id);
    if (!route) {
      this.logger.warn(`⚠️ Rota ID=${id} não encontrada`);
      throw new NotFoundException('Rota não encontrada');
    }
    return route;
  }
}
