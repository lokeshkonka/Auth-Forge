import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../database/prisma.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';

type JwtPayload = {
  sub: string;
  sessionId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
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

  async validate(req: any, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && await this.tokenBlacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const session = await this.prisma.memberSession.findFirst({
      where: {
        id: payload.sessionId,
        memberId: payload.sub,
        expiresAt: {
          gt: new Date(),
        },
        revokedAt: null, // Ensure session is not revoked
      },
      select: {
        id: true,
        memberId: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
      include: {
        ownedOrganizations: true,
        memberships: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!member) {
      throw new UnauthorizedException('Member not found');
    }

    return {
      sub: payload.sub,
      sessionId: payload.sessionId,
      member,
    };
  }
}
