import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GstValidationDto {
  @ApiPropertyOptional({ description: 'Single GSTIN to validate' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ description: 'Multiple GSTINs to validate' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gstins?: string[];
}
