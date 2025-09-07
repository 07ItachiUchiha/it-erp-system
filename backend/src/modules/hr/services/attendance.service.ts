import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { CreateAttendanceDto, UpdateAttendanceDto, CheckInDto, CheckOutDto, AttendanceFilterDto } from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({ 
      where: { id: createAttendanceDto.employeeId } 
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if attendance already exists for this date
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        date: new Date(createAttendanceDto.date),
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('Attendance already exists for this date');
    }

    // Calculate hours worked if both check-in and check-out times are provided
    let hoursWorked = 0;
    if (createAttendanceDto.checkInTime && createAttendanceDto.checkOutTime) {
      hoursWorked = this.calculateHoursWorked(
        createAttendanceDto.checkInTime, 
        createAttendanceDto.checkOutTime
      );
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      date: new Date(createAttendanceDto.date),
      hoursWorked,
    });

    return await this.attendanceRepository.save(attendance);
  }

  async findAll(filters: AttendanceFilterDto) {
    const { 
      employeeId, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = filters;

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee');

    if (employeeId) {
      queryBuilder.andWhere('attendance.employeeId = :employeeId', { employeeId });
    }

    if (status) {
      queryBuilder.andWhere('attendance.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('attendance.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('attendance.date <= :endDate', { endDate });
    }

    queryBuilder.orderBy('attendance.date', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [attendanceRecords, total] = await queryBuilder.getManyAndCount();

    return {
      data: attendanceRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<Attendance | null> {
    return await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: new Date(date),
      },
      relations: ['employee'],
    });
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);

    // Recalculate hours worked if times are updated
    let hoursWorked = attendance.hoursWorked;
    if (updateAttendanceDto.checkInTime || updateAttendanceDto.checkOutTime) {
      const checkInTime = updateAttendanceDto.checkInTime || attendance.checkInTime;
      const checkOutTime = updateAttendanceDto.checkOutTime || attendance.checkOutTime;
      
      if (checkInTime && checkOutTime) {
        hoursWorked = this.calculateHoursWorked(checkInTime, checkOutTime);
      }
    }

    Object.assign(attendance, updateAttendanceDto, { hoursWorked });
    
    if (updateAttendanceDto.date) {
      attendance.date = new Date(updateAttendanceDto.date);
    }

    return await this.attendanceRepository.save(attendance);
  }

  async checkIn(employeeId: string, checkInDto: CheckInDto): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const existingAttendance = await this.findByEmployeeAndDate(employeeId, today);
    
    if (existingAttendance) {
      if (existingAttendance.checkInTime) {
        throw new BadRequestException('Already checked in today');
      }
      
      // Update existing record with check-in time
      existingAttendance.checkInTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
      existingAttendance.status = AttendanceStatus.PRESENT;
      existingAttendance.ipAddress = checkInDto.ipAddress;
      existingAttendance.location = checkInDto.location;
      existingAttendance.remarks = checkInDto.remarks;
      
      return await this.attendanceRepository.save(existingAttendance);
    }

    // Create new attendance record
    const attendance = this.attendanceRepository.create({
      employeeId,
      date: new Date(today),
      checkInTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: AttendanceStatus.PRESENT,
      ipAddress: checkInDto.ipAddress,
      location: checkInDto.location,
      remarks: checkInDto.remarks,
    });

    return await this.attendanceRepository.save(attendance);
  }

  async checkOut(employeeId: string, checkOutDto: CheckOutDto): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await this.findByEmployeeAndDate(employeeId, today);
    
    if (!attendance) {
      throw new BadRequestException('No check-in record found for today');
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException('Already checked out today');
    }

    const checkOutTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    
    attendance.checkOutTime = checkOutTime;
    attendance.remarks = checkOutDto.remarks || attendance.remarks;
    
    // Calculate hours worked
    if (attendance.checkInTime) {
      attendance.hoursWorked = this.calculateHoursWorked(attendance.checkInTime, checkOutTime);
      
      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8;
      if (attendance.hoursWorked > standardHours) {
        attendance.overtimeHours = attendance.hoursWorked - standardHours;
      }
    }

    return await this.attendanceRepository.save(attendance);
  }

  async remove(id: string): Promise<void> {
    const attendance = await this.findOne(id);
    await this.attendanceRepository.remove(attendance);
  }

  async getEmployeeAttendanceSummary(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    const summary = {
      employeeId,
      month,
      year,
      totalDays: endDate.getDate(),
      workingDays: this.getWorkingDaysInMonth(month, year),
      presentDays: attendanceRecords.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absentDays: attendanceRecords.filter(a => a.status === AttendanceStatus.ABSENT).length,
      lateDays: attendanceRecords.filter(a => a.status === AttendanceStatus.LATE).length,
      halfDays: attendanceRecords.filter(a => a.status === AttendanceStatus.HALF_DAY).length,
      workFromHomeDays: attendanceRecords.filter(a => a.status === AttendanceStatus.WORK_FROM_HOME).length,
      onLeaveDays: attendanceRecords.filter(a => a.status === AttendanceStatus.ON_LEAVE).length,
      totalHoursWorked: attendanceRecords.reduce((sum, a) => sum + Number(a.hoursWorked), 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + Number(a.overtimeHours), 0),
      attendancePercentage: 0,
      records: attendanceRecords,
    };

    // Calculate attendance percentage
    const attendedDays = summary.presentDays + summary.halfDays + summary.workFromHomeDays;
    summary.attendancePercentage = Math.round((attendedDays / summary.workingDays) * 100);

    return summary;
  }

  async getTeamAttendanceSummary(date: string) {
    const targetDate = new Date(date);
    
    const attendanceRecords = await this.attendanceRepository.find({
      where: { date: targetDate },
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });

    const statusCounts = {
      present: attendanceRecords.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendanceRecords.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendanceRecords.filter(a => a.status === AttendanceStatus.LATE).length,
      halfDay: attendanceRecords.filter(a => a.status === AttendanceStatus.HALF_DAY).length,
      workFromHome: attendanceRecords.filter(a => a.status === AttendanceStatus.WORK_FROM_HOME).length,
      onLeave: attendanceRecords.filter(a => a.status === AttendanceStatus.ON_LEAVE).length,
      holiday: attendanceRecords.filter(a => a.status === AttendanceStatus.HOLIDAY).length,
    };

    return {
      date,
      totalEmployees: attendanceRecords.length,
      statusCounts,
      attendancePercentage: attendanceRecords.length > 0 
        ? Math.round(((statusCounts.present + statusCounts.workFromHome) / attendanceRecords.length) * 100)
        : 0,
      records: attendanceRecords,
    };
  }

  private calculateHoursWorked(checkInTime: string, checkOutTime: string): number {
    const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);

    const checkInMinutes = checkInHour * 60 + checkInMinute;
    const checkOutMinutes = checkOutHour * 60 + checkOutMinute;

    const totalMinutes = checkOutMinutes - checkInMinutes;
    return Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
  }

  private getWorkingDaysInMonth(month: number, year: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      // Assuming Saturday (6) and Sunday (0) are weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }
}
