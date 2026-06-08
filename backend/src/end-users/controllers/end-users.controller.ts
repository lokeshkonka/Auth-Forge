import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { EndUsersService } from '../services/end-users.service';
import { EndUserSignupDto } from '../dto/signup.dto';
import { EndUserLoginDto } from '../dto/login.dto';
import { EndUserRefreshTokenDto } from '../dto/refresh-token.dto';
import { EndUserJwtAuthGuard } from '../guards/end-user-jwt-auth.guard';
import { ApiKeyAuthGuard } from '../../common/guards/api-key.guard';
import { SecretKeyGuard } from '../../common/guards/secret-key.guard';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiSecurity,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

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
  application: any;
  applicationId: string;
};

@ApiTags('End-User Auth & Management')
@Controller(':applicationSlug')
export class EndUsersController {
  constructor(private readonly endUsersService: EndUsersService) {}

  private validateSlug(req: RequestWithAuth, slug: string) {
    // If slug is provided and matches, that's fine. 
    // If it doesn't match, we still allow it as long as the API key is valid, 
    // as the API key uniquely identifies the application.
    // This makes the API more "exposed" and easier to use.
    if (slug && req.application.slug !== slug) {
      console.warn(`Slug mismatch: URL has ${slug}, but API key belongs to ${req.application.slug}. Proceeding with API key context.`);
    }
  }

  // --- Server-Side Management APIs (Secret Key) ---

  @ApiOperation({ summary: 'List Application Users' })
  @ApiSecurity('SecretKey')
  @UseGuards(ApiKeyAuthGuard, SecretKeyGuard)
  @Throttle({ secret: { limit: 10000, ttl: 60000 } })
  @Get('users')
  findAllUsers(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.findAllUsers(req.applicationId);
  }

  @ApiOperation({ summary: 'Create User (Admin)' })
  @ApiSecurity('SecretKey')
  @UseGuards(ApiKeyAuthGuard, SecretKeyGuard)
  @Throttle({ secret: { limit: 10000, ttl: 60000 } })
  @Post('users')
  createUser(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
    @Body() dto: EndUserSignupDto,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.createUser(req.applicationId, dto);
  }

  @ApiOperation({ summary: 'Update User' })
  @ApiSecurity('SecretKey')
  @UseGuards(ApiKeyAuthGuard, SecretKeyGuard)
  @Throttle({ secret: { limit: 10000, ttl: 60000 } })
  @Patch('users/:id')
  updateUser(
    @Param('applicationSlug') applicationSlug: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
    @Body() dto: { email?: string; password?: string },
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.updateUser(req.applicationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete User' })
  @ApiSecurity('SecretKey')
  @UseGuards(ApiKeyAuthGuard, SecretKeyGuard)
  @Throttle({ secret: { limit: 10000, ttl: 60000 } })
  @Delete('users/:id')
  deleteUser(
    @Param('applicationSlug') applicationSlug: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.deleteUser(req.applicationId, id);
  }

  @ApiOperation({ summary: 'Bulk Import Users' })
  @ApiSecurity('SecretKey')
  @UseGuards(ApiKeyAuthGuard, SecretKeyGuard)
  @Throttle({ secret: { limit: 10000, ttl: 60000 } })
  @Post('users/bulk')
  bulkImportUsers(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
    @Body() body: { users: EndUserSignupDto[] },
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.bulkImportUsers(req.applicationId, body.users);
  }

  // --- Public Auth APIs (Publishable Key) ---

  @ApiOperation({ summary: 'End-User Signup' })
  @ApiSecurity('PublishableKey')
  @UseGuards(ApiKeyAuthGuard)
  @Throttle({ signup: { limit: 10000, ttl: 60000 } })
  @Post('auth/signup')
  signup(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
    @Body() dto: EndUserSignupDto,
  ) {
    return this.endUsersService.signup(req.applicationId, dto);
  }


  @ApiOperation({ summary: 'End-User Login' })
  @ApiSecurity('PublishableKey')
  @UseGuards(ApiKeyAuthGuard)
  @Throttle({ login: { limit: 10000, ttl: 60000 } })
  @Post('auth/login')
  login(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: any,
    @Body() dto: EndUserLoginDto,
  ) {
    this.validateSlug(req, applicationSlug);

    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];

    return this.endUsersService.login(req.applicationId, dto, {
      userAgent,
      ipAddress: req.ip,
    });
  }

  @ApiOperation({ summary: 'Refresh End-User Token' })
  @ApiSecurity('PublishableKey')
  @UseGuards(ApiKeyAuthGuard)
  @Throttle({ refresh: { limit: 10000, ttl: 60000 } })
  @Post('auth/refresh')
  refresh(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
    @Body() dto: EndUserRefreshTokenDto,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.refresh(req.applicationId, dto);
  }

  @ApiOperation({ summary: 'End-User Logout' })
  @ApiSecurity('PublishableKey')
  @ApiBearerAuth('EndUser-JWT')
  @UseGuards(ApiKeyAuthGuard, EndUserJwtAuthGuard)
  @Post('auth/logout')
  logout(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.endUsersService.logout(
      req.user.sessionId,
      req.user.userId,
      token,
    );
  }

  @ApiOperation({ summary: 'Get End-User Profile' })
  @ApiSecurity('PublishableKey')
  @ApiBearerAuth('EndUser-JWT')
  @UseGuards(ApiKeyAuthGuard, EndUserJwtAuthGuard)
  @Get('auth/profile')
  getProfile(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: 'List End-User Sessions' })
  @ApiSecurity('PublishableKey')
  @ApiBearerAuth('EndUser-JWT')
  @UseGuards(ApiKeyAuthGuard, EndUserJwtAuthGuard)
  @Get('auth/sessions')
  getSessions(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.getSessions(
      req.user.userId,
      req.user.sessionId,
    );
  }

  @ApiOperation({ summary: 'Revoke All End-User Sessions' })
  @ApiSecurity('PublishableKey')
  @ApiBearerAuth('EndUser-JWT')
  @UseGuards(ApiKeyAuthGuard, EndUserJwtAuthGuard)
  @Delete('auth/sessions/all')
  revokeAllSessions(
    @Param('applicationSlug') applicationSlug: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.revokeAllSessions(
      req.user.userId,
      req.user.sessionId,
    );
  }

  @ApiOperation({ summary: 'Revoke Specific End-User Session' })
  @ApiSecurity('PublishableKey')
  @ApiBearerAuth('EndUser-JWT')
  @UseGuards(ApiKeyAuthGuard, EndUserJwtAuthGuard)
  @Delete('auth/sessions/:id')
  revokeSession(
    @Param('applicationSlug') applicationSlug: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    this.validateSlug(req, applicationSlug);
    return this.endUsersService.revokeSession(req.user.userId, id);
  }
}
