import { IsString, IsInt, Min, MinLength, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PauseMonitorDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  reason: string;
}

export class RescanBlockRangeDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  fromBlock: number;

  @ApiProperty()
  @IsInt()
  toBlock: number;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  reason: string;
}

export class AddRpcEndpointDto {
  @ApiProperty()
  @IsString()
  chain: string;

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty()
  @IsString()
  providerName: string;

  @ApiProperty()
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  priority: number;
}

export class UpdateRpcEndpointDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  priority?: number;
}
