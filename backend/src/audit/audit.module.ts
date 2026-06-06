import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuditController } from './controllers/audit.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
