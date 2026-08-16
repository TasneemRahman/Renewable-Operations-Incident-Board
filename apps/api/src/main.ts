import { NestFactory } from '@nestjs/core';
import { loadEnvFile } from 'node:process';
import { AppModule } from './app.module';

loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  const port = 8080;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}/api`);
}
bootstrap();
