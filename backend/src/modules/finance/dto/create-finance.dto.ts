import { IsString, IsDecimal, IsDateString, IsOptional, IsArray, IsEmail, IsNumber, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillToAddressDto } from './bill-to-address.dto';
import { ShipToAddressDto } from './ship-to-address.dto';
import { TaxSettingsDto } from './gst-calculation.dto';

export class InvoiceItemDto {
  @ApiProperty({
    description: 'Item description',
    example: 'Software Development Services'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Rate per unit',
    example: 100000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate: number;

  @ApiProperty({
    description: 'Total amount (quantity × rate)',
    example: 100000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    description: 'Custom invoice number (if not provided, will be auto-generated)',
    example: 'INV-2025-001'
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Client name (for backward compatibility)',
    example: 'ABC Corporation'
  })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({
    description: 'Customer ID (for linking to customer records)',
    example: 'uuid-of-customer'
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    description: 'Bill To address information',
    type: BillToAddressDto
  })
  @ValidateNested()
  @Type(() => BillToAddressDto)
  billTo: BillToAddressDto;

  @ApiPropertyOptional({
    description: 'Ship To address information (optional, can be different from Bill To)',
    type: ShipToAddressDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShipToAddressDto)
  shipTo?: ShipToAddressDto;

  @ApiProperty({
    description: 'Invoice items',
    type: [InvoiceItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Shipping/freight charges',
    example: 5000,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingCharges?: number;

  @ApiProperty({
    description: 'Tax settings including GST configuration',
    type: TaxSettingsDto
  })
  @ValidateNested()
  @Type(() => TaxSettingsDto)
  taxSettings: TaxSettingsDto;

  @ApiPropertyOptional({
    description: 'Client email',
    example: 'finance@abccorp.com'
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiProperty({
    description: 'Due date',
    example: '2025-10-10'
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Invoice status',
    example: 'draft',
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Payment terms: Net 30 days'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // Legacy field for backward compatibility
  @ApiPropertyOptional({
    description: 'Legacy amount field (for backward compatibility)',
    example: 100000
  })
  @IsOptional()
  @IsDecimal()
  amount?: number;
}

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsDecimal()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
