import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { LocationsModule } from './locations/locations.module';
import { CommoditiesModule } from './commodities/commodities.module';
import { UsersModule } from './users/users.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('DATABASE_URL');

        if (!uri) {
          throw new Error(
            'DATABASE_URL is required. Set it in DigitalOcean App Platform environment variables or in a local .env file.',
          );
        }

        return {
          uri,
          autoIndex: configService.get('NODE_ENV') !== 'production',
        };
      },
    }),
    HealthModule,
    LocationsModule,
    CommoditiesModule,
    UsersModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
