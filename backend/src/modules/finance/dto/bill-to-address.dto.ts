import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BillToAddressDto {
  @ApiProperty({
    description: 'Name for billing address',
    example: 'ABC Corporation Ltd'
  })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({
    description: 'Complete billing address',
    example: '123 Business Street, CBD Belapur, Navi Mumbai, Maharashtra 400614'
  })
  @IsString()
  @Length(1, 1000)
  address: string;

  @ApiPropertyOptional({
    description: 'GSTIN for billing entity (15 characters)',
    example: '27AAAAA0000A1Z5'
  })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'GSTIN must be in valid format (15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric)'
  })
  gstin?: string;
}
