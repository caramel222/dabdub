import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RateManagementService } from './rate-management.service';

@Processor('rate-overrides')
export class RateOverrideProcessor extends WorkerHost {
  private readonly logger = new Logger(RateOverrideProcessor.name);

  constructor(private readonly rateService: RateManagementService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing rate override job: ${job.name}`);

    if (job.name === 'clear-override') {
      const { tokenSymbol, fiatCurrency } = job.data;
      await this.rateService.clearRateOverride(tokenSymbol, fiatCurrency);
      this.logger.log(`Cleared override for ${tokenSymbol}/${fiatCurrency}`);
    }
  }
}
