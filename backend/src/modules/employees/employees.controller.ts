import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpStatus, 
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService, EmployeeSearchFilters } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee, EmployeeStatus, EmploymentType } from './entities/employee.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Employee created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Employee with ID or email already exists' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    return await this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employees retrieved successfully' })
  async findAll(@Request() req): Promise<Employee[]> {
    // Different roles see different levels of employee information
    const canViewSalary = [UserRole.ADMIN, UserRole.HR].includes(req.user.role);
    return await this.employeesService.findAll(canViewSalary);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Advanced employee search with filters and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, empId, email, phone, designation, department' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department' })
  @ApiQuery({ name: 'designation', required: false, description: 'Filter by designation' })
  @ApiQuery({ name: 'status', required: false, enum: EmployeeStatus, description: 'Filter by employee status' })
  @ApiQuery({ name: 'employmentType', required: false, enum: EmploymentType, description: 'Filter by employment type' })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number, description: 'Minimum salary filter' })
  @ApiQuery({ name: 'salaryMax', required: false, type: Number, description: 'Maximum salary filter' })
  @ApiQuery({ name: 'joiningDateFrom', required: false, description: 'Joining date from (YYYY-MM-DD)' })
  @ApiQuery({ name: 'joiningDateTo', required: false, description: 'Joining date to (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee search results with pagination' })
  async searchEmployees(@Query() filters: EmployeeSearchFilters) {
    return await this.employeesService.findAllWithSearch(filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive employee statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee statistics retrieved successfully' })
  async getStatistics() {
    return await this.employeesService.getStatistics();
  }

  @Get('departments')
  @Public()
  @ApiOperation({ summary: 'Get all available departments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Departments list retrieved successfully' })
  async getDepartments(): Promise<Array<{ value: string; label: string }>> {
    return await this.employeesService.getDepartments();
  }

  @Get('designations')
  @Public()
  @ApiOperation({ summary: 'Get all available designations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Designations list retrieved successfully' })
  async getDesignations(): Promise<Array<{ value: string; label: string }>> {
    return await this.employeesService.getDesignations();
  }

  @Get('designations/:department')
  @Public()
  @ApiOperation({ summary: 'Get designations by department' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Department-specific designations retrieved successfully' })
  async getDesignationsByDepartment(@Param('department') department: string): Promise<Array<{ value: string; label: string }>> {
    return await this.employeesService.getDesignationsByDepartment(department as any);
  }

  @Get('salary-range')
  @ApiOperation({ summary: 'Get salary range (min and max)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Salary range retrieved successfully' })
  async getSalaryRange() {
    return await this.employeesService.getSalaryRange();
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total employee count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee count retrieved successfully' })
  async count(): Promise<{ count: number }> {
    const count = await this.employeesService.count();
    return { count };
  }

  @Get('by-empid/:empId')
  @ApiOperation({ summary: 'Get employee by Employee ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async findByEmpId(@Param('empId') empId: string): Promise<Employee> {
    return await this.employeesService.findByEmpId(empId);
  }

  @Get('by-manager/:managerId')
  @ApiOperation({ summary: 'Get employees by manager ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employees retrieved successfully' })
  async getEmployeesByManager(@Param('managerId', ParseUUIDPipe) managerId: string): Promise<Employee[]> {
    return await this.employeesService.getEmployeesByManager(managerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
    return await this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateEmployeeDto: UpdateEmployeeDto
  ): Promise<Employee> {
    return await this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.employeesService.remove(id);
    return { message: 'Employee deleted successfully' };
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete employees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employees deleted successfully' })
  async bulkDelete(@Body('ids') ids: string[]): Promise<{ message: string }> {
    await this.employeesService.bulkDelete(ids);
    return { message: `${ids.length} employees deleted successfully` };
  }

  @Patch('bulk-status')
  @ApiOperation({ summary: 'Bulk update employee status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee statuses updated successfully' })
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: EmployeeStatus
  ): Promise<{ message: string }> {
    await this.employeesService.bulkUpdateStatus(ids, status);
    return { message: `${ids.length} employees status updated successfully` };
  }
}
