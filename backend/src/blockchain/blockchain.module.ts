import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainNetwork } from './entities/blockchain-network.entity';
import { BlockchainBlockCursor } from './entities/blockchain-block-cursor.entity';
import { PaymentRequest } from './entities/payment-request.entity';
import { NetworkConfiguration } from './entities/network-configuration.entity';
import { ChainMonitor } from './entities/chain-monitor.entity';
import { RpcEndpoint } from './entities/rpc-endpoint.entity';
import { ScanHistory } from './entities/scan-history.entity';
import { BlockchainMonitoringService } from './services/blockchain-monitoring.service';
import { BlockchainMonitoringAdminService } from './services/blockchain-monitoring-admin.service';
import { StellarClientService } from './services/stellar-client.service';
import { StacksService } from './services/stacks.service';
import { StacksClientService } from './services/stacks-client.service';
import { BlockchainMonitoringJob } from './jobs/blockchain-monitoring.job';
import { BlockchainMonitoringController } from './controllers/blockchain-monitoring.controller';
import { BlockchainMonitoringAdminController } from './controllers/blockchain-monitoring-admin.controller';
import { CryptoModule } from '../common/crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockchainNetwork,
      BlockchainBlockCursor,
      PaymentRequest,
      NetworkConfiguration,
      ChainMonitor,
      RpcEndpoint,
      ScanHistory,
    ]),
    CryptoModule,
    AuditModule,
  ],
  controllers: [BlockchainMonitoringController, BlockchainMonitoringAdminController],
  providers: [
    BlockchainMonitoringService,
    BlockchainMonitoringAdminService,
    StellarClientService,
    StacksService,
    StacksClientService,
    BlockchainMonitoringJob,
  ],
  exports: [
    BlockchainMonitoringService,
    BlockchainMonitoringJob,
    StacksService,
  ],
})
export class BlockchainModule {}
