import { Module } from '@nestjs/common';

import { MembersModule } from '../members/members.module';
import { AuditModule } from '../audit/audit.module';
import {
  InvitationsController,
  OrganizationInvitationsController,
} from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [MembersModule, AuditModule],
  controllers: [InvitationsController, OrganizationInvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
