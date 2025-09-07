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
import { AttendanceService } from '../services/attendance.service';
import { 
  CreateAttendanceDto, 
  UpdateAttendanceDto, 
  AttendanceFilterDto 
} from '../dto/attendance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attendance record' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Attendance record created successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return await this.attendanceService.create(createAttendanceDto);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Check in for the current user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Checked in successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async checkIn(@Request() req, @Body() checkInDto: any) {
    return await this.attendanceService.checkIn(req.user.employeeId, checkInDto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out for the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Checked out successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async checkOut(@Request() req, @Body() checkOutDto: any) {
    return await this.attendanceService.checkOut(req.user.employeeId, checkOutDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendance records with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance records retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async findAll(@Query() filters: AttendanceFilterDto) {
    return await this.attendanceService.findAll(filters);
  }

  @Get('employee/:employeeId/:date')
  @ApiOperation({ summary: 'Get attendance record for a specific employee and date' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee attendance record retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getEmployeeAttendanceByDate(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('date') date: string,
  ) {
    return await this.attendanceService.findByEmployeeAndDate(employeeId, date);
  }

  @Get('summary/:employeeId/:month/:year')
  @ApiOperation({ summary: 'Get attendance summary for an employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance summary retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getAttendanceSummary(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('month') month: number,
    @Param('year') year: number,
  ) {
    return await this.attendanceService.getEmployeeAttendanceSummary(employeeId, month, year);
  }

  @Get('team-summary/:date')
  @ApiOperation({ summary: 'Get team attendance summary for a specific date' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team attendance summary retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getTeamAttendanceSummary(@Param('date') date: string) {
    return await this.attendanceService.getTeamAttendanceSummary(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific attendance record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance record retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const attendance = await this.attendanceService.findOne(id);
    // Employees can only view their own attendance
    if (req.user.role === UserRole.EMPLOYEE && attendance.employee.id !== req.user.employeeId) {
      throw new Error('Unauthorized to view this attendance record');
    }
    return attendance;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attendance record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance record updated successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return await this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Attendance record deleted successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attendanceService.remove(id);
  }
}
