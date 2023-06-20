import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //모든 파일은 AppModule로 import됨
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
