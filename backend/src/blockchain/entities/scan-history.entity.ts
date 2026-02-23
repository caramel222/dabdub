import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity('scan_history')
export class ScanHistory extends BaseEntity {
  @Column()
  chain: string;

  @Column({ type: 'bigint' })
  fromBlock: string;

  @Column({ type: 'bigint' })
  toBlock: string;

  @Column({ type: 'int' })
  depositsFound: number;

  @Column({ type: 'int' })
  durationMs: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
