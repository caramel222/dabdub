import { DataSource } from 'typeorm';
import { LiquidityProvider, ProviderStatus } from '../exchange-rate/entities/liquidity-provider.entity';

export async function seedLiquidityProviders(dataSource: DataSource): Promise<void> {
  const providerRepo = dataSource.getRepository(LiquidityProvider);

  const providers = [
    {
      name: 'yellowcard',
      displayName: 'Yellowcard',
      supportedCurrencies: ['USD', 'NGN', 'KES', 'GHS'],
      status: ProviderStatus.ACTIVE,
      isEnabled: true,
      priority: 1,
      feePercentage: '0.0150',
      successRate30d: '99.50',
      dailyVolumeLimit: '1000000.00000000',
      todayUsedVolume: '0.00000000',
    },
    {
      name: 'flutterwave',
      displayName: 'Flutterwave',
      supportedCurrencies: ['USD', 'NGN', 'GHS', 'KES', 'ZAR'],
      status: ProviderStatus.ACTIVE,
      isEnabled: true,
      priority: 2,
      feePercentage: '0.0200',
      successRate30d: '98.80',
      dailyVolumeLimit: '2000000.00000000',
      todayUsedVolume: '0.00000000',
    },
    {
      name: 'kotani',
      displayName: 'Kotani Pay',
      supportedCurrencies: ['USD', 'KES', 'UGX'],
      status: ProviderStatus.ACTIVE,
      isEnabled: true,
      priority: 3,
      feePercentage: '0.0180',
      successRate30d: '97.20',
      dailyVolumeLimit: '500000.00000000',
      todayUsedVolume: '0.00000000',
    },
  ];

  for (const providerData of providers) {
    const existing = await providerRepo.findOne({ where: { name: providerData.name } });
    if (!existing) {
      await providerRepo.save(providerRepo.create(providerData));
    }
  }
}
