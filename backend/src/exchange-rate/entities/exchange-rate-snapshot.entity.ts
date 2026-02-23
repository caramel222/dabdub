import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('exchange_rate_snapshots')
export class ExchangeRateSnapshot extends BaseEntity {
  @Column()
  tokenSymbol: string;

  @Column()
  fiatCurrency: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  rate: string;

  @Column()
  provider: string;

  @Column({ type: 'boolean', default: false })
  isManualOverride: boolean;

  @Column({ nullable: true })
  overrideSetById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  overrideExpiresAt: Date | null;
}
