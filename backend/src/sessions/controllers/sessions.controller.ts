import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  listActiveSessions(@Req() req: RequestWithAuth) {
    return this.sessionsService.findSessionsByMemberId(req.user.sub);
  }

  @Delete('all')
  revokeAllSessions(@Req() req: RequestWithAuth) {
    return this.sessionsService.revokeAllSessions(req.user.sub, req.user.sessionId);
  }

  @Delete(':id')
  revokeSession(@Req() req: RequestWithAuth, @Param('id') id: string) {
    return this.sessionsService.revokeSession(id, req.user.sub);
  }
}
