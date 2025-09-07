import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, ILike } from 'typeorm';
import { Employee, EmployeeStatus, EmploymentType, Department, Designation } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { getDesignationsByDepartment, formatDesignationLabel, formatDepartmentLabel } from './utils/department-designation-mapping';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

export interface EmployeeSearchFilters {
  search?: string;
  department?: string;
  designation?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeStatistics {
  total: number;
  active: number;
  inactive: number;
  totalSalaryBudget: number;
  averageSalary: number;
  departmentDistribution: Array<{ department: string; count: number; totalSalary: number }>;
  designationDistribution: Array<{ designation: string; count: number; avgSalary: number }>;
  employmentTypeDistribution: Array<{ type: string; count: number }>;
  recentJoinings: Employee[];
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Check if employee with empId or email already exists
    const existingEmployee = await this.employeeRepository.findOne({
      where: [
        { empId: createEmployeeDto.empId },
        { email: createEmployeeDto.email }
      ],
    });

    if (existingEmployee) {
      if (existingEmployee.empId === createEmployeeDto.empId) {
        throw new ConflictException('Employee with this Employee ID already exists');
      }
      if (existingEmployee.email === createEmployeeDto.email) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    // Check if user with this email already exists
    const existingUser = await this.usersService.findByEmail(createEmployeeDto.email);
    
    let user = existingUser;
    
    // If no user exists, create one with default password
    if (!existingUser) {
      const defaultPassword = 'employee123'; // You can make this configurable
      const userRole = this.mapDesignationToRole(createEmployeeDto.designation);
      
      user = await this.usersService.create({
        email: createEmployeeDto.email,
        password: defaultPassword,
        firstName: createEmployeeDto.firstName,
        lastName: createEmployeeDto.lastName,
        role: userRole,
        phone: createEmployeeDto.phone,
        department: createEmployeeDto.department as any,
        designation: createEmployeeDto.designation as any,
      });
    }

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      userId: user.id,
      status: createEmployeeDto.status || EmployeeStatus.ACTIVE,
      employmentType: createEmployeeDto.employmentType || EmploymentType.FULL_TIME,
    });

