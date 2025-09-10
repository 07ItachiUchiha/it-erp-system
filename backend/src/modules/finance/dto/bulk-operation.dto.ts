import { IsString, IsEnum, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-finance.dto';

export class BulkOperationDto {
  @ApiProperty({ description: 'Bulk operation type', enum: ['create', 'update', 'delete'] })
  @IsEnum(['create', 'update', 'delete'])
  operation: 'create' | 'update' | 'delete';

  @ApiPropertyOptional({ description: 'Invoices data for create operation', type: [CreateInvoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  invoices?: CreateInvoiceDto[];

  @ApiPropertyOptional({ description: 'Entity IDs for update/delete operations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityIds?: string[];

  @ApiPropertyOptional({ description: 'Update data for bulk update operation' })
  @IsOptional()
  @IsObject()
  updateData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  reason?: string;
}
