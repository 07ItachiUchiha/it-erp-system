import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestService } from '../modules/hr/services/leave-request.service';
import { PayrollService } from '../modules/hr/services/payroll.service';
import { PerformanceReviewService } from '../modules/hr/services/performance-review.service';
import { AttendanceService } from '../modules/hr/services/attendance.service';
import { ComplianceTrackingService } from '../modules/hr/services/compliance-tracking.service';
import { LeaveRequest } from '../modules/hr/entities/leave-request.entity';
import { Payroll } from '../modules/hr/entities/payroll.entity';
import { PerformanceReview } from '../modules/hr/entities/performance-review.entity';
import { Attendance } from '../modules/hr/entities/attendance.entity';
import { ComplianceTracking } from '../modules/hr/entities/compliance-tracking.entity';
import { Employee } from '../modules/employees/entities/employee.entity';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockReturnValue(Promise.resolve([[], 0])),
  })),
};

describe('HR Module Services', () => {
  let leaveRequestService: LeaveRequestService;
  let payrollService: PayrollService;
  let performanceReviewService: PerformanceReviewService;
  let attendanceService: AttendanceService;
  let complianceTrackingService: ComplianceTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    leaveRequestService = module.get<LeaveRequestService>(LeaveRequestService);
    payrollService = module.get<PayrollService>(PayrollService);
    performanceReviewService = module.get<PerformanceReviewService>(PerformanceReviewService);
    attendanceService = module.get<AttendanceService>(AttendanceService);
    complianceTrackingService = module.get<ComplianceTrackingService>(ComplianceTrackingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should create LeaveRequestService', () => {
      expect(leaveRequestService).toBeDefined();
      expect(leaveRequestService).toBeInstanceOf(LeaveRequestService);
    });

    it('should create PayrollService', () => {
      expect(payrollService).toBeDefined();
      expect(payrollService).toBeInstanceOf(PayrollService);
    });

    it('should create PerformanceReviewService', () => {
      expect(performanceReviewService).toBeDefined();
      expect(performanceReviewService).toBeInstanceOf(PerformanceReviewService);
    });

    it('should create AttendanceService', () => {
      expect(attendanceService).toBeDefined();
      expect(attendanceService).toBeInstanceOf(AttendanceService);
    });

    it('should create ComplianceTrackingService', () => {
      expect(complianceTrackingService).toBeDefined();
      expect(complianceTrackingService).toBeInstanceOf(ComplianceTrackingService);
    });
  });

  describe('Service Methods', () => {
    it('should have findAll method in all services', () => {
      expect(typeof leaveRequestService.findAll).toBe('function');
      expect(typeof payrollService.findAll).toBe('function');
      expect(typeof performanceReviewService.findAll).toBe('function');
      expect(typeof attendanceService.findAll).toBe('function');
      expect(typeof complianceTrackingService.findAll).toBe('function');
    });

    it('should have findOne method in all services', () => {
      expect(typeof leaveRequestService.findOne).toBe('function');
      expect(typeof payrollService.findOne).toBe('function');
      expect(typeof performanceReviewService.findOne).toBe('function');
      expect(typeof attendanceService.findOne).toBe('function');
      expect(typeof complianceTrackingService.findOne).toBe('function');
    });

    it('should have create method in all services', () => {
      expect(typeof leaveRequestService.create).toBe('function');
      expect(typeof payrollService.create).toBe('function');
      expect(typeof performanceReviewService.create).toBe('function');
      expect(typeof attendanceService.create).toBe('function');
      expect(typeof complianceTrackingService.create).toBe('function');
    });

    it('should have update method in all services', () => {
      expect(typeof leaveRequestService.update).toBe('function');
      expect(typeof payrollService.update).toBe('function');
      expect(typeof performanceReviewService.update).toBe('function');
      expect(typeof attendanceService.update).toBe('function');
      expect(typeof complianceTrackingService.update).toBe('function');
    });

    it('should have remove method in all services', () => {
      expect(typeof leaveRequestService.remove).toBe('function');
      expect(typeof payrollService.remove).toBe('function');
      expect(typeof performanceReviewService.remove).toBe('function');
      expect(typeof attendanceService.remove).toBe('function');
      expect(typeof complianceTrackingService.remove).toBe('function');
    });
  });
});
