import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('rpc_endpoints')
export class RpcEndpoint extends BaseEntity {
  @Column()
  chain: string;

  @Column()
  url: string;

  @Column()
  providerName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'int', nullable: true })
  lastLatencyMs: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  uptimePercent30d: string;

  @Column({ type: 'bigint', default: 0 })
  totalRequestCount: string;

  @Column({ type: 'bigint', default: 0 })
  errorCount: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;
}
