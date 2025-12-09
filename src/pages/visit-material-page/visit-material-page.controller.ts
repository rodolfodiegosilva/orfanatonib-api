import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { VisitMaterialsPageResponseDTO } from './dto/visit-material-response.dto';
import { VisitMaterialsPageCreateService } from './services/VisitMaterialsPageCreateService';
import { VisitMaterialsPageUpdateService } from './services/VisitMaterialsPageUpdateService';
import { VisitMaterialsPageGetService } from './services/VisitMaterialsPageGetService';
import { VisitMaterialsPageRemoveService } from './services/VisitMaterialsPageRemoveService';
import { QueryVisitMaterialsPageDto } from './dto/query-visit-material-pages.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/auth/guards/role-guard';

@Controller('visit-material-pages')
@UseGuards(JwtAuthGuard)
export class VisitMaterialsPageController {
  private readonly logger = new Logger(VisitMaterialsPageController.name);

  constructor(
    private readonly createService: VisitMaterialsPageCreateService,
    private readonly updateService: VisitMaterialsPageUpdateService,
    private readonly removeService: VisitMaterialsPageRemoveService,
    private readonly getService: VisitMaterialsPageGetService,
  ) { }

  @UseGuards(AdminRoleGuard)
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('visitMaterialsPageData') raw: string,
  ): Promise<VisitMaterialsPageResponseDTO> {
    this.logger.debug('📥 [POST /visit-material-pages] Criando nova página de materiais');
    return this.createService.createFromRaw(raw, files);
  }

  @UseGuards(AdminRoleGuard)
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('visitMaterialsPageData') raw: string,
  ): Promise<VisitMaterialsPageResponseDTO> {
    this.logger.debug(`✏️ [PATCH /visit-material-pages/${id}] Atualizando página de materiais`);
    return this.updateService.updateFromRaw(id, raw, files);
  }

  @UseGuards(AdminRoleGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.debug(`🗑️ [DELETE /visit-material-pages/${id}] Removendo página de materiais`);
    await this.removeService.removeVisitMaterial(id);
  }

  @Get()
  async findAll(
    @Query() query: QueryVisitMaterialsPageDto,
  ): Promise<VisitMaterialsPageResponseDTO[]> {
    this.logger.debug('📄 [GET /visit-material-pages] Listando todas as páginas de materiais');
    return this.getService.findAllPagesWithMedia(query);
  }

  @Get('/current-material')
  async getCurrentMaterial() {
    this.logger.debug('📆 [GET /visit-material-pages/current-material] Buscando página atual');
    return this.getService.getCurrentWeek();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VisitMaterialsPageResponseDTO> {
    this.logger.debug(`🔍 [GET /visit-material-pages/${id}] Buscando página de materiais`);
    return this.getService.findPageWithMedia(id);
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Post('/current-material/:id')
  async setCurrentMaterial(@Param('id') id: string): Promise<any> {
    this.logger.debug(`📌 [POST /visit-material-pages/current-material/${id}] Definindo página atual`);
    return this.getService.setCurrentWeek(id);
  }
}
