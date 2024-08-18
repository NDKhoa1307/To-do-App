import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import createMongooseImport from './utils/db/create-mongoose-import';

const env = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : `.env`;

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: env,
            isGlobal: true,
        }),
        createMongooseImport(new ConfigService()),
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
