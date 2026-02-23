import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ExchangeRateSnapshot } from './entities/exchange-rate-snapshot.entity';
import { ExchangeRateService } from './exchange-rate.service';

@Injectable()
export class RateSnapshotService {
  private readonly logger = new Logger(RateSnapshotService.name);

  constructor(
    @InjectRepository(ExchangeRateSnapshot)
    private snapshotRepo: Repository<ExchangeRateSnapshot>,
    private exchangeRateService: ExchangeRateService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async captureRateSnapshots() {
    const pairs = [
      { token: 'USDC', fiat: 'USD' },
      { token: 'ETH', fiat: 'USD' },
      { token: 'MATIC', fiat: 'USD' },
    ];

    for (const { token, fiat } of pairs) {
      try {
        const activeOverride = await this.snapshotRepo.findOne({
          where: {
            tokenSymbol: token,
            fiatCurrency: fiat,
            isManualOverride: true,
            overrideExpiresAt: MoreThan(new Date()),
          },
          order: { createdAt: 'DESC' },
        });

        if (activeOverride) {
          this.logger.debug(`Using manual override for ${token}/${fiat}`);
          continue;
        }

        const rate = await this.exchangeRateService.getRate(`${token}-${fiat}`);
        
        await this.snapshotRepo.save(
          this.snapshotRepo.create({
            tokenSymbol: token,
            fiatCurrency: fiat,
            rate: rate.toString(),
            provider: 'coingecko',
            isManualOverride: false,
          }),
        );
      } catch (error) {
        this.logger.error(`Failed to capture snapshot for ${token}/${fiat}: ${error.message}`);
      }
    }
  }
}
