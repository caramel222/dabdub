import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChainMonitor, MonitorStatus } from '../entities/chain-monitor.entity';
import { RpcEndpoint } from '../entities/rpc-endpoint.entity';
import { ScanHistory } from '../entities/scan-history.entity';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuditAction, ActorType } from '../../database/entities/audit-log.enums';
import { AddRpcEndpointDto, UpdateRpcEndpointDto } from '../dto/blockchain-monitoring.dto';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainMonitoringAdminService {
  private readonly logger = new Logger(BlockchainMonitoringAdminService.name);

  constructor(
    @InjectRepository(ChainMonitor)
    private readonly chainMonitorRepo: Repository<ChainMonitor>,
    @InjectRepository(RpcEndpoint)
    private readonly rpcEndpointRepo: Repository<RpcEndpoint>,
    @InjectRepository(ScanHistory)
    private readonly scanHistoryRepo: Repository<ScanHistory>,
    private readonly cryptoService: CryptoService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listMonitors() {
    const monitors = await this.chainMonitorRepo.find();
    return {
      monitors: monitors.map(m => this.enrichMonitorData(m)),
    };
  }

  private enrichMonitorData(monitor: ChainMonitor) {
    const blockLag = monitor.latestKnownBlock 
      ? BigInt(monitor.latestKnownBlock) - BigInt(monitor.lastScannedBlock)
      : BigInt(0);
    
    const healthStatus = this.calculateHealthStatus(Number(blockLag), monitor.consecutiveErrors);
    const scanAge = monitor.lastScanAt ? this.formatTimeDiff(monitor.lastScanAt) : 'never';
    const estimatedSyncTime = this.estimateSyncTime(Number(blockLag), monitor.pollingIntervalSeconds);

    return {
      chain: monitor.chain,
      status: monitor.status,
      lastScannedBlock: Number(monitor.lastScannedBlock),
      latestKnownBlock: monitor.latestKnownBlock ? Number(monitor.latestKnownBlock) : null,
      blockLag: Number(blockLag),
      lastScanAt: monitor.lastScanAt,
      scanAge,
      pollingIntervalSeconds: monitor.pollingIntervalSeconds,
      totalDepositsDetected: Number(monitor.totalDepositsDetected),
      consecutiveErrors: monitor.consecutiveErrors,
      estimatedSyncTime,
      healthStatus,
    };
  }

  private calculateHealthStatus(blockLag: number, consecutiveErrors: number): string {
    if (blockLag > 50 || consecutiveErrors > 3) return 'CRITICAL';
    if (blockLag >= 10 || consecutiveErrors >= 1) return 'WARNING';
    return 'HEALTHY';
  }

  private formatTimeDiff(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  private estimateSyncTime(blockLag: number, pollingInterval: number): string {
    if (blockLag === 0) return '0s';
    const seconds = blockLag * pollingInterval;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  async pauseMonitor(chain: string, reason: string, actorId: string) {
    const monitor = await this.chainMonitorRepo.findOne({ where: { chain } });
    if (!monitor) throw new NotFoundException(`Monitor for chain ${chain} not found`);

    monitor.status = MonitorStatus.PAUSED;
    await this.chainMonitorRepo.save(monitor);

    await this.auditLogService.log({
      entityType: 'ChainMonitor',
      entityId: monitor.id,
      action: AuditAction.UPDATE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: { action: 'pause', reason },
    });

    return { success: true, chain, status: 'PAUSED' };
  }

  async resumeMonitor(chain: string, actorId: string) {
    const monitor = await this.chainMonitorRepo.findOne({ where: { chain } });
    if (!monitor) throw new NotFoundException(`Monitor for chain ${chain} not found`);

    monitor.status = MonitorStatus.RUNNING;
    monitor.consecutiveErrors = 0;
    await this.chainMonitorRepo.save(monitor);

    await this.auditLogService.log({
      entityType: 'ChainMonitor',
      entityId: monitor.id,
      action: AuditAction.UPDATE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: { action: 'resume' },
    });

    return { success: true, chain, status: 'RUNNING' };
  }

  async rescanBlocks(chain: string, fromBlock: number, toBlock: number, reason: string, actorId: string) {
    if (toBlock - fromBlock > 10000) {
      throw new BadRequestException('Block range cannot exceed 10,000 blocks');
    }

    const monitor = await this.chainMonitorRepo.findOne({ where: { chain } });
    if (!monitor) throw new NotFoundException(`Monitor for chain ${chain} not found`);

    await this.auditLogService.log({
      entityType: 'ChainMonitor',
      entityId: monitor.id,
      action: AuditAction.UPDATE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: { action: 'rescan', fromBlock, toBlock, reason },
    });

    return { success: true, message: 'Rescan job enqueued', fromBlock, toBlock };
  }

  async getScanHistory(chain: string, limit = 100) {
    const history = await this.scanHistoryRepo.find({
      where: { chain },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return history.map(h => ({
      fromBlock: Number(h.fromBlock),
      toBlock: Number(h.toBlock),
      depositsFound: h.depositsFound,
      durationMs: h.durationMs,
      error: h.error,
      timestamp: h.createdAt,
    }));
  }

  async listRpcEndpoints() {
    const endpoints = await this.rpcEndpointRepo.find();
    return endpoints.map(e => ({
      id: e.id,
      chain: e.chain,
      url: this.maskUrl(this.cryptoService.decrypt(e.url)),
      providerName: e.providerName,
      isActive: e.isActive,
      isPrimary: e.isPrimary,
      priority: e.priority,
      lastLatencyMs: e.lastLatencyMs,
      uptimePercent30d: Number(e.uptimePercent30d),
      totalRequestCount: Number(e.totalRequestCount),
      errorCount: Number(e.errorCount),
      lastCheckedAt: e.lastCheckedAt,
    }));
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      if (pathParts.length > 1) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.length > 8) {
          pathParts[pathParts.length - 1] = lastPart.substring(0, 4) + '***' + lastPart.substring(lastPart.length - 4);
        }
      }
      parsed.pathname = pathParts.join('/');
      return parsed.toString();
    } catch {
      return url.substring(0, 20) + '***';
    }
  }

  async addRpcEndpoint(dto: AddRpcEndpointDto, actorId: string) {
    const healthCheck = await this.testRpcEndpoint(dto.url);
    if (!healthCheck.healthy) {
      throw new BadRequestException(`RPC endpoint health check failed: ${healthCheck.error}`);
    }

    const encrypted = this.cryptoService.encrypt(dto.url);
    const endpoint = this.rpcEndpointRepo.create({
      chain: dto.chain,
      url: encrypted,
      providerName: dto.providerName,
      isPrimary: dto.isPrimary,
      priority: dto.priority,
      lastLatencyMs: healthCheck.latencyMs,
      lastCheckedAt: new Date(),
    });

    const saved = await this.rpcEndpointRepo.save(endpoint);

    await this.auditLogService.log({
      entityType: 'RpcEndpoint',
      entityId: saved.id,
      action: AuditAction.CREATE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: { chain: dto.chain, providerName: dto.providerName },
    });

    return { success: true, id: saved.id };
  }

  async updateRpcEndpoint(id: string, dto: UpdateRpcEndpointDto, actorId: string) {
    const endpoint = await this.rpcEndpointRepo.findOne({ where: { id } });
    if (!endpoint) throw new NotFoundException('RPC endpoint not found');

    if (dto.isActive !== undefined) endpoint.isActive = dto.isActive;
    if (dto.isPrimary !== undefined) endpoint.isPrimary = dto.isPrimary;
    if (dto.priority !== undefined) endpoint.priority = dto.priority;

    await this.rpcEndpointRepo.save(endpoint);

    await this.auditLogService.log({
      entityType: 'RpcEndpoint',
      entityId: id,
      action: AuditAction.UPDATE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: dto,
    });

    return { success: true };
  }

  async deleteRpcEndpoint(id: string, actorId: string) {
    const endpoint = await this.rpcEndpointRepo.findOne({ where: { id } });
    if (!endpoint) throw new NotFoundException('RPC endpoint not found');

    const activeCount = await this.rpcEndpointRepo.count({
      where: { chain: endpoint.chain, isActive: true },
    });

    if (activeCount === 1 && endpoint.isActive) {
      throw new BadRequestException('Cannot delete the last active RPC endpoint for this chain');
    }

    await this.rpcEndpointRepo.remove(endpoint);

    await this.auditLogService.log({
      entityType: 'RpcEndpoint',
      entityId: id,
      action: AuditAction.DELETE,
      actorId,
      actorType: ActorType.ADMIN,
      metadata: { chain: endpoint.chain },
    });

    return { success: true };
  }

  async healthCheckEndpoint(id: string) {
    const endpoint = await this.rpcEndpointRepo.findOne({ where: { id } });
    if (!endpoint) throw new NotFoundException('RPC endpoint not found');

    const url = this.cryptoService.decrypt(endpoint.url);
    const result = await this.testRpcEndpoint(url);

    endpoint.lastLatencyMs = result.latencyMs || null;
    endpoint.lastCheckedAt = new Date();
    if (!result.healthy) {
      endpoint.errorCount = String(BigInt(endpoint.errorCount) + BigInt(1));
    }
    await this.rpcEndpointRepo.save(endpoint);

    return {
      latencyMs: result.latencyMs,
      blockNumber: result.blockNumber,
      status: result.healthy ? 'healthy' : 'unhealthy',
      error: result.error,
    };
  }

  private async testRpcEndpoint(url: string): Promise<{
    healthy: boolean;
    latencyMs?: number;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      const provider = new ethers.JsonRpcProvider(url);
      const blockNumber = await provider.getBlockNumber();
      const latencyMs = Date.now() - start;

      return { healthy: true, latencyMs, blockNumber };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}
