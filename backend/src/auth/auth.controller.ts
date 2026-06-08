import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './services/auth.service';

type RequestWithAuth = {
  ip?: string;
  headers: {
    'user-agent'?: string | string[];
    authorization?: string;
  };
  user: {
    sub: string;
    sessionId: string;
  };
};

type GoogleUser = {
  provider: string;
  providerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
};

type GoogleRequest = {
  ip?: string;
  headers: {
    'user-agent'?: string | string[];
  };
  user: GoogleUser;
};

@ApiTags('Management Dashboard')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'System Health Check' })
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'User Signup' })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: 'User Login' })
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: RequestWithAuth) {
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];

    return this.authService.login(dto, {
      userAgent,
      ipAddress: req.ip,
    });
  }

  @ApiOperation({ summary: 'Refresh Token' })
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @ApiOperation({ summary: 'Google Auth' })
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {}

  @ApiOperation({ summary: 'Google Auth Callback' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleAuthRedirect(@Req() req: GoogleRequest, @Res() res: Response) {
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];

    const result = await this.authService.googleLogin(req.user, {
      userAgent,
      ipAddress: req.ip,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';

    const { accessToken, refreshToken, isNew } = result.data;

    return res.redirect(
      `${frontendUrl}/auth?token=${accessToken}&refreshToken=${refreshToken}&new=${isNew}`,
    );
  }

  @ApiOperation({ summary: 'Get Profile' })
  @ApiBearerAuth('Member-JWT')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithAuth) {
    return this.authService.getProfile(req.user.sub, req.user.sessionId);
  }

  @ApiOperation({ summary: 'List Active Sessions' })
  @ApiBearerAuth('Member-JWT')
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(@Req() req: RequestWithAuth) {
    return this.authService.getSessions(req.user.sub, req.user.sessionId);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth('Member-JWT')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithAuth) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.authService.logout(req.user.sessionId, token);
  }

  @ApiOperation({ summary: 'Revoke All Sessions' })
  @ApiBearerAuth('Member-JWT')
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/all')
  revokeAllSessions(@Req() req: RequestWithAuth) {
    return this.authService.revokeAllSessions(req.user.sub, req.user.sessionId);
  }

  @ApiOperation({ summary: 'Revoke Specific Session' })
  @ApiBearerAuth('Member-JWT')
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  deleteSession(@Param('id') sessionId: string, @Req() req: RequestWithAuth) {
    return this.authService.deleteSession(
      req.user.sub,
      req.user.sessionId,
      sessionId,
    );
  }
}
