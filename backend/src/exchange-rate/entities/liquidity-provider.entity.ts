import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

export enum ProviderStatus {
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  DISABLED = 'DISABLED',
}

@Entity('liquidity_providers')
export class LiquidityProvider extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'jsonb' })
  supportedCurrencies: string[];

  @Column({ type: 'enum', enum: ProviderStatus })
  status: ProviderStatus;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  feePercentage: string;

  @Column({ type: 'jsonb', nullable: true })
  rateLimits: Record<string, number> | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastHealthCheckAt: Date | null;

  @Column({ type: 'int', nullable: true })
  lastHealthCheckLatencyMs: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  successRate30d: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  dailyVolumeLimit: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  todayUsedVolume: string;
}
