import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AwsS3Service } from 'src/aws/aws-s3.service';
import { RouteService } from 'src/route/route.service';
import { MediaItemProcessor } from 'src/share/media/media-item-processor';
import { ImagePageRepository } from '../repository/image-page.repository';

@Injectable()
export class ImagePageDeleteService {
    private readonly logger = new Logger(ImagePageDeleteService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly imagePageRepository: ImagePageRepository,
        private readonly routeService: RouteService,
        private readonly awsS3Service: AwsS3Service,
        private readonly mediaItemProcessor: MediaItemProcessor,
        private readonly configService: ConfigService,
    ) {
    }

    async removePage(id: string): Promise<void> {
        this.logger.log(`🚀 Iniciando remoção da página de imagens com ID: ${id}`);
        
        // Verificar se é a página protegida do feed do orfanato
        const protectedPageId = this.configService.get<string>('FEED_ORFANATO_PAGE_ID');
        if (protectedPageId && id === protectedPageId) {
            this.logger.warn(`⚠️ Tentativa de excluir página protegida: ID=${id}`);
            throw new ForbiddenException('Esta página não pode ser excluída pois é a página do feed do orfanato.');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        this.logger.debug('🔗 Conectando ao QueryRunner');
        await queryRunner.connect();
        this.logger.debug('✅ QueryRunner conectado');
        this.logger.debug('🔄 Iniciando transação');
        await queryRunner.startTransaction();
        this.logger.debug('✅ Transação iniciada');

        try {
            this.logger.debug(`🔍 Buscando página com ID: ${id}`);
            const page = await this.imagePageRepository.findByIdWithSections(id);
            if (!page) {
                this.logger.warn(`⚠️ Página com ID ${id} não encontrada`);
                throw new NotFoundException(`Página com id ${id} não encontrada`);
            }
            this.logger.debug(`✅ Página encontrada: ID=${page.id}, name="${page.name}"`);

            const sectionIds = page.sections?.map((s) => s.id) || [];
            this.logger.debug(`📂 Encontradas ${sectionIds.length} seções para verificação de mídias`);
            if (sectionIds.length > 0) {
                this.logger.debug(`🔍 Buscando mídias associadas às seções`);
                const media = await this.mediaItemProcessor.findManyMediaItemsByTargets(sectionIds, 'ImagesPage');
                this.logger.debug(`🗑️ Iniciando exclusão de ${media.length} mídias`);
                await this.mediaItemProcessor.deleteMediaItems(media, this.awsS3Service.delete.bind(this.awsS3Service));
                this.logger.debug(`✅ ${media.length} mídias excluídas`);
            } else {
                this.logger.debug('ℹ️ Nenhuma seção encontrada, pulando exclusão de mídias');
            }

            if (page.route?.id) {
                this.logger.debug(`🗑️ Removendo rota ID: ${page.route.id}`);
                await this.routeService.removeRoute(page.route.id);
                this.logger.debug(`✅ Rota removida`);
            } else {
                this.logger.debug('ℹ️ Nenhuma rota associada encontrada');
            }

            this.logger.debug(`🗑️ Removendo página ID: ${page.id}`);
            await queryRunner.manager.remove(page);
            this.logger.debug(`✅ Página removida`);

            this.logger.debug('✅ Iniciando commit da transação');
            await queryRunner.commitTransaction();
            this.logger.log(`✅ Página de imagens removida com sucesso: ID=${id}`);
        } catch (error) {
            this.logger.error('❌ Erro ao remover galeria. Iniciando rollback.', error);
            this.logger.debug('🔙 Executando rollback da transação');
            await queryRunner.rollbackTransaction();
            this.logger.debug('✅ Rollback concluído');
            throw new BadRequestException('Erro ao remover a galeria.');
        } finally {
            this.logger.debug('🔚 Liberando QueryRunner');
            await queryRunner.release();
            this.logger.debug('✅ QueryRunner liberado');
        }
    }
}
