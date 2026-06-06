import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EndUsersService } from '../services/end-users.service';
import { EndUserSignupDto } from '../dto/signup.dto';
import { EndUserLoginDto } from '../dto/login.dto';
import { EndUserRefreshTokenDto } from '../dto/refresh-token.dto';
import { EndUserJwtAuthGuard } from '../guards/end-user-jwt-auth.guard';

type RequestWithAuth = {
  headers: {
    authorization?: string;
  };
  user: {
    userId: string;
    email: string;
    appId: string;
    sessionId: string;
  };
};

@Controller('applications/:appId/auth')
export class EndUsersController {
  constructor(private readonly endUsersService: EndUsersService) {}

  @Post('signup')
  signup(@Param('appId') appId: string, @Body() dto: EndUserSignupDto) {
    return this.endUsersService.signup(appId, dto);
  }

  @Post('login')
  login(@Param('appId') appId: string, @Body() dto: EndUserLoginDto) {
    return this.endUsersService.login(appId, dto);
  }

  @Post('refresh')
  refresh(@Param('appId') appId: string, @Body() dto: EndUserRefreshTokenDto) {
    return this.endUsersService.refresh(appId, dto);
  }

  @UseGuards(EndUserJwtAuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithAuth) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.endUsersService.logout(req.user.sessionId, req.user.userId, token);
  }

  @UseGuards(EndUserJwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithAuth) {
    return this.endUsersService.getProfile(req.user.userId);
  }

  @UseGuards(EndUserJwtAuthGuard)
  @Get('sessions')
  getSessions(@Req() req: RequestWithAuth) {
    return this.endUsersService.getSessions(req.user.userId);
  }
}
