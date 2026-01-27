import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SettlementModule } from './settlement/settlement.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LoggerModule } from './logger/logger.module';
import { SwaggerModule as SwaggerDocModule } from './common/swagger/swagger.module';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { GlobalConfigModule } from './config/config.module';
import { BullModule } from '@nestjs/bull';
import { NotificationModule } from './notification/notification.module';
import { GlobalConfigService } from './config/global-config.service';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PublicModule } from './public/public.module';


@Module({
  imports: [
    AuthModule,
    ConfigModule,
    DatabaseModule,
    CacheModule,
    LoggerModule,
    SettlementModule,
    HealthModule,
    WebhookModule,
    SwaggerDocModule,
    GlobalConfigModule,
    DatabaseModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    BullModule.forRootAsync({
      imports: [GlobalConfigModule],
      useFactory: async (configService: GlobalConfigService) => ({
        redis: {
          host: configService.getRedisConfig().host,
          port: configService.getRedisConfig().port,
        },
      }),
      inject: [GlobalConfigService],
    }),
    NotificationModule,
    SettlementModule,
    TransactionsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
