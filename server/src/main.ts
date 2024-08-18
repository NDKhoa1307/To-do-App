import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('/api');
    const port = 8080;

    // Configurate swagger UI
    const config = new DocumentBuilder().setTitle('APIs for To-do App').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger-ui', app, document);

    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(port);
}

bootstrap();
