import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

export enum MonitorStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  SYNCING = 'SYNCING',
}

@Entity('chain_monitors')
export class ChainMonitor extends BaseEntity {
  @Column({ unique: true })
  chain: string;

  @Column({ type: 'bigint' })
  lastScannedBlock: string;

  @Column({ type: 'bigint', nullable: true })
  latestKnownBlock: string | null;

  @Column({ type: 'int' })
  blockLag: number;

  @Column({ type: 'enum', enum: MonitorStatus })
  status: MonitorStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastScanAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastErrorAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastErrorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  consecutiveErrors: number;

  @Column({ type: 'int' })
  blocksPerScan: number;

  @Column({ type: 'int' })
  pollingIntervalSeconds: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  avgBlockTimeSeconds: string;

  @Column({ type: 'bigint', default: 0 })
  totalDepositsDetected: string;

  @Column({ type: 'bigint', default: 0 })
  totalBlocksScanned: string;
}
