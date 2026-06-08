import { Controller, Get, Param, Inject, NotFoundException } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator, HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import Redis from 'ioredis';

export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisClient: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redisClient.ping();
      const isHealthy = result === 'PONG';
      if (isHealthy) {
        return this.getStatus(key, true);
      }
      throw new HealthCheckError('Redis failed', this.getStatus(key, false));
    } catch (e) {
      throw new HealthCheckError('Redis failed', this.getStatus(key, false, { message: e.message }));
    }
  }
}

@Controller()
export class HealthController {
  private redisHealthIndicator: RedisHealthIndicator;

  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    this.redisHealthIndicator = new RedisHealthIndicator(this.redisClient);
  }

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('postgres', this.prisma),
      () => this.redisHealthIndicator.isHealthy('redis'),
    ]);
  }

  @Get(':applicationSlug/health')
  async appHealth(@Param('applicationSlug') applicationSlug: string) {
    const application = await this.prisma.application.findFirst({
      where: { slug: applicationSlug },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    try {
      const healthResult = await this.check();
      return {
        status: healthResult.status === 'ok' ? 'up' : 'down',
        application: application.id,
        postgres: healthResult.info?.postgres?.status || 'down',
        redis: healthResult.info?.redis?.status || 'down',
      };
    } catch (error: any) {
      return {
        status: 'down',
        application: application.id,
        postgres: error.response?.info?.postgres?.status || 'down',
        redis: error.response?.info?.redis?.status || 'down',
      };
    }
  }
}
