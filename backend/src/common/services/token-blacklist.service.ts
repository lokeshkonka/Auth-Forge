import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.cacheManager.set(`blacklist:\${token}`, true, expiresInSeconds * 1000);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.cacheManager.get(`blacklist:\${token}`);
    return !!isBlacklisted;
  }
}
