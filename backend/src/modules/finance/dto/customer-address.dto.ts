import { IsString, IsOptional, IsBoolean, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping', 
  BOTH = 'both'
}

export class CreateCustomerAddressDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'customer-uuid'
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Address type',
    enum: AddressType,
    example: AddressType.BILLING
  })
  @IsEnum(AddressType)
  addressType: AddressType;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'ABC Corp'
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Full address',
    example: '123 Main Street, Business District'
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City name',
    example: 'Mumbai'
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State name',
    example: 'Maharashtra'
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'PIN code',
    example: '400001'
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN code must be exactly 6 digits' })
  pincode: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India',
    default: 'India'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'GSTIN number',
    example: '22AAAAA0000A1Z5'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { 
    message: 'GSTIN format is invalid' 
  })
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default address',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Created by user ID',
    example: 'user-uuid'
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateCustomerAddressDto extends PartialType(CreateCustomerAddressDto) {}
