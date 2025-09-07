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
import { PerformanceReviewService } from '../services/performance-review.service';
import { 
  CreatePerformanceReviewDto, 
  UpdatePerformanceReviewDto, 
  PerformanceReviewFilterDto 
} from '../dto/performance-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Performance Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/performance-reviews')
export class PerformanceReviewController {
  constructor(private readonly performanceReviewService: PerformanceReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new performance review' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Performance review created successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async create(@Body() createPerformanceReviewDto: CreatePerformanceReviewDto, @Request() req) {
    return await this.performanceReviewService.create(createPerformanceReviewDto, req.user.employeeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all performance reviews with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance reviews retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async findAll(@Query() filters: PerformanceReviewFilterDto) {
    return await this.performanceReviewService.findAll(filters);
  }

  @Get('my-reviews')
  @ApiOperation({ summary: 'Get current user performance reviews' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User performance reviews retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async getMyReviews(@Request() req) {
    return await this.performanceReviewService.findByEmployee(req.user.employeeId);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get performance reviews for a specific employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee performance reviews retrieved successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async getEmployeeReviews(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return await this.performanceReviewService.findByEmployee(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific performance review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance review retrieved successfully' })
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const review = await this.performanceReviewService.findOne(id);
    // Employees can only view their own reviews or reviews they're reviewing
    if (req.user.role === UserRole.EMPLOYEE && 
        review.employee.id !== req.user.employeeId && 
        review.reviewer?.id !== req.user.employeeId) {
      throw new Error('Unauthorized to view this performance review');
    }
    return review;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a performance review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance review updated successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePerformanceReviewDto: UpdatePerformanceReviewDto,
    @Request() req,
  ) {
    return await this.performanceReviewService.update(id, updatePerformanceReviewDto, req.user.employeeId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a performance review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance review completed successfully' })
  @Roles(UserRole.HR, UserRole.MANAGER, UserRole.ADMIN)
  async complete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.performanceReviewService.complete(id, req.user.employeeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a performance review' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Performance review deleted successfully' })
  @Roles(UserRole.HR, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.performanceReviewService.remove(id, req.user.employeeId);
  }
}
