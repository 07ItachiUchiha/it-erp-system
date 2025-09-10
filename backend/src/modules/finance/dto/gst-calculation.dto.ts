import { IsNumber, IsOptional, IsBoolean, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GSTBreakupDto {
  @ApiProperty({
    description: 'Central GST amount',
    example: 9000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cgst: number;

  @ApiProperty({
    description: 'State GST amount',
    example: 9000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sgst: number;

  @ApiProperty({
    description: 'Integrated GST amount',
    example: 0,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  igst: number;

  @ApiPropertyOptional({
    description: 'Union Territory GST amount',
    example: 0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  utgst?: number;
}

export class TaxSettingsDto {
  @ApiProperty({
    description: 'Whether tax calculation is optional',
    example: true,
    default: true
  })
  @IsBoolean()
  isTaxOptional: boolean;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 18.00,
    minimum: 0,
    maximum: 50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  taxRate: number;

  @ApiPropertyOptional({
    description: 'Manual GST breakdown (if overriding calculated values)',
    type: GSTBreakupDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GSTBreakupDto)
  gstBreakup?: GSTBreakupDto;

  @ApiPropertyOptional({
    description: 'Whether this is a manual override of calculated GST',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isManualOverride?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for manual GST override (required if isManualOverride is true)',
    example: 'Export exemption - partial IGST applicable'
  })
  @IsOptional()
  @IsString()
  overrideReason?: string;
}

export class CalculateGSTDto {
  @ApiProperty({
    description: 'Bill To state name',
    example: 'Maharashtra'
  })
  @IsString()
  billToState: string;

  @ApiProperty({
    description: 'Ship To state name',
    example: 'Maharashtra'
  })
  @IsString()
  shipToState: string;

  @ApiProperty({
    description: 'Subtotal amount before taxes',
    example: 100000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'Shipping charges',
    example: 5000,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingCharges: number;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 18,
    minimum: 0,
    maximum: 50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  taxRate: number;
}

export class GSTCalculationResultDto {
  @ApiProperty({
    description: 'Type of GST calculation',
    example: 'intra-state',
    enum: ['intra-state', 'inter-state']
  })
  transactionType: 'intra-state' | 'inter-state';

  @ApiProperty({
    description: 'GST breakdown',
    type: GSTBreakupDto
  })
  gstBreakup: GSTBreakupDto;

  @ApiProperty({
    description: 'Total tax amount',
    example: 18900
  })
  totalTax: number;

  @ApiProperty({
    description: 'Total amount including tax',
    example: 123900
  })
  grandTotal: number;
}
