import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBlockchainMonitoringTables1740200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chain_monitors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'chain',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'lastScannedBlock',
            type: 'bigint',
          },
          {
            name: 'latestKnownBlock',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'blockLag',
            type: 'int',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['RUNNING', 'PAUSED', 'ERROR', 'SYNCING'],
          },
          {
            name: 'lastScanAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'lastErrorAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'lastErrorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'consecutiveErrors',
            type: 'int',
            default: 0,
          },
          {
            name: 'blocksPerScan',
            type: 'int',
          },
          {
            name: 'pollingIntervalSeconds',
            type: 'int',
          },
          {
            name: 'avgBlockTimeSeconds',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 0,
          },
          {
            name: 'totalDepositsDetected',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'totalBlocksScanned',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'rpc_endpoints',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'chain',
            type: 'varchar',
          },
          {
            name: 'url',
            type: 'text',
          },
          {
            name: 'providerName',
            type: 'varchar',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isPrimary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastLatencyMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'uptimePercent30d',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 100,
          },
          {
            name: 'totalRequestCount',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'errorCount',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'lastCheckedAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'scan_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'chain',
            type: 'varchar',
          },
          {
            name: 'fromBlock',
            type: 'bigint',
          },
          {
            name: 'toBlock',
            type: 'bigint',
          },
          {
            name: 'depositsFound',
            type: 'int',
          },
          {
            name: 'durationMs',
            type: 'int',
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'rpc_endpoints',
      new TableIndex({
        name: 'IDX_rpc_endpoints_chain_active',
        columnNames: ['chain', 'isActive'],
      }),
    );

    await queryRunner.createIndex(
      'scan_history',
      new TableIndex({
        name: 'IDX_scan_history_chain_created',
        columnNames: ['chain', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scan_history');
    await queryRunner.dropTable('rpc_endpoints');
    await queryRunner.dropTable('chain_monitors');
  }
}
