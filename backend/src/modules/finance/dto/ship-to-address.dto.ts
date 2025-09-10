import { IsString, IsOptional, Length, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShipToAddressDto {
  @ApiPropertyOptional({
    description: 'Complete shipping address (manual entry)',
    example: 'Warehouse B-4, Industrial Area, Pune, Maharashtra 411019'
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  address?: string;

  @ApiPropertyOptional({
    description: 'Whether to use existing customer address',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  useCustomerAddress?: boolean;

  @ApiPropertyOptional({
    description: 'Customer address ID to use (if useCustomerAddress is true)',
    example: 'uuid-of-customer-address'
  })
  @IsOptional()
  @IsUUID()
  customerAddressId?: string;
}