    return await this.employeeRepository.save(employee);
  }

  private mapDesignationToRole(designation: Designation): UserRole {
    // Map employee designations to user roles
    switch (designation) {
      case Designation.CEO:
      case Designation.CTO:
      case Designation.CFO:
      case Designation.DIRECTOR:
        return UserRole.ADMIN;
      case Designation.HR_MANAGER:
      case Designation.HR_EXECUTIVE:
      case Designation.RECRUITER:
        return UserRole.HR;
      case Designation.MANAGER:
      case Designation.ASSISTANT_MANAGER:
      case Designation.FINANCE_MANAGER:
      case Designation.SALES_MANAGER:
      case Designation.MARKETING_MANAGER:
      case Designation.OPERATIONS_MANAGER:
      case Designation.CUSTOMER_SERVICE_MANAGER:
        return UserRole.MANAGER;
      case Designation.ACCOUNTANT:
      case Designation.ACCOUNTS_EXECUTIVE:
        return UserRole.FINANCE;
      case Designation.SALES_EXECUTIVE:
      case Designation.BUSINESS_DEVELOPMENT_EXECUTIVE:
        return UserRole.SALES;
      default:
        return UserRole.EMPLOYEE;
    }
  }

  async findAll(canViewSalary: boolean = true): Promise<Employee[]> {
    const select = canViewSalary 
      ? undefined 
      : ['id', 'empId', 'firstName', 'lastName', 'email', 'phone', 'department', 'designation', 'employmentType', 'status', 'joiningDate', 'createdAt', 'updatedAt'];
    
    return await this.employeeRepository.find({
      select: select as any,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithSearch(filters: EmployeeSearchFilters): Promise<PaginatedEmployees> {
    const {
      search = '',
      department,
      designation,
      status,
      employmentType,
      salaryMin,
      salaryMax,
      joiningDateFrom,
      joiningDateTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');

    // Search functionality
    if (search) {
      queryBuilder.where(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.empId ILIKE :search OR employee.email ILIKE :search OR employee.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by department
    if (department && department !== 'all') {
      queryBuilder.andWhere('employee.department = :department', { department });
    }

    // Filter by designation
    if (designation && designation !== 'all') {
      queryBuilder.andWhere('employee.designation = :designation', { designation });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('employee.status = :status', { status });
    }

    // Filter by employment type
    if (employmentType) {
      queryBuilder.andWhere('employee.employmentType = :employmentType', { employmentType });
    }

    // Filter by salary range
    if (salaryMin !== undefined && salaryMax !== undefined) {
      queryBuilder.andWhere('employee.salary BETWEEN :salaryMin AND :salaryMax', { salaryMin, salaryMax });
    } else if (salaryMin !== undefined) {
      queryBuilder.andWhere('employee.salary >= :salaryMin', { salaryMin });
    } else if (salaryMax !== undefined) {
      queryBuilder.andWhere('employee.salary <= :salaryMax', { salaryMax });
    }

    // Filter by joining date range
    if (joiningDateFrom && joiningDateTo) {
      queryBuilder.andWhere('employee.joiningDate BETWEEN :joiningDateFrom AND :joiningDateTo', { 
        joiningDateFrom, 
        joiningDateTo 
      });
    } else if (joiningDateFrom) {
      queryBuilder.andWhere('employee.joiningDate >= :joiningDateFrom', { joiningDateFrom });
    } else if (joiningDateTo) {
      queryBuilder.andWhere('employee.joiningDate <= :joiningDateTo', { joiningDateTo });
    }

    // Sorting
    const validSortFields = ['firstName', 'lastName', 'empId', 'email', 'department', 'designation', 'salary', 'joiningDate', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`employee.${sortField}`, sortOrder);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async findByEmpId(empId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { empId } });
    if (!employee) {
      throw new NotFoundException(`Employee with Employee ID ${empId} not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    // Check if empId or email is being updated and if it already exists
    if (updateEmployeeDto.empId && updateEmployeeDto.empId !== employee.empId) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { empId: updateEmployeeDto.empId },
      });
      if (existingEmployee) {
        throw new ConflictException('Employee with this Employee ID already exists');
      }
    }

    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });
      if (existingEmployee) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    // Update employee
    await this.employeeRepository.update(id, updateEmployeeDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  async count(): Promise<number> {
    return await this.employeeRepository.count();
  }

  async getStatistics(): Promise<EmployeeStatistics> {
    const total = await this.count();
    const active = await this.employeeRepository.count({ where: { status: EmployeeStatus.ACTIVE } });
    const inactive = await this.employeeRepository.count({ 
      where: [
        { status: EmployeeStatus.INACTIVE },
        { status: EmployeeStatus.TERMINATED },
        { status: EmployeeStatus.SUSPENDED }
      ] 
    });

    // Salary statistics
    const salaryStats = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('SUM(employee.salary)', 'totalSalary')
      .addSelect('AVG(employee.salary)', 'averageSalary')
      .where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
      .getRawOne();

    const totalSalaryBudget = parseFloat(salaryStats.totalSalary) || 0;
    const averageSalary = parseFloat(salaryStats.averageSalary) || 0;

    // Department distribution
    const departmentDistribution = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(employee.salary)', 'totalSalary')
      .where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
      .groupBy('employee.department')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Designation distribution
    const designationDistribution = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.designation', 'designation')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(employee.salary)', 'avgSalary')
      .where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
      .groupBy('employee.designation')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Employment type distribution
    const employmentTypeDistribution = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.employmentType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('employee.employmentType')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Recent joinings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentJoinings = await this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.joiningDate >= :startDate', { 
        startDate: thirtyDaysAgo.toISOString().split('T')[0] 
      })
      .orderBy('employee.joiningDate', 'DESC')
      .limit(10)
      .getMany();

    return {
      total,
      active,
      inactive,
      totalSalaryBudget,
      averageSalary,
      departmentDistribution: departmentDistribution.map(d => ({
        department: d.department,
        count: parseInt(d.count),
        totalSalary: parseFloat(d.totalSalary) || 0,
      })),
      designationDistribution: designationDistribution.map(d => ({
        designation: d.designation,
        count: parseInt(d.count),
        avgSalary: parseFloat(d.avgSalary) || 0,
      })),
      employmentTypeDistribution: employmentTypeDistribution.map(e => ({
        type: e.type,
        count: parseInt(e.count),
      })),
      recentJoinings,
    };
  }

  async getDepartments(): Promise<Array<{ value: string; label: string }>> {
    const departments = Object.values(Department);
    return departments.map(dept => ({
      value: dept,
      label: formatDepartmentLabel(dept)
    }));
  }

  async getDesignations(): Promise<Array<{ value: string; label: string }>> {
    const designations = Object.values(Designation);
    return designations.map(designation => ({
      value: designation,
      label: formatDesignationLabel(designation)
    }));
  }

  async getDesignationsByDepartment(department: Department): Promise<Array<{ value: string; label: string }>> {
    const designations = getDesignationsByDepartment(department);
    return designations.map(designation => ({
      value: designation,
      label: formatDesignationLabel(designation)
    }));
  }

  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('No employee IDs provided');
    }

    await this.employeeRepository.delete(ids);
  }

  async bulkUpdateStatus(ids: string[], status: EmployeeStatus): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('No employee IDs provided');
    }

    await this.employeeRepository.update(ids, { status });
  }

  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    return await this.employeeRepository.find({
      where: { managerId },
      order: { firstName: 'ASC' },
    });
  }

  async getSalaryRange(): Promise<{ min: number; max: number }> {
    const result = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('MIN(employee.salary)', 'min')
      .addSelect('MAX(employee.salary)', 'max')
      .where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
      .getRawOne();

    return {
      min: parseFloat(result.min) || 0,
      max: parseFloat(result.max) || 0,
    };
  }

  async createEmployeeFromUser(user: any): Promise<Employee> {
    // Create employee record directly for existing user
    // Provide default designation if user doesn't have one
    const defaultDesignation = user.designation || Designation.EXECUTIVE;
    
    const employee = this.employeeRepository.create({
      firstName: user.firstName || 'N/A',
      lastName: user.lastName || 'N/A', 
      email: user.email,
      department: user.department,
      designation: defaultDesignation,
      userId: user.id,
      joiningDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      empId: `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`,
      status: EmployeeStatus.ACTIVE,
      employmentType: EmploymentType.FULL_TIME,
      phone: user.phone || '',
      salary: 0, // Default salary, can be updated later
    });

    return await this.employeeRepository.save(employee);
  }
}
