import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto, ApproveLeaveRequestDto, LeaveRequestFilterDto } from '../dto/leave-request.dto';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto, userEmail: string): Promise<LeaveRequest> {
    console.log('=== LEAVE REQUEST CREATE DEBUG ===');
    console.log('User email received:', userEmail);
    console.log('DTO received:', createLeaveRequestDto);
    
    // Find employee by email
    console.log('Searching for employee with email:', userEmail);
    
    // First check if there are any employees at all
    const allEmployees = await this.employeeRepository.find();
    console.log('Total employees in database:', allEmployees.length);
    console.log('All employee emails:', allEmployees.map(emp => emp.email));
    
    const employee = await this.employeeRepository.findOne({ where: { email: userEmail } });
    console.log('Found employee by email query:', employee);
    
    if (!employee) {
      console.log('No employee found with email:', userEmail);
      throw new NotFoundException('Employee record not found for this user');
    }

    const employeeId = employee.id;
    console.log('Using employeeId:', employeeId);

    // Validate dates
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping leave requests
    const overlappingLeave = await this.leaveRequestRepository.findOne({
      where: {
        employeeId,
        status: LeaveStatus.APPROVED,
        startDate: Between(startDate, endDate),
      },
    });

    if (overlappingLeave) {
      throw new BadRequestException('Leave request overlaps with existing approved leave');
    }

    const leaveRequest = this.leaveRequestRepository.create({
      ...createLeaveRequestDto,
      employeeId,
      startDate,
      endDate,
    });

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async findAll(filters: LeaveRequestFilterDto) {
    const { 
      employeeId, 
      leaveType, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = filters;

    const queryBuilder = this.leaveRequestRepository
      .createQueryBuilder('leaveRequest')
      .leftJoinAndSelect('leaveRequest.employee', 'employee')
      .leftJoinAndSelect('leaveRequest.approver', 'approver');

    if (employeeId) {
      queryBuilder.andWhere('leaveRequest.employeeId = :employeeId', { employeeId });
    }

    if (leaveType) {
      queryBuilder.andWhere('leaveRequest.leaveType = :leaveType', { leaveType });
    }

    if (status) {
      queryBuilder.andWhere('leaveRequest.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('leaveRequest.startDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('leaveRequest.endDate <= :endDate', { endDate });
    }

    queryBuilder.orderBy('leaveRequest.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [leaveRequests, total] = await queryBuilder.getManyAndCount();

    return {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approver'],
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  async findByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.find({
      where: { employeeId },
      relations: ['approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmployeeEmail(userEmail: string): Promise<LeaveRequest[]> {
    // Find employee by email first
    const employee = await this.employeeRepository.findOne({ where: { email: userEmail } });
    if (!employee) {
      throw new NotFoundException('Employee record not found for this user');
    }

    return await this.findByEmployee(employee.id);
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto, employeeId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.employeeId !== employeeId) {
      throw new ForbiddenException('You can only update your own leave requests');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be updated');
    }

    // Validate dates if provided
    if (updateLeaveRequestDto.startDate && updateLeaveRequestDto.endDate) {
      const startDate = new Date(updateLeaveRequestDto.startDate);
      const endDate = new Date(updateLeaveRequestDto.endDate);
      
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(leaveRequest, updateLeaveRequestDto);
    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async approve(id: string, approveLeaveRequestDto: ApproveLeaveRequestDto, approverId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be approved/rejected');
    }

    leaveRequest.status = approveLeaveRequestDto.status;
    leaveRequest.approvedBy = approverId;
    leaveRequest.approvedAt = new Date();
    leaveRequest.approverComments = approveLeaveRequestDto.approverComments;

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async remove(id: string, employeeId: string): Promise<void> {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.employeeId !== employeeId) {
      throw new ForbiddenException('You can only delete your own leave requests');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be deleted');
    }

    await this.leaveRequestRepository.remove(leaveRequest);
  }

  async getLeaveBalance(employeeId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const approvedLeaves = await this.leaveRequestRepository.find({
      where: {
        employeeId,
        status: LeaveStatus.APPROVED,
        startDate: Between(startDate, endDate),
      },
    });

    const totalDaysTaken = approvedLeaves.reduce((total, leave) => total + Number(leave.totalDays), 0);
    
    // Assuming 21 days annual leave
    const annualLeaveEntitlement = 21;
    const remainingDays = annualLeaveEntitlement - totalDaysTaken;

    return {
      year,
      entitlement: annualLeaveEntitlement,
      taken: totalDaysTaken,
      remaining: Math.max(0, remainingDays),
      leaveHistory: approvedLeaves,
    };
  }
}
