import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Request,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from '../services/payroll.service';
import { 
  CreatePayrollDto, 
  UpdatePayrollDto, 
  PayrollFilterDto 
} from '../dto/payroll.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/payrolls')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payroll record' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payroll record created successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async create(@Body() createPayrollDto: CreatePayrollDto) {
    return await this.payrollService.create(createPayrollDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payroll records with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payroll records retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async findAll(@Query() filters: PayrollFilterDto) {
    return await this.payrollService.findAll(filters);
  }

  @Get('my-payroll')
  @ApiOperation({ summary: 'Get current user payroll records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User payroll records retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async getMyPayroll(@Request() req, @Query('year') year?: number) {
    return await this.payrollService.findByEmployee(req.user.employeeId, year);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get payroll records for a specific employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee payroll records retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getEmployeePayroll(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('year') year?: number,
  ) {
    return await this.payrollService.findByEmployee(employeeId, year);
  }

  @Get('summary/:payPeriod')
  @ApiOperation({ summary: 'Get payroll summary for a specific pay period' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payroll summary retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getPayrollSummary(@Param('payPeriod') payPeriod: string) {
    return await this.payrollService.getPayrollSummary(payPeriod);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payroll record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payroll record retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const payroll = await this.payrollService.findOne(id);
    // Employees can only view their own payroll
    if (req.user.role === UserRole.EMPLOYEE && payroll.employee.id !== req.user.employeeId) {
      throw new Error('Unauthorized to view this payroll record');
    }
    return payroll;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payroll record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payroll record updated successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
  ) {
    return await this.payrollService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payroll record' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Payroll record deleted successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.payrollService.remove(id);
  }
}
