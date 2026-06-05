import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { InvitationsModule } from './invitations/invitations.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    InvitationsModule,
    SessionsModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
