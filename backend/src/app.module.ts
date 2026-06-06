import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';

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
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
