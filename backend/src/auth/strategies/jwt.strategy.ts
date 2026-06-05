import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../database/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  organizationId: string;
  sessionId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.prisma.memberSession.findFirst({
      where: {
        id: payload.sessionId,
        memberId: payload.sub,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        memberId: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return payload;
  }
}
