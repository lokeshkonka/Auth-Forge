import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { InvitationsModule } from './invitations/invitations.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaModule } from './database/prisma.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuditModule } from './audit/audit.module';
import { ApplicationsModule } from './applications/applications.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { EndUsersModule } from './end-users/end-users.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { createKeyv } from '@keyv/redis';

import { RedisModule } from './database/redis.module';

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    InvitationsModule,
    SessionsModule,
    RolesModule,
    PermissionsModule,
    AuditModule,
    ApplicationsModule,
    ApiKeysModule,
    EndUsersModule,
    CommonModule,
    HealthModule,
    PrismaModule,
    RedisModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const connection =
          redisUrl ?? `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`;
        return {
          storage: new ThrottlerStorageRedisService(connection),
          throttlers: [
            { name: 'global', ttl: 60000, limit: 10000 },
            { name: 'signup', ttl: 60000, limit: 10000 },
            { name: 'login', ttl: 60000, limit: 10000 },
            { name: 'refresh', ttl: 60000, limit: 10000 },
            { name: 'secret', ttl: 60000, limit: 10000 },
          ],
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const connection =
          redisUrl ??
          `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`;
        return {
          stores: [createKeyv(connection)],
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
