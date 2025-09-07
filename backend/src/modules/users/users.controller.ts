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
  UseGuards,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  Request,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UserSearchFilters } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully' })
  async findAll(@Request() req): Promise<User[]> {
    // Employees can only see basic user info, not detailed data
    const includeDetails = [UserRole.ADMIN, UserRole.HR, UserRole.MANAGER].includes(req.user.role);
    return await this.usersService.findAll(includeDetails);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Search users with advanced filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, email, phone' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role' })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus, description: 'Filter by user status' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users search results' })
  async searchUsers(@Query() filters: UserSearchFilters, @Request() req) {
    // Limit search capabilities based on role
    const canViewAllRoles = [UserRole.ADMIN, UserRole.HR].includes(req.user.role);
    return await this.usersService.findAllWithSearch(filters, canViewAllRoles);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User statistics retrieved successfully' })
  async getStatistics() {
    return await this.usersService.getStatistics();
  }

  @Get('count')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get total user count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User count retrieved successfully' })
  async count(): Promise<{ count: number }> {
    const count = await this.usersService.count();
    return { count };
  }

  @Get('departments')
  @Public()
  @ApiOperation({ summary: 'Get all available departments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Departments retrieved successfully' })
  async getDepartments(): Promise<Array<{ value: string; label: string }>> {
    return this.usersService.getDepartments();
  }

  @Get('designations')
  @Public()
  @ApiOperation({ summary: 'Get all available designations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Designations retrieved successfully' })
  async getDesignations(): Promise<Array<{ value: string; label: string }>> {
    return this.usersService.getDesignations();
  }

  @Get('designations/:department')
  @Public()
  @ApiOperation({ summary: 'Get designations by department' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Department-specific designations retrieved successfully' })
  async getDesignationsByDepartment(@Param('department') department: string): Promise<Array<{ value: string; label: string }>> {
    return this.usersService.getDesignationsByDepartment(department as any);
  }

  @Get('available-for-employee-creation')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Get users that can be converted to employees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available users retrieved successfully' })
  async getUsersWithoutEmployeeRecords(): Promise<User[]> {
    return await this.usersService.findUsersWithoutEmployeeRecords();
  }

  @Post('sync-with-employees')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Sync existing users with employee records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sync completed successfully' })
  async syncUsersWithEmployees(): Promise<{ 
    message: string; 
    synchronized: number; 
    created: number; 
    errors: Array<{ userId: string; error: string }> 
  }> {
    const result = await this.usersService.syncWithEmployees();
    return {
      message: `Synchronization completed. Created ${result.created} employee records for existing users.`,
      synchronized: result.synchronized,
      created: result.created,
      errors: result.errors
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return await this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (hard delete)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete user with related records' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    try {
      await this.usersService.remove(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.message.includes('related records')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Soft delete user (keeps user data but marks as deleted)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User soft deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.softDelete(id);
    return { message: 'User soft deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.restore(id);
    return { message: 'User restored successfully' };
  }

  @Delete(':id/force')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Force delete user (admin only - permanently removes user even if soft deleted)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User force deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async forceDelete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.forceDelete(id);
    return { message: 'User force deleted successfully' };
  }

  @Post('bulk-delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users deleted successfully' })
  async bulkDelete(@Body('ids') ids: string[]): Promise<{ message: string }> {
    await this.usersService.bulkDelete(ids);
    return { message: `${ids.length} users deleted successfully` };
  }

  @Patch('bulk-status')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Bulk update user status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User statuses updated successfully' })
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: UserStatus
  ): Promise<{ message: string }> {
    await this.usersService.bulkUpdateStatus(ids, status);
    return { message: `${ids.length} users status updated successfully` };
  }
}
