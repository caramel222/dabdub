import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlockchainMonitoringAdminService } from './blockchain-monitoring-admin.service';
import { ChainMonitor, MonitorStatus } from '../entities/chain-monitor.entity';
import { RpcEndpoint } from '../entities/rpc-endpoint.entity';
import { ScanHistory } from '../entities/scan-history.entity';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditLogService } from '../../audit/audit-log.service';

describe('BlockchainMonitoringAdminService', () => {
  let service: BlockchainMonitoringAdminService;
  let chainMonitorRepo: Repository<ChainMonitor>;
  let rpcEndpointRepo: Repository<RpcEndpoint>;
  let scanHistoryRepo: Repository<ScanHistory>;
  let cryptoService: CryptoService;
  let auditLogService: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainMonitoringAdminService,
        {
          provide: getRepositoryToken(ChainMonitor),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RpcEndpoint),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ScanHistory),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainMonitoringAdminService>(BlockchainMonitoringAdminService);
    chainMonitorRepo = module.get(getRepositoryToken(ChainMonitor));
    rpcEndpointRepo = module.get(getRepositoryToken(RpcEndpoint));
    scanHistoryRepo = module.get(getRepositoryToken(ScanHistory));
    cryptoService = module.get(CryptoService);
    auditLogService = module.get(AuditLogService);
  });

  describe('pauseMonitor', () => {
    it('should pause a running monitor', async () => {
      const monitor = {
        id: '1',
        chain: 'base',
        status: MonitorStatus.RUNNING,
      } as ChainMonitor;

      jest.spyOn(chainMonitorRepo, 'findOne').mockResolvedValue(monitor);
      jest.spyOn(chainMonitorRepo, 'save').mockResolvedValue(monitor);

      const result = await service.pauseMonitor('base', 'maintenance', 'admin-1');

      expect(result.status).toBe('PAUSED');
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent chain', async () => {
      jest.spyOn(chainMonitorRepo, 'findOne').mockResolvedValue(null);

      await expect(service.pauseMonitor('invalid', 'test', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rescanBlocks', () => {
    it('should reject range exceeding 10,000 blocks', async () => {
      await expect(
        service.rescanBlocks('base', 1000, 12000, 'test', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid range', async () => {
      const monitor = { id: '1', chain: 'base' } as ChainMonitor;
      jest.spyOn(chainMonitorRepo, 'findOne').mockResolvedValue(monitor);

      const result = await service.rescanBlocks('base', 1000, 2000, 'missed blocks', 'admin-1');

      expect(result.success).toBe(true);
      expect(auditLogService.log).toHaveBeenCalled();
    });
  });

  describe('deleteRpcEndpoint', () => {
    it('should prevent deletion of last active endpoint', async () => {
      const endpoint = {
        id: '1',
        chain: 'base',
        isActive: true,
      } as RpcEndpoint;

      jest.spyOn(rpcEndpointRepo, 'findOne').mockResolvedValue(endpoint);
      jest.spyOn(rpcEndpointRepo, 'count').mockResolvedValue(1);

      await expect(service.deleteRpcEndpoint('1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion when multiple active endpoints exist', async () => {
      const endpoint = {
        id: '1',
        chain: 'base',
        isActive: true,
      } as RpcEndpoint;

      jest.spyOn(rpcEndpointRepo, 'findOne').mockResolvedValue(endpoint);
      jest.spyOn(rpcEndpointRepo, 'count').mockResolvedValue(2);
      jest.spyOn(rpcEndpointRepo, 'remove').mockResolvedValue(endpoint);

      const result = await service.deleteRpcEndpoint('1', 'admin-1');

      expect(result.success).toBe(true);
      expect(auditLogService.log).toHaveBeenCalled();
    });
  });
});
