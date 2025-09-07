import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { LeaveRequest } from './entities/leave-request.entity';
import { Payroll } from './entities/payroll.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { Attendance } from './entities/attendance.entity';
import { ComplianceTracking } from './entities/compliance-tracking.entity';
import { Employee } from '../employees/entities/employee.entity';

// Services
import {
  LeaveRequestService,
  PayrollService,
  PerformanceReviewService,
  AttendanceService,
  ComplianceTrackingService,
} from './services';

// Controllers
import {
  LeaveRequestController,
  PayrollController,
  PerformanceReviewController,
  AttendanceController,
  ComplianceTrackingController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveRequest,
      Payroll,
      PerformanceReview,
      Attendance,
      ComplianceTracking,
      Employee,
    ]),
  ],
  controllers: [
    LeaveRequestController,
    PayrollController,
    PerformanceReviewController,
    AttendanceController,
    ComplianceTrackingController,
  ],
  providers: [
    LeaveRequestService,
    PayrollService,
    PerformanceReviewService,
    AttendanceService,
    ComplianceTrackingService,
  ],
  exports: [
    LeaveRequestService,
    PayrollService,
    PerformanceReviewService,
    AttendanceService,
    ComplianceTrackingService,
  ],
})
export class HrModule {}
