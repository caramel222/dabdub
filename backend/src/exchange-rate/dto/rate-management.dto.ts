import { IsString, IsDecimal, IsInt, Min, Max, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class SetRateOverrideDto {
  @IsString()
  tokenSymbol: string;

  @IsString()
  fiatCurrency: string;

  @IsDecimal()
  rate: string;

  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes: number;

  @IsString()
  @MinLength(20)
  reason: string;
}

export class UpdateLiquidityProviderDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsDecimal()
  feePercentage?: string;

  @IsOptional()
  @IsDecimal()
  dailyVolumeLimit?: string;
}
