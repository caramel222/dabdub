import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExchangeRateManagement1740200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exchange_rate_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tokenSymbol',
            type: 'varchar',
          },
          {
            name: 'fiatCurrency',
            type: 'varchar',
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'provider',
            type: 'varchar',
          },
          {
            name: 'isManualOverride',
            type: 'boolean',
            default: false,
          },
          {
            name: 'overrideSetById',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'overrideExpiresAt',
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

    await queryRunner.createIndex(
      'exchange_rate_snapshots',
      new TableIndex({
        name: 'IDX_rate_snapshot_token_fiat',
        columnNames: ['tokenSymbol', 'fiatCurrency', 'createdAt'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'liquidity_providers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
          },
          {
            name: 'supportedCurrencies',
            type: 'jsonb',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'DEGRADED', 'DOWN', 'DISABLED'],
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 1,
          },
          {
            name: 'feePercentage',
            type: 'decimal',
            precision: 5,
            scale: 4,
          },
          {
            name: 'rateLimits',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'lastHealthCheckAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'lastHealthCheckLatencyMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'successRate30d',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'dailyVolumeLimit',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'todayUsedVolume',
            type: 'decimal',
            precision: 20,
            scale: 8,
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

    await queryRunner.createIndex(
      'liquidity_providers',
      new TableIndex({
        name: 'IDX_provider_priority',
        columnNames: ['priority', 'isEnabled'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('liquidity_providers');
    await queryRunner.dropTable('exchange_rate_snapshots');
  }
}
