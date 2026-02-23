import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RateManagementService } from './rate-management.service';
import { SetRateOverrideDto, UpdateLiquidityProviderDto } from './dto/rate-management.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1')
@UseGuards(AdminJwtGuard, PermissionGuard)
export class RateManagementController {
  constructor(private readonly rateService: RateManagementService) {}

  @Get('rates/current')
  @Permissions('analytics:read')
  async getCurrentRates() {
    return this.rateService.getCurrentRates();
  }

  @Get('rates/history')
  @Permissions('analytics:read')
  async getRateHistory(
    @Query('pair') pair: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity: string,
  ) {
    return this.rateService.getRateHistory(
      pair,
      new Date(startDate),
      new Date(endDate),
      granularity,
    );
  }

  @Post('rates/override')
  @Permissions('config:write')
  async setRateOverride(@Body() dto: SetRateOverrideDto, @CurrentUser() user: any) {
    return this.rateService.setRateOverride(dto, user.id);
  }

  @Delete('rates/override/:tokenSymbol/:fiatCurrency')
  @Permissions('config:write')
  async clearRateOverride(
    @Param('tokenSymbol') tokenSymbol: string,
    @Param('fiatCurrency') fiatCurrency: string,
  ) {
    await this.rateService.clearRateOverride(tokenSymbol, fiatCurrency);
    return { message: 'Override cleared' };
  }

  @Get('liquidity-providers')
  @Permissions('config:read')
  async listProviders() {
    return this.rateService.listProviders();
  }

  @Patch('liquidity-providers/:id')
  @Permissions('config:write')
  async updateProvider(@Param('id') id: string, @Body() dto: UpdateLiquidityProviderDto) {
    return this.rateService.updateProvider(id, dto);
  }

  @Post('liquidity-providers/:id/health-check')
  @Permissions('config:read')
  async triggerHealthCheck(@Param('id') id: string) {
    return this.rateService.triggerHealthCheck(id);
  }

  @Get('liquidity-providers/:id/performance')
  @Permissions('config:read')
  async getProviderPerformance(@Param('id') id: string) {
    return this.rateService.getProviderPerformance(id);
  }
}
