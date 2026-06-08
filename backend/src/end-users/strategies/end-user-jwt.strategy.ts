import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';

@Injectable()
export class EndUserJwtStrategy extends PassportStrategy(
  Strategy,
  'end-user-jwt',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.tokenBlacklistService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.endUser.findUnique({
      where: { id: payload.sub },
      include: {
        application: true,
      },
    });

    if (!user || user.applicationId !== payload.appId) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      appId: user.applicationId,
      sessionId: payload.sessionId,
    };
  }
}
