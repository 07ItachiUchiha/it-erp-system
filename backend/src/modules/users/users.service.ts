import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus, Department, Designation } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getDesignationsByDepartment, formatDesignationLabel, formatDepartmentLabel } from './utils/department-designation-mapping';
import { EmployeesService } from '../employees/employees.service';

export interface UserSearchFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => EmployeesService))
    private employeesService: EmployeesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    });

    return await this.userRepository.save(user);
  }

  async findAll(includeDetails: boolean = true): Promise<User[]> {
    const select = includeDetails 
      ? undefined 
      : ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'department', 'designation'];
    
    return await this.userRepository.find({
      select: select as any,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithSearch(filters: UserSearchFilters, canViewAllRoles: boolean = true): Promise<PaginatedUsers> {
    const {
      search = '',
      role,
      status,
      department,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Search functionality
    if (search) {
      queryBuilder.where(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by role
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Filter by department
    if (department) {
      queryBuilder.andWhere('user.department ILIKE :department', { department: `%${department}%` });
    }

    // Role-based access control
    if (!canViewAllRoles) {
      // Managers can only see employees and other managers, not admins or HR
      queryBuilder.andWhere('user.role NOT IN (:...restrictedRoles)', { 
        restrictedRoles: [UserRole.ADMIN, UserRole.HR] 
      });
    }

    // Sorting
    const validSortFields = ['firstName', 'lastName', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'status'], // Include password for authentication
    });
  }

  async findUsersWithoutEmployeeRecords(): Promise<User[]> {
    // This query finds users who don't have a corresponding employee record
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('employees', 'employee', 'employee.email = user.email')
      .where('employee.id IS NULL')
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.role', 'user.department', 'user.designation'])
      .getMany();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if being updated
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Update user
    await this.userRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    // Check for related records that would prevent deletion
    const relatedRecords = await this.checkRelatedRecords(id);
    
    if (relatedRecords.hasRelated) {
      throw new Error(
        `Cannot delete user. User has related records: ${relatedRecords.relations.join(', ')}. ` +
        'Please use soft delete instead or reassign/delete related records first.'
      );
    }
    
    await this.userRepository.remove(user);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.userRepository.restore(id);
  }

  async forceDelete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id }, 
      withDeleted: true 
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await this.userRepository.remove(user);
  }

  private async checkRelatedRecords(userId: string): Promise<{ hasRelated: boolean; relations: string[] }> {
    const relations: string[] = [];
    
    // Check procurement requests
    const procurementRequests = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM procurement_requests WHERE "requesterId" = $1 OR "approverId" = $1',
      [userId]
    );
    if (parseInt(procurementRequests[0].count) > 0) {
      relations.push(`${procurementRequests[0].count} procurement request(s)`);
    }
    
    // Check projects as manager
    const projectsAsManager = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM projects WHERE "managerId" = $1',
      [userId]
    );
    if (parseInt(projectsAsManager[0].count) > 0) {
      relations.push(`${projectsAsManager[0].count} project(s) as manager`);
    }
    
    // Check project team members
    const projectTeamMembers = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM project_team_members WHERE "userId" = $1',
      [userId]
    );
    if (parseInt(projectTeamMembers[0].count) > 0) {
      relations.push(`${projectTeamMembers[0].count} project team membership(s)`);
    }
    
    // Check leads
    const leads = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM leads WHERE "assignedToId" = $1 OR "createdById" = $1',
      [userId]
    );
    if (parseInt(leads[0].count) > 0) {
      relations.push(`${leads[0].count} lead(s)`);
    }
    
    // Check customers
    const customers = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM customers WHERE "accountManagerId" = $1 OR "createdById" = $1',
      [userId]
    );
    if (parseInt(customers[0].count) > 0) {
      relations.push(`${customers[0].count} customer(s)`);
    }
    
    // Check opportunities
    const opportunities = await this.userRepository.manager.query(
      'SELECT COUNT(*) as count FROM opportunities WHERE "ownerId" = $1 OR "createdById" = $1',
      [userId]
    );
    if (parseInt(opportunities[0].count) > 0) {
      relations.push(`${opportunities[0].count} opportunit(y/ies)`);
    }
    
    return {
      hasRelated: relations.length > 0,
      relations
    };
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }

  async getStatistics(): Promise<any> {
    const total = await this.count();
    const activeUsers = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const inactiveUsers = await this.userRepository.count({ where: { status: UserStatus.INACTIVE } });
    const suspendedUsers = await this.userRepository.count({ where: { status: UserStatus.SUSPENDED } });

    const roleDistribution = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role, COUNT(*) as count')
      .groupBy('user.role')
      .getRawMany();

    const departmentDistribution = await this.userRepository
      .createQueryBuilder('user')
      .select('user.department, COUNT(*) as count')
      .where('user.department IS NOT NULL')
      .groupBy('user.department')
      .getRawMany();

    return {
      total,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      roleDistribution,
      departmentDistribution,
    };
  }

  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    await this.userRepository.delete(ids);
  }

  async bulkUpdateStatus(ids: string[], status: UserStatus): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    await this.userRepository.update(ids, { status });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
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

  async syncWithEmployees(): Promise<{ 
    synchronized: number; 
    created: number; 
    errors: Array<{ userId: string; error: string }> 
  }> {
    const usersWithoutEmployees = await this.findUsersWithoutEmployeeRecords();
    const results = {
      synchronized: 0,
      created: 0,
      errors: []
    };

    for (const user of usersWithoutEmployees) {
      try {
        // Create employee record for user using the service's direct repository access
        // This bypasses the automatic user creation in the create method
        await this.employeesService.createEmployeeFromUser(user);
        results.created++;
        results.synchronized++;
      } catch (error) {
        results.errors.push({
          userId: user.id,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return results;
  }
}
