import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class SearchFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by invoice status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by client name' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Filter by billing GSTIN' })
  @IsOptional()
  @IsString()
  billToGSTIN?: string;

  @ApiPropertyOptional({ description: 'Filter invoices with/without GST' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasGST?: boolean;

  @ApiPropertyOptional({ description: 'Filter by GST state code' })
  @IsOptional()
  @IsString()
  gstState?: string;

  @ApiPropertyOptional({ description: 'Filter inter-state transactions' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  interState?: boolean;
}

export class SearchInvoicesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Sort field (createdAt, amount, status, etc.)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  // Flatten the filter properties to the main DTO for easier query parameter handling
  @ApiPropertyOptional({ description: 'Filter by invoice status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by client name' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Filter by billing GSTIN' })
  @IsOptional()
  @IsString()
  billToGSTIN?: string;

  @ApiPropertyOptional({ description: 'Filter invoices with/without GST' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasGST?: boolean;

  @ApiPropertyOptional({ description: 'Filter by GST state code' })
  @IsOptional()
  @IsString()
  gstState?: string;

  @ApiPropertyOptional({ description: 'Filter inter-state transactions' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  interState?: boolean;
}
