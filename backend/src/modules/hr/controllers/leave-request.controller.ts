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
import { LeaveRequestService } from '../services/leave-request.service';
import { 
  CreateLeaveRequestDto, 
  UpdateLeaveRequestDto, 
  ApproveLeaveRequestDto,
  LeaveRequestFilterDto 
} from '../dto/leave-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Leave request created successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @Request() req) {
    console.log('=== CONTROLLER: Leave request creation started ===');
    console.log('Controller received DTO:', createLeaveRequestDto);
    console.log('Controller user email:', req.user.email);
    console.log('Controller user object:', req.user);
    
    try {
      const result = await this.leaveRequestService.create(createLeaveRequestDto, req.user.email);
      console.log('Controller service call successful:', result);
      return result;
    } catch (error) {
      console.log('Controller service call failed:', error.message);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all leave requests with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave requests retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async findAll(@Query() filters: LeaveRequestFilterDto) {
    return await this.leaveRequestService.findAll(filters);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get current user leave requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User leave requests retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async getMyRequests(@Request() req) {
    return await this.leaveRequestService.findByEmployeeEmail(req.user.email);
  }

  @Get('balance/:year')
  @ApiOperation({ summary: 'Get leave balance for a specific year' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave balance retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async getLeaveBalance(@Param('year') year: number, @Request() req) {
    return await this.leaveRequestService.getLeaveBalance(req.user.employeeId, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific leave request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave request retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.leaveRequestService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a leave request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave request updated successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
    @Request() req,
  ) {
    return await this.leaveRequestService.update(id, updateLeaveRequestDto, req.user.employeeId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leave request approved/rejected successfully' })
  @Roles(UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveLeaveRequestDto: ApproveLeaveRequestDto,
    @Request() req,
  ) {
    return await this.leaveRequestService.approve(id, approveLeaveRequestDto, req.user.employeeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a leave request' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Leave request deleted successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.leaveRequestService.remove(id, req.user.employeeId);
  }
}
