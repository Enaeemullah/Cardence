import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { CardLifecycleModule } from './card-lifecycle/card-lifecycle.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Look for .env in the api directory first, then walk up to monorepo root
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER', 'cardence'),
        password: config.get<string>('DB_PASSWORD', 'cardence_dev'),
        database: config.get<string>('DB_NAME', 'cardence'),
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        synchronize: false,
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    CardLifecycleModule,
  ],
})
export class AppModule {}
