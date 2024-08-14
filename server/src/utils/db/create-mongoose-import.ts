import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

const createMongooseImport = async (
    configService: ConfigService,
): Promise<DynamicModule> => {
    const uri = configService.get<string>('MONGODB_URI');
    return uri
        ? MongooseModule.forRootAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: () => ({
                  uri: uri,
              }),
          })
        : {
              module: class {},
              imports: [],
          };
};

export default createMongooseImport;
