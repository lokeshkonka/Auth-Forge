import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('health')
  health() {
    return { status: `ok` };
  }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.authService.getProfile(req.user.sub,
    );
  }
}







