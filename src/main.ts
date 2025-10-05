import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Configurar ValidationPipe global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // Retorna erro se propriedades não permitidas forem enviadas
    transform: true, // Transforma automaticamente os tipos
    transformOptions: {
      enableImplicitConversion: true, // Converte automaticamente tipos simples
    },
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
