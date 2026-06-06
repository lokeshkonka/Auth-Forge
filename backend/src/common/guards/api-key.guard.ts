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
      throw new UnauthorizedException('API Key is missing');
    }

    // Try to get from cache
    const cacheKey = `apikey:\${apiKey}`;
    const cachedData = await this.cacheManager.get<{ application: any; applicationId: string }>(cacheKey);

    if (cachedData) {
      request.application = cachedData.application;
      request.applicationId = cachedData.applicationId;
      return true;
    }

    const apiKeys = await this.prisma.apiKey.findMany({
      include: {
        application: true,
      },
    });

    let matchedKey: any = null;
    for (const key of apiKeys) {
      const isMatch = await bcrypt.compare(apiKey, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, {
      application: matchedKey.application,
      applicationId: matchedKey.applicationId,
    }, 300000);

    // Update lastUsedAt asynchronously
    this.prisma.apiKey.update({
      where: { id: matchedKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(err => console.error('Failed to update lastUsedAt:', err));

    // Attach application to request
    request.application = matchedKey.application;
    request.applicationId = matchedKey.applicationId;

    return true;
  }
}
