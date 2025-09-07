import { IsNotEmpty, IsEnum, IsDateString, IsDecimal, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LeaveType, LeaveStatus } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, description: 'Type of leave' })
  @IsNotEmpty()
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: 'Start date of leave' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of leave' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Total number of days' })
  @IsNotEmpty()
  @IsDecimal()
  totalDays: number;

  @ApiPropertyOptional({ description: 'Reason for leave' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Attachment URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) {}

export class ApproveLeaveRequestDto {
  @ApiProperty({ enum: LeaveStatus, description: 'Leave status' })
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional({ description: 'Approver comments' })
  @IsOptional()
  @IsString()
  approverComments?: string;
}

export class LeaveRequestFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: LeaveType, description: 'Leave type' })
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @ApiPropertyOptional({ enum: LeaveStatus, description: 'Leave status' })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}
