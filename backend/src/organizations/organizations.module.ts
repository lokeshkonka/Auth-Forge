import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [MembersModule, AuditModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
