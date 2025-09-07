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
import { ComplianceTrackingService } from '../services/compliance-tracking.service';
import { 
  CreateComplianceTrackingDto, 
  UpdateComplianceTrackingDto, 
  ComplianceFilterDto 
} from '../dto/compliance-tracking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Compliance Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/compliance-tracking')
export class ComplianceTrackingController {
  constructor(private readonly complianceTrackingService: ComplianceTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new compliance tracking record' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Compliance tracking record created successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async create(@Body() createComplianceTrackingDto: CreateComplianceTrackingDto) {
    return await this.complianceTrackingService.create(createComplianceTrackingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all compliance tracking records with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compliance tracking records retrieved successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async findAll(@Query() filters: ComplianceFilterDto) {
    return await this.complianceTrackingService.findAll(filters);
  }

  @Get('my-compliance')
  @ApiOperation({ summary: 'Get current user compliance tracking records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User compliance tracking records retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async getMyCompliance(@Request() req) {
    return await this.complianceTrackingService.findByEmployee(req.user.employeeId);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get compliance tracking records for a specific employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee compliance tracking records retrieved successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async getEmployeeCompliance(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.complianceTrackingService.findByEmployee(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific compliance tracking record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compliance tracking record retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const compliance = await this.complianceTrackingService.findOne(id);
    // Employees can only view their own compliance records
    if (req.user.role === UserRole.EMPLOYEE && compliance.employee.id !== req.user.employeeId) {
      throw new Error('Unauthorized to view this compliance record');
    }
    return compliance;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a compliance tracking record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compliance tracking record updated successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplianceTrackingDto: UpdateComplianceTrackingDto,
  ) {
    return await this.complianceTrackingService.update(id, updateComplianceTrackingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a compliance tracking record' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Compliance tracking record deleted successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.complianceTrackingService.remove(id);
  }
}
