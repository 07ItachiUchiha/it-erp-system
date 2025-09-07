import { IsNotEmpty, IsString, IsDecimal, IsOptional, IsInt, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PayrollStatus } from '../entities/payroll.entity';

export class CreatePayrollDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Pay period (YYYY-MM format)' })
  @IsNotEmpty()
  @IsString()
  payPeriod: string;

  @ApiProperty({ description: 'Basic salary amount' })
  @IsNotEmpty()
  @IsDecimal()
  basicSalary: number;

  @ApiPropertyOptional({ description: 'Allowances amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  allowances?: number;

  @ApiPropertyOptional({ description: 'Overtime amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  overtime?: number;

  @ApiPropertyOptional({ description: 'Bonus amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  bonus?: number;

  @ApiPropertyOptional({ description: 'Commission amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  commission?: number;

  @ApiPropertyOptional({ description: 'Deductions amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  deductions?: number;

  @ApiPropertyOptional({ description: 'Tax deduction amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  taxDeduction?: number;

  @ApiPropertyOptional({ description: 'Provident fund amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  providentFund?: number;

  @ApiPropertyOptional({ description: 'Insurance amount', default: 0 })
  @IsOptional()
  @IsDecimal()
  insurance?: number;

  @ApiPropertyOptional({ description: 'Working days in month', default: 0 })
  @IsOptional()
  @IsInt()
  workingDays?: number;

  @ApiPropertyOptional({ description: 'Actual working days', default: 0 })
  @IsOptional()
  @IsInt()
  actualWorkingDays?: number;

  @ApiPropertyOptional({ description: 'Overtime hours', default: 0 })
  @IsOptional()
  @IsDecimal()
  overtimeHours?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {}

export class ProcessPayrollDto {
  @ApiProperty({ enum: PayrollStatus, description: 'Payroll status' })
  @IsNotEmpty()
  @IsEnum(PayrollStatus)
  status: PayrollStatus;

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayrollFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Pay period' })
  @IsOptional()
  @IsString()
  payPeriod?: string;

  @ApiPropertyOptional({ enum: PayrollStatus, description: 'Payroll status' })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @ApiPropertyOptional({ description: 'Start period filter' })
  @IsOptional()
  @IsString()
  startPeriod?: string;

  @ApiPropertyOptional({ description: 'End period filter' })
  @IsOptional()
  @IsString()
  endPeriod?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}
