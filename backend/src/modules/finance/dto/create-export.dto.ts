import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportFiltersDto {
  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['draft', 'pending', 'paid', 'cancelled', 'overdue'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @IsOptional()
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
}

export class ExportOptionsDto {
  @ApiPropertyOptional({ description: 'Include column headers', default: true })
  @IsOptional()
  @IsBoolean()
  includeHeaders?: boolean;

  @ApiPropertyOptional({ description: 'Format numbers for readability', default: true })
  @IsOptional()
  @IsBoolean()
  formatNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Include GST breakdown for invoices', default: false })
  @IsOptional()
  @IsBoolean()
  includeGSTBreakdown?: boolean;

  @ApiPropertyOptional({ description: 'Group data by client', default: false })
  @IsOptional()
  @IsBoolean()
  groupByClient?: boolean;

  @ApiPropertyOptional({ description: 'Use streaming for large datasets', default: false })
  @IsOptional()
  @IsBoolean()
  streaming?: boolean;

  @ApiPropertyOptional({ description: 'CSV delimiter character', default: ',' })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({ description: 'Chunk size for streaming', default: 1000 })
  @IsOptional()
  @IsNumber()
  chunkSize?: number;

  @ApiPropertyOptional({ description: 'PDF orientation', enum: ['portrait', 'landscape'], default: 'portrait' })
  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: string;

  @ApiPropertyOptional({ description: 'PDF paper size', enum: ['A4', 'A3', 'Letter'], default: 'A4' })
  @IsOptional()
  @IsEnum(['A4', 'A3', 'Letter'])
  paperSize?: string;

  @ApiPropertyOptional({ description: 'Include charts in PDF', default: false })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({ description: 'Group by status in PDF', default: false })
  @IsOptional()
  @IsBoolean()
  groupByStatus?: boolean;
}

export class CreateExportDto {
  @ApiProperty({ description: 'Export format', enum: ['excel', 'csv', 'pdf'] })
  @IsEnum(['excel', 'csv', 'pdf'])
  format: string;

  @ApiProperty({ description: 'Entity type to export', enum: ['invoice', 'customer', 'payment'] })
  @IsEnum(['invoice', 'customer', 'payment'])
  entityType: string;

  @ApiPropertyOptional({ description: 'Specific entity IDs to export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityIds?: string[];

  @ApiPropertyOptional({ description: 'Template ID for PDF exports' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;

  @ApiPropertyOptional({ description: 'Columns to include in export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiPropertyOptional({ description: 'Export options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportOptionsDto)
  options?: ExportOptionsDto;
}
