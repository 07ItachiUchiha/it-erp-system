import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ComplianceTracking, ComplianceStatus } from '../entities/compliance-tracking.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { 
  CreateComplianceTrackingDto, 
  UpdateComplianceTrackingDto, 
  VerifyComplianceDto, 
  ComplianceFilterDto,
  BulkComplianceDto 
} from '../dto/compliance-tracking.dto';

@Injectable()
export class ComplianceTrackingService {
  constructor(
    @InjectRepository(ComplianceTracking)
    private complianceTrackingRepository: Repository<ComplianceTracking>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createComplianceTrackingDto: CreateComplianceTrackingDto): Promise<ComplianceTracking> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({ 
      where: { id: createComplianceTrackingDto.employeeId } 
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const compliance = this.complianceTrackingRepository.create({
      ...createComplianceTrackingDto,
      dueDate: createComplianceTrackingDto.dueDate ? new Date(createComplianceTrackingDto.dueDate) : null,
      expiryDate: createComplianceTrackingDto.expiryDate ? new Date(createComplianceTrackingDto.expiryDate) : null,
    });

    return await this.complianceTrackingRepository.save(compliance);
  }

  async findAll(filters: ComplianceFilterDto) {
    const { 
      employeeId, 
      complianceType, 
      status, 
      dueDateStart, 
      dueDateEnd, 
      page = 1, 
      limit = 10 
    } = filters;

    const queryBuilder = this.complianceTrackingRepository
      .createQueryBuilder('compliance')
      .leftJoinAndSelect('compliance.employee', 'employee')
      .leftJoinAndSelect('compliance.verifier', 'verifier');

    if (employeeId) {
      queryBuilder.andWhere('compliance.employeeId = :employeeId', { employeeId });
    }

    if (complianceType) {
      queryBuilder.andWhere('compliance.complianceType = :complianceType', { complianceType });
    }

    if (status) {
      queryBuilder.andWhere('compliance.status = :status', { status });
    }

    if (dueDateStart) {
      queryBuilder.andWhere('compliance.dueDate >= :dueDateStart', { dueDateStart });
    }

    if (dueDateEnd) {
      queryBuilder.andWhere('compliance.dueDate <= :dueDateEnd', { dueDateEnd });
    }

    queryBuilder.orderBy('compliance.dueDate', 'ASC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [complianceRecords, total] = await queryBuilder.getManyAndCount();

    return {
      data: complianceRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ComplianceTracking> {
    const compliance = await this.complianceTrackingRepository.findOne({
      where: { id },
      relations: ['employee', 'verifier'],
    });

    if (!compliance) {
      throw new NotFoundException('Compliance record not found');
    }

    return compliance;
  }

  async findByEmployee(employeeId: string): Promise<ComplianceTracking[]> {
    return await this.complianceTrackingRepository.find({
      where: { employeeId },
      relations: ['verifier'],
      order: { dueDate: 'ASC' },
    });
  }

  async update(id: string, updateComplianceTrackingDto: UpdateComplianceTrackingDto): Promise<ComplianceTracking> {
    const compliance = await this.findOne(id);

    Object.assign(compliance, updateComplianceTrackingDto);
    
    if (updateComplianceTrackingDto.dueDate) {
      compliance.dueDate = new Date(updateComplianceTrackingDto.dueDate);
    }

    if (updateComplianceTrackingDto.expiryDate) {
      compliance.expiryDate = new Date(updateComplianceTrackingDto.expiryDate);
    }

    return await this.complianceTrackingRepository.save(compliance);
  }

  async verify(id: string, verifyComplianceDto: VerifyComplianceDto, verifierId: string): Promise<ComplianceTracking> {
    const compliance = await this.findOne(id);

    compliance.status = verifyComplianceDto.status;
    compliance.verifiedBy = verifierId;
    compliance.verifiedAt = new Date();

    if (verifyComplianceDto.completedDate) {
      compliance.completedDate = new Date(verifyComplianceDto.completedDate);
    }

    if (verifyComplianceDto.documentUrl) {
      compliance.documentUrl = verifyComplianceDto.documentUrl;
    }

    if (verifyComplianceDto.certificateUrl) {
      compliance.certificateUrl = verifyComplianceDto.certificateUrl;
    }

    if (verifyComplianceDto.notes) {
      compliance.notes = verifyComplianceDto.notes;
    }

    return await this.complianceTrackingRepository.save(compliance);
  }

  async remove(id: string): Promise<void> {
    const compliance = await this.findOne(id);
    await this.complianceTrackingRepository.remove(compliance);
  }

  async createBulkCompliance(bulkComplianceDto: BulkComplianceDto): Promise<ComplianceTracking[]> {
    // Validate all employees exist
    const employees = await this.employeeRepository.findBy({
      id: In(bulkComplianceDto.employeeIds),
    });

    if (employees.length !== bulkComplianceDto.employeeIds.length) {
      throw new BadRequestException('One or more employees not found');
    }

    const complianceRecords: ComplianceTracking[] = [];

    for (const employeeId of bulkComplianceDto.employeeIds) {
      // Check if compliance already exists for this employee and type
      const existingCompliance = await this.complianceTrackingRepository.findOne({
        where: {
          employeeId,
          complianceType: bulkComplianceDto.complianceType,
          title: bulkComplianceDto.title,
        },
      });

      if (!existingCompliance) {
        const compliance = this.complianceTrackingRepository.create({
          employeeId,
          complianceType: bulkComplianceDto.complianceType,
          title: bulkComplianceDto.title,
          description: bulkComplianceDto.description,
          dueDate: bulkComplianceDto.dueDate ? new Date(bulkComplianceDto.dueDate) : null,
        });

        const savedCompliance = await this.complianceTrackingRepository.save(compliance);
        complianceRecords.push(savedCompliance);
      }
    }

    return complianceRecords;
  }

  async getDueSoonCompliance(days: number = 30): Promise<ComplianceTracking[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await this.complianceTrackingRepository.find({
      where: {
        status: ComplianceStatus.PENDING,
        dueDate: Between(today, futureDate),
      },
      relations: ['employee'],
      order: { dueDate: 'ASC' },
    });
  }

  async getOverdueCompliance(): Promise<ComplianceTracking[]> {
    const today = new Date();

    return await this.complianceTrackingRepository
      .createQueryBuilder('compliance')
      .leftJoinAndSelect('compliance.employee', 'employee')
      .where('compliance.status = :status', { status: ComplianceStatus.PENDING })
      .andWhere('compliance.dueDate < :today', { today })
      .orderBy('compliance.dueDate', 'ASC')
      .getMany();
  }

  async getExpiringCompliance(days: number = 30): Promise<ComplianceTracking[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await this.complianceTrackingRepository.find({
      where: {
        status: ComplianceStatus.COMPLETED,
        expiryDate: Between(today, futureDate),
      },
      relations: ['employee'],
      order: { expiryDate: 'ASC' },
    });
  }

  async getComplianceSummary(employeeId?: string) {
    const queryBuilder = this.complianceTrackingRepository
      .createQueryBuilder('compliance')
      .leftJoinAndSelect('compliance.employee', 'employee');

    if (employeeId) {
      queryBuilder.where('compliance.employeeId = :employeeId', { employeeId });
    }

    const allCompliance = await queryBuilder.getMany();

    const summary = {
      total: allCompliance.length,
      pending: allCompliance.filter(c => c.status === ComplianceStatus.PENDING).length,
      completed: allCompliance.filter(c => c.status === ComplianceStatus.COMPLETED).length,
      expired: allCompliance.filter(c => c.status === ComplianceStatus.EXPIRED).length,
      notApplicable: allCompliance.filter(c => c.status === ComplianceStatus.NOT_APPLICABLE).length,
      overdue: 0,
      dueSoon: 0,
      expiringSoon: 0,
    };

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    // Calculate overdue
    summary.overdue = allCompliance.filter(c => 
      c.status === ComplianceStatus.PENDING && 
      c.dueDate && 
      c.dueDate < today
    ).length;

    // Calculate due soon
    summary.dueSoon = allCompliance.filter(c => 
      c.status === ComplianceStatus.PENDING && 
      c.dueDate && 
      c.dueDate >= today && 
      c.dueDate <= nextMonth
    ).length;

    // Calculate expiring soon
    summary.expiringSoon = allCompliance.filter(c => 
      c.status === ComplianceStatus.COMPLETED && 
      c.expiryDate && 
      c.expiryDate >= today && 
      c.expiryDate <= nextMonth
    ).length;

    return summary;
  }

  async markExpiredCompliance(): Promise<number> {
    const today = new Date();
    
    const result = await this.complianceTrackingRepository
      .createQueryBuilder()
      .update(ComplianceTracking)
      .set({ status: ComplianceStatus.EXPIRED })
      .where('status = :status', { status: ComplianceStatus.COMPLETED })
      .andWhere('expiryDate < :today', { today })
      .execute();

    return result.affected || 0;
  }
}
