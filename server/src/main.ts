import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

const port: number = 8080;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(port);
}

bootstrap();
