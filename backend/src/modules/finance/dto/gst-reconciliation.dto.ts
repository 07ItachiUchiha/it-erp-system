import { IsArray, IsOptional, IsBoolean, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReconciliationPeriodDto {
  @ApiPropertyOptional({ description: 'Period start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Period end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;
}

export class GstReconciliationDto {
  @ApiPropertyOptional({ description: 'Specific invoice IDs to reconcile' })
  @IsOptional()
  @IsArray()
  invoiceIds?: string[];

  @ApiPropertyOptional({ description: 'Period for reconciliation' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReconciliationPeriodDto)
  period?: ReconciliationPeriodDto;

  @ApiPropertyOptional({ description: 'Recalculate GST values', default: false })
  @IsOptional()
  @IsBoolean()
  recalculate?: boolean;
}
