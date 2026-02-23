import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiquidityProvider, ProviderStatus } from './entities/liquidity-provider.entity';

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);

  constructor(
    @InjectRepository(LiquidityProvider)
    private providerRepo: Repository<LiquidityProvider>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthChecks() {
    this.logger.log('Running scheduled provider health checks');
    const providers = await this.providerRepo.find({ where: { isEnabled: true } });

    for (const provider of providers) {
      const start = Date.now();
      try {
        await this.checkProvider(provider);
        const latency = Date.now() - start;
        provider.lastHealthCheckAt = new Date();
        provider.lastHealthCheckLatencyMs = latency;
        provider.status = ProviderStatus.ACTIVE;
      } catch (error) {
        this.logger.error(`Health check failed for ${provider.name}: ${error.message}`);
        provider.status = ProviderStatus.DOWN;
        provider.lastHealthCheckAt = new Date();
      }
      await this.providerRepo.save(provider);
    }
  }

  private async checkProvider(provider: LiquidityProvider): Promise<void> {
    this.logger.debug(`Checking ${provider.name}`);
  }
}
