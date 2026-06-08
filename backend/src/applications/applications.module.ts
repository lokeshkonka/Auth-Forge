import { Module } from '@nestjs/common';
import { ApplicationsService } from './services/applications.service';
import { AppRolesService } from './services/app-roles.service';
import { ApplicationsController } from './controllers/applications.controller';
import { AppRolesController } from './controllers/app-roles.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ApplicationsController, AppRolesController],
  providers: [ApplicationsService, AppRolesService],
  exports: [ApplicationsService, AppRolesService],
})
export class ApplicationsModule {}
