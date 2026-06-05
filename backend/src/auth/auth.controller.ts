import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';

type RequestWithAuth = {
  ip?: string;
  headers: {
    'user-agent'?: string | string[];
  };
  user: {
    sub: string;
    sessionId: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

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

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithAuth) {
    return this.authService.getProfile(req.user.sub, req.user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithAuth) {
    return this.authService.logout(req.user.sessionId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(@Req() req: RequestWithAuth) {
    return this.authService.getSessions(req.user.sub, req.user.sessionId);
  }
}
