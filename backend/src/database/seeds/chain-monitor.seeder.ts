import { DataSource } from 'typeorm';
import { ChainMonitor, MonitorStatus } from '../../blockchain/entities/chain-monitor.entity';

export async function seedChainMonitors(dataSource: DataSource): Promise<void> {
  const chainMonitorRepo = dataSource.getRepository(ChainMonitor);

  const chains = [
    { chain: 'polygon', blocksPerScan: 100, pollingIntervalSeconds: 10, avgBlockTimeSeconds: '2.0' },
    { chain: 'base', blocksPerScan: 100, pollingIntervalSeconds: 10, avgBlockTimeSeconds: '2.0' },
    { chain: 'celo', blocksPerScan: 50, pollingIntervalSeconds: 15, avgBlockTimeSeconds: '5.0' },
    { chain: 'arbitrum', blocksPerScan: 100, pollingIntervalSeconds: 5, avgBlockTimeSeconds: '1.0' },
    { chain: 'optimism', blocksPerScan: 100, pollingIntervalSeconds: 10, avgBlockTimeSeconds: '2.0' },
    { chain: 'starknet', blocksPerScan: 50, pollingIntervalSeconds: 20, avgBlockTimeSeconds: '10.0' },
    { chain: 'stellar', blocksPerScan: 50, pollingIntervalSeconds: 15, avgBlockTimeSeconds: '5.0' },
    { chain: 'stacks', blocksPerScan: 10, pollingIntervalSeconds: 600, avgBlockTimeSeconds: '600.0' },
  ];

  for (const chainData of chains) {
    const existing = await chainMonitorRepo.findOne({ where: { chain: chainData.chain } });
    
    if (!existing) {
      const monitor = chainMonitorRepo.create({
        chain: chainData.chain,
        lastScannedBlock: '0',
        latestKnownBlock: null,
        blockLag: 0,
        status: MonitorStatus.SYNCING,
        lastScanAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        consecutiveErrors: 0,
        blocksPerScan: chainData.blocksPerScan,
        pollingIntervalSeconds: chainData.pollingIntervalSeconds,
        avgBlockTimeSeconds: chainData.avgBlockTimeSeconds,
        totalDepositsDetected: '0',
        totalBlocksScanned: '0',
      });

      await chainMonitorRepo.save(monitor);
      console.log(`✓ Seeded chain monitor: ${chainData.chain}`);
    }
  }
}
