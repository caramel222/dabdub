import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ExchangeRateSnapshot } from './entities/exchange-rate-snapshot.entity';
import { LiquidityProvider, ProviderStatus } from './entities/liquidity-provider.entity';
import { ExchangeRateService } from './exchange-rate.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, ActorType } from '../database/entities/audit-log.enums';

@Injectable()
export class RateManagementService {
  private readonly logger = new Logger(RateManagementService.name);
  private readonly STALENESS_THRESHOLD_SECONDS = 300;

  constructor(
    @InjectRepository(ExchangeRateSnapshot)
    private snapshotRepo: Repository<ExchangeRateSnapshot>,
    @InjectRepository(LiquidityProvider)
    private providerRepo: Repository<LiquidityProvider>,
    private exchangeRateService: ExchangeRateService,
    private auditLogService: AuditLogService,
    @InjectQueue('rate-overrides') private rateOverrideQueue: Queue,
  ) {}

  async getCurrentRates() {
    const pairs = ['USDC/USD', 'ETH/USD', 'MATIC/USD'];
    const rates = [];

    for (const pair of pairs) {
      const [token, fiat] = pair.split('/');
      const latest = await this.snapshotRepo.findOne({
        where: { tokenSymbol: token, fiatCurrency: fiat },
        order: { createdAt: 'DESC' },
      });

      if (latest) {
        const ageSeconds = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
        rates.push({
          pair,
          rate: latest.rate,
          provider: latest.provider,
          fetchedAt: latest.createdAt.toISOString(),
          ageSeconds,
          isStale: ageSeconds > this.STALENESS_THRESHOLD_SECONDS,
          stalenessThresholdSeconds: this.STALENESS_THRESHOLD_SECONDS,
          isManualOverride: latest.isManualOverride,
        });
      }
    }

    return { rates };
  }

  async getRateHistory(pair: string, startDate: Date, endDate: Date, granularity: string) {
    const [token, fiat] = pair.split('/');
    const snapshots = await this.snapshotRepo.find({
      where: {
        tokenSymbol: token,
        fiatCurrency: fiat,
        createdAt: MoreThan(startDate),
      },
      order: { createdAt: 'ASC' },
    });

    return snapshots.filter(s => s.createdAt <= endDate);
  }

  async setRateOverride(dto: any, userId: string) {
    const marketPair = `${dto.tokenSymbol}-${dto.fiatCurrency}`;
    const marketRate = await this.exchangeRateService.getRate(marketPair);
    const overrideRate = parseFloat(dto.rate);

    const deviation = Math.abs(overrideRate - marketRate) / marketRate;
    if (deviation > 0.2) {
      throw new BadRequestException('Rate deviates more than 20% from market rate');
    }

    const expiresAt = new Date(Date.now() + dto.durationMinutes * 60 * 1000);

    const snapshot = this.snapshotRepo.create({
      tokenSymbol: dto.tokenSymbol,
      fiatCurrency: dto.fiatCurrency,
      rate: dto.rate,
      provider: 'manual',
      isManualOverride: true,
      overrideSetById: userId,
      overrideExpiresAt: expiresAt,
    });

    await this.snapshotRepo.save(snapshot);

    await this.rateOverrideQueue.add(
      'clear-override',
      { tokenSymbol: dto.tokenSymbol, fiatCurrency: dto.fiatCurrency },
      { delay: dto.durationMinutes * 60 * 1000 },
    );

    await this.auditLogService.log({
      entityType: 'exchange_rate_override',
      entityId: snapshot.id,
      action: AuditAction.CREATE,
      actorId: userId,
      actorType: ActorType.ADMIN,
      metadata: { reason: dto.reason, expiresAt: expiresAt.toISOString() },
    });

    return snapshot;
  }

  async clearRateOverride(tokenSymbol: string, fiatCurrency: string) {
    await this.snapshotRepo.update(
      { tokenSymbol, fiatCurrency, isManualOverride: true, overrideExpiresAt: MoreThan(new Date()) },
      { overrideExpiresAt: new Date() },
    );
  }

  async listProviders() {
    return this.providerRepo.find({ order: { priority: 'ASC' } });
  }

  async updateProvider(id: string, dto: any) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new BadRequestException('Provider not found');

    if (dto.isEnabled === false) {
      const inProgress = await this.checkInProgressSettlements(id);
      if (inProgress.length > 0) {
        throw new ConflictException({
          message: 'Provider has in-progress settlements',
          settlementIds: inProgress,
        });
      }
    }

    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  async triggerHealthCheck(id: string) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new BadRequestException('Provider not found');

    const start = Date.now();
    try {
      await this.performHealthCheck(provider);
      const latency = Date.now() - start;
      provider.lastHealthCheckAt = new Date();
      provider.lastHealthCheckLatencyMs = latency;
      provider.status = ProviderStatus.ACTIVE;
    } catch (error) {
      provider.status = ProviderStatus.DOWN;
      provider.lastHealthCheckAt = new Date();
    }

    return this.providerRepo.save(provider);
  }

  async getProviderPerformance(id: string) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new BadRequestException('Provider not found');

    return {
      successRate: provider.successRate30d,
      averageLatency: provider.lastHealthCheckLatencyMs,
      volumeHandled: provider.todayUsedVolume,
      status: provider.status,
    };
  }

  private async checkInProgressSettlements(providerId: string): Promise<string[]> {
    return [];
  }

  private async performHealthCheck(provider: LiquidityProvider): Promise<void> {
    this.logger.log(`Health check for ${provider.name}`);
  }
}
