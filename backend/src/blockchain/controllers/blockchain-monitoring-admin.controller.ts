import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockchainMonitoringAdminService } from '../services/blockchain-monitoring-admin.service';
import { PauseMonitorDto, RescanBlockRangeDto, AddRpcEndpointDto, UpdateRpcEndpointDto } from '../dto/blockchain-monitoring.dto';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { RequirePermissionGuard } from '../../auth/guards/require-permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('Blockchain Monitoring Admin')
@ApiBearerAuth()
@Controller('api/v1/blockchain')
@UseGuards(AdminJwtGuard, RequirePermissionGuard)
export class BlockchainMonitoringAdminController {
  constructor(
    private readonly monitoringService: BlockchainMonitoringAdminService,
  ) {}

  @Get('monitors')
  @RequirePermission('config:read')
  @ApiOperation({ summary: 'List all chain monitors' })
  async listMonitors() {
    return this.monitoringService.listMonitors();
  }

  @Post('monitors/:chain/pause')
  @RequirePermission('config:write')
  @ApiOperation({ summary: 'Pause a chain monitor' })
  async pauseMonitor(
    @Param('chain') chain: string,
    @Body() dto: PauseMonitorDto,
    @Req() req: any,
  ) {
    return this.monitoringService.pauseMonitor(chain, dto.reason, req.user.id);
  }

  @Post('monitors/:chain/resume')
  @RequirePermission('config:write')
  @ApiOperation({ summary: 'Resume a paused monitor' })
  async resumeMonitor(@Param('chain') chain: string, @Req() req: any) {
    return this.monitoringService.resumeMonitor(chain, req.user.id);
  }

  @Post('monitors/:chain/rescan')
  @RequirePermission('config:write')
  @ApiOperation({ summary: 'Trigger block rescan' })
  async rescanBlocks(
    @Param('chain') chain: string,
    @Body() dto: RescanBlockRangeDto,
    @Req() req: any,
  ) {
    return this.monitoringService.rescanBlocks(
      chain,
      dto.fromBlock,
      dto.toBlock,
      dto.reason,
      req.user.id,
    );
  }

  @Get('monitors/:chain/scan-history')
  @RequirePermission('config:read')
  @ApiOperation({ summary: 'Get scan history for a chain' })
  async getScanHistory(@Param('chain') chain: string) {
    return this.monitoringService.getScanHistory(chain);
  }

  @Get('rpc-endpoints')
  @RequirePermission('config:read')
  @ApiOperation({ summary: 'List all RPC endpoints' })
  async listRpcEndpoints() {
    return this.monitoringService.listRpcEndpoints();
  }

  @Post('rpc-endpoints')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Add new RPC endpoint' })
  async addRpcEndpoint(@Body() dto: AddRpcEndpointDto, @Req() req: any) {
    return this.monitoringService.addRpcEndpoint(dto, req.user.id);
  }

  @Patch('rpc-endpoints/:id')
  @RequirePermission('config:write')
  @ApiOperation({ summary: 'Update RPC endpoint configuration' })
  async updateRpcEndpoint(
    @Param('id') id: string,
    @Body() dto: UpdateRpcEndpointDto,
    @Req() req: any,
  ) {
    return this.monitoringService.updateRpcEndpoint(id, dto, req.user.id);
  }

  @Delete('rpc-endpoints/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Remove RPC endpoint' })
  async deleteRpcEndpoint(@Param('id') id: string, @Req() req: any) {
    return this.monitoringService.deleteRpcEndpoint(id, req.user.id);
  }

  @Post('rpc-endpoints/:id/health-check')
  @RequirePermission('config:read')
  @ApiOperation({ summary: 'Test endpoint connectivity' })
  async healthCheckEndpoint(@Param('id') id: string) {
    return this.monitoringService.healthCheckEndpoint(id);
  }
}
