import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { CardLifecycleModule } from './card-lifecycle/card-lifecycle.module';
import { AuditModule } from './audit/audit.module';
import { PinModule } from './pin/pin.module';
import { CustomersModule } from './customers/customers.module';
import { AccountsModule } from './accounts/accounts.module';
import { CardProductsModule } from './card-products/card-products.module';
import { CardsModule } from './cards/cards.module';
import { MakerCheckerModule } from './maker-checker/maker-checker.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    AuditModule,
    PinModule,
    CustomersModule,
    AccountsModule,
    CardProductsModule,
    CardsModule,
    MakerCheckerModule,
    AuthorizationModule,
  ],
})
export class AppModule {}
