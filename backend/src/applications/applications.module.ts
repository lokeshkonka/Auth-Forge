import { Module } from '@nestjs/common';
import { ApplicationsService } from './services/applications.service';
import { AppRolesService } from './services/app-roles.service';
import { AppPermissionsService } from './services/app-permissions.service';
import { ApplicationsController } from './controllers/applications.controller';
import { AppRolesController } from './controllers/app-roles.controller';
import { AppPermissionsController } from './controllers/app-permissions.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ApplicationsController, AppRolesController, AppPermissionsController],
  providers: [ApplicationsService, AppRolesService, AppPermissionsService],
  exports: [ApplicationsService, AppRolesService, AppPermissionsService],
})
export class ApplicationsModule {}
