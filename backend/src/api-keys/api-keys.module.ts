import { Module } from '@nestjs/common';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysController } from './controllers/api-keys.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
