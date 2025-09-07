import { IsNotEmpty, IsEnum, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ComplianceType, ComplianceStatus } from '../entities/compliance-tracking.entity';

export class CreateComplianceTrackingDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: ComplianceType, description: 'Compliance type' })
  @IsNotEmpty()
  @IsEnum(ComplianceType)
  complianceType: ComplianceType;

  @ApiProperty({ description: 'Compliance title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Compliance description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Certificate URL' })
  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateComplianceTrackingDto extends PartialType(CreateComplianceTrackingDto) {}

export class VerifyComplianceDto {
  @ApiProperty({ enum: ComplianceStatus, description: 'Compliance status' })
  @IsNotEmpty()
  @IsEnum(ComplianceStatus)
  status: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Completed date' })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Certificate URL' })
  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ComplianceFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: ComplianceType, description: 'Compliance type' })
  @IsOptional()
  @IsEnum(ComplianceType)
  complianceType?: ComplianceType;

  @ApiPropertyOptional({ enum: ComplianceStatus, description: 'Compliance status' })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Due date start filter' })
  @IsOptional()
  @IsDateString()
  dueDateStart?: string;

  @ApiPropertyOptional({ description: 'Due date end filter' })
  @IsOptional()
  @IsDateString()
  dueDateEnd?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}

export class BulkComplianceDto {
  @ApiProperty({ description: 'Employee IDs' })
  @IsNotEmpty()
  employeeIds: string[];

  @ApiProperty({ enum: ComplianceType, description: 'Compliance type' })
  @IsNotEmpty()
  @IsEnum(ComplianceType)
  complianceType: ComplianceType;

  @ApiProperty({ description: 'Compliance title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Compliance description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
