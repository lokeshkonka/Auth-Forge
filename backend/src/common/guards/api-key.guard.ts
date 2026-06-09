import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Invalid API Key');
    }

    const apiKeys = await this.prisma.apiKey.findMany({
      select: {
        id: true,
        publishableKeyHash: true,
        secretKeyHash: true,
        applicationId: true,
        application: true,
      },
    });

    let matchedKey: any = null;
    for (const key of apiKeys) {
      let isMatch = false;
      if (apiKey.startsWith('pk_live_')) {
        isMatch = await bcrypt.compare(apiKey, key.publishableKeyHash);
      } else if (apiKey.startsWith('sk_live_')) {
        isMatch = await bcrypt.compare(apiKey, key.secretKeyHash);
      }

      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Attach application to request
    request.application = matchedKey.application;
    request.applicationId = matchedKey.applicationId;

    // Update lastUsedAt asynchronously
    this.prisma.apiKey
      .update({
        where: { id: matchedKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error('Failed to update lastUsedAt:', err));

    return true;
  }
}
