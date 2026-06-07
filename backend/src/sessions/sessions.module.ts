import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { EndUserSessionsService } from './services/end-user-sessions.service';
import { SessionsController } from './controllers/sessions.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SessionsController],
  providers: [SessionsService, EndUserSessionsService],
  exports: [SessionsService, EndUserSessionsService],
})
export class SessionsModule {}
