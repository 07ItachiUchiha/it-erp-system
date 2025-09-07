import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrModule } from '../modules/hr/hr.module';
import { EmployeesModule } from '../modules/employees/employees.module';
import { DatabaseModule } from '../database/database.module';

describe('HR Module Integration', () => {
  let app: TestingModule;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        HrModule,
      ],
    }).compile();

    app = moduleFixture;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should compile HR module successfully', () => {
    expect(app).toBeDefined();
  });

  it('should provide HR services', () => {
    const leaveRequestService = app.get('LeaveRequestService');
    const payrollService = app.get('PayrollService');
    const performanceReviewService = app.get('PerformanceReviewService');
    const attendanceService = app.get('AttendanceService');
    const complianceTrackingService = app.get('ComplianceTrackingService');

    expect(leaveRequestService).toBeDefined();
    expect(payrollService).toBeDefined();
    expect(performanceReviewService).toBeDefined();
    expect(attendanceService).toBeDefined();
    expect(complianceTrackingService).toBeDefined();
  });

  it('should provide HR controllers', () => {
    const leaveRequestController = app.get('LeaveRequestController');
    const payrollController = app.get('PayrollController');
    const performanceReviewController = app.get('PerformanceReviewController');
    const attendanceController = app.get('AttendanceController');
    const complianceTrackingController = app.get('ComplianceTrackingController');

    expect(leaveRequestController).toBeDefined();
    expect(payrollController).toBeDefined();
    expect(performanceReviewController).toBeDefined();
    expect(attendanceController).toBeDefined();
    expect(complianceTrackingController).toBeDefined();
  });
});
