import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  //const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create(AppModule, { cors: true, logger: ['error', 'warn', 'log', 'debug'] });
  app.setGlobalPrefix(process.env.API_PREFIX, {
    exclude: ['/'],
  });
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  //cors configuration
  app.enableCors();
  //await app.listen(process.env.PORT ?? 4000);
  await app.listen(configService.get('app.port') || 4000, () => {
    console.log(`Server running at port: ${configService.get('app.port')}`);
  });
}
bootstrap();
