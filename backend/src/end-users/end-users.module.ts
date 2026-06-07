import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';

import { EndUsersService } from './services/end-users.service';
import { EndUsersController } from './controllers/end-users.controller';
import { EndUserJwtStrategy } from './strategies/end-user-jwt.strategy';
import { SessionsModule } from '../sessions/sessions.module';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    AuditModule,
    PassportModule.register({ defaultStrategy: 'end-user-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [EndUsersController],
  providers: [EndUsersService, EndUserJwtStrategy],
  exports: [EndUsersService],
})
export class EndUsersModule {}
