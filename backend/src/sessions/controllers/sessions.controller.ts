import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionsService } from '../sessions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @ApiOperation({ summary: 'List Active Sessions' })
  @Get()
  async listActiveSessions(@Req() req: RequestWithAuth) {
    const sessions = await this.sessionsService.findSessionsByMemberId(req.user.sub);
    return {
      success: true,
      statusCode: 200,
      message: 'Sessions fetched successfully',
      data: sessions.map((session) => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        current: session.id === req.user.sessionId,
      })),
    };
  }

  @ApiOperation({ summary: 'Revoke All Sessions' })
  @Delete('all')
  async revokeAllSessions(@Req() req: RequestWithAuth) {
    await this.sessionsService.revokeAllSessions(req.user.sub, req.user.sessionId);
    return {
      success: true,
      statusCode: 200,
      message: 'All other sessions revoked successfully',
    };
  }

  @ApiOperation({ summary: 'Revoke Specific Session' })
  @Delete(':id')
  async revokeSession(@Req() req: RequestWithAuth, @Param('id') id: string) {
    if (id === req.user.sessionId) {
      return {
        success: false,
        statusCode: 400,
        message: 'You cannot revoke your current active session',
      };
    }

    const result = await this.sessionsService.revokeSession(id, req.user.sub);
    
    if (result.count === 0) {
      return {
        success: false,
        statusCode: 404,
        message: 'Session not found',
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Session revoked successfully',
    };
  }
}
