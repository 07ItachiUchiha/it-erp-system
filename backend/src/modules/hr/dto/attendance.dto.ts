import { IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString, IsDecimal, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance.entity';

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Attendance date' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Check-in time (HH:MM format)' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Check-out time (HH:MM format)' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {}

export class CheckInDto {
  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

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
