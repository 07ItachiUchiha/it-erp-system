import { Test, TestingModule } from '@nestjs/testing';
import { HrModule } from '../modules/hr/hr.module';
import { LeaveRequestService } from '../modules/hr/services/leave-request.service';
import { PayrollService } from '../modules/hr/services/payroll.service';
import { PerformanceReviewService } from '../modules/hr/services/performance-review.service';
import { AttendanceService } from '../modules/hr/services/attendance.service';
import { ComplianceTrackingService } from '../modules/hr/services/compliance-tracking.service';
import { LeaveRequestController } from '../modules/hr/controllers/leave-request.controller';
import { PayrollController } from '../modules/hr/controllers/payroll.controller';
import { PerformanceReviewController } from '../modules/hr/controllers/performance-review.controller';
import { AttendanceController } from '../modules/hr/controllers/attendance.controller';
import { ComplianceTrackingController } from '../modules/hr/controllers/compliance-tracking.controller';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaveRequest } from '../modules/hr/entities/leave-request.entity';
import { Payroll } from '../modules/hr/entities/payroll.entity';
import { PerformanceReview } from '../modules/hr/entities/performance-review.entity';
import { Attendance } from '../modules/hr/entities/attendance.entity';
import { ComplianceTracking } from '../modules/hr/entities/compliance-tracking.entity';
import { Employee } from '../modules/employees/entities/employee.entity';

describe('HR Module Unit Tests', () => {
  let app: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
        {
          provide: getRepositoryToken(LeaveRequest),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Payroll),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PerformanceReview),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ComplianceTracking),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockRepository,
        },
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
    const leaveRequestService = app.get(LeaveRequestService);
    const payrollService = app.get(PayrollService);
    const performanceReviewService = app.get(PerformanceReviewService);
    const attendanceService = app.get(AttendanceService);
    const complianceTrackingService = app.get(ComplianceTrackingService);

    expect(leaveRequestService).toBeDefined();
    expect(payrollService).toBeDefined();
    expect(performanceReviewService).toBeDefined();
    expect(attendanceService).toBeDefined();
    expect(complianceTrackingService).toBeDefined();
  });

  it('should provide HR controllers', () => {
    const leaveRequestController = app.get(LeaveRequestController);
    const payrollController = app.get(PayrollController);
    const performanceReviewController = app.get(PerformanceReviewController);
    const attendanceController = app.get(AttendanceController);
    const complianceTrackingController = app.get(ComplianceTrackingController);

    expect(leaveRequestController).toBeDefined();
    expect(payrollController).toBeDefined();
    expect(performanceReviewController).toBeDefined();
    expect(attendanceController).toBeDefined();
    expect(complianceTrackingController).toBeDefined();
  });

  it('should test LeaveRequestService basic operations', async () => {
    const service = app.get(LeaveRequestService);
    
    const filters = {};
    const result = await service.findAll(filters);
    expect(result).toEqual({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('should test PayrollService basic operations', async () => {
    const service = app.get(PayrollService);
    
    const filters = {};
    const result = await service.findAll(filters);
    expect(result).toEqual({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('should test PerformanceReviewService basic operations', async () => {
    const service = app.get(PerformanceReviewService);
    
    const filters = {};
    const result = await service.findAll(filters);
    expect(result).toEqual({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('should test AttendanceService basic operations', async () => {
    const service = app.get(AttendanceService);
    
    const filters = {};
    const result = await service.findAll(filters);
    expect(result).toEqual({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('should test ComplianceTrackingService basic operations', async () => {
    const service = app.get(ComplianceTrackingService);
    
    const filters = {};
    const result = await service.findAll(filters);
    expect(result).toEqual({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });
});
