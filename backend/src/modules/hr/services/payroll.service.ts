import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Payroll, PayrollStatus } from '../entities/payroll.entity';
import { Employee, EmployeeStatus } from '../../employees/entities/employee.entity';
import { CreatePayrollDto, UpdatePayrollDto, ProcessPayrollDto, PayrollFilterDto } from '../dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({ 
      where: { id: createPayrollDto.employeeId } 
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if payroll already exists for this period
    const existingPayroll = await this.payrollRepository.findOne({
      where: {
        employeeId: createPayrollDto.employeeId,
        payPeriod: createPayrollDto.payPeriod,
      },
    });

    if (existingPayroll) {
      throw new BadRequestException('Payroll already exists for this employee and period');
    }

    // Calculate gross and net salary
    const grossSalary = this.calculateGrossSalary(createPayrollDto);
    const netSalary = this.calculateNetSalary(grossSalary, createPayrollDto);

    const payroll = this.payrollRepository.create({
      ...createPayrollDto,
      grossSalary,
      netSalary,
    });

    return await this.payrollRepository.save(payroll);
  }

  async findAll(filters: PayrollFilterDto) {
    const { 
      employeeId, 
      payPeriod, 
      status, 
      startPeriod, 
      endPeriod, 
      page = 1, 
      limit = 10 
    } = filters;

    const queryBuilder = this.payrollRepository
      .createQueryBuilder('payroll')
      .leftJoinAndSelect('payroll.employee', 'employee');

    if (employeeId) {
      queryBuilder.andWhere('payroll.employeeId = :employeeId', { employeeId });
    }

    if (payPeriod) {
      queryBuilder.andWhere('payroll.payPeriod = :payPeriod', { payPeriod });
    }

    if (status) {
      queryBuilder.andWhere('payroll.status = :status', { status });
    }

    if (startPeriod) {
      queryBuilder.andWhere('payroll.payPeriod >= :startPeriod', { startPeriod });
    }

    if (endPeriod) {
      queryBuilder.andWhere('payroll.payPeriod <= :endPeriod', { endPeriod });
    }

    queryBuilder.orderBy('payroll.payPeriod', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [payrolls, total] = await queryBuilder.getManyAndCount();

    return {
      data: payrolls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Payroll> {
    const payroll = await this.payrollRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    return payroll;
  }

  async findByEmployee(employeeId: string, year?: number): Promise<Payroll[]> {
    const queryBuilder = this.payrollRepository
      .createQueryBuilder('payroll')
      .where('payroll.employeeId = :employeeId', { employeeId });

    if (year) {
      queryBuilder.andWhere('payroll.payPeriod LIKE :year', { year: `${year}%` });
    }

    return await queryBuilder
      .orderBy('payroll.payPeriod', 'DESC')
      .getMany();
  }

  async update(id: string, updatePayrollDto: UpdatePayrollDto): Promise<Payroll> {
    const payroll = await this.findOne(id);

    if (payroll.status === PayrollStatus.PAID) {
      throw new BadRequestException('Cannot update paid payroll');
    }

    // Recalculate salary if relevant fields are updated
    if (this.shouldRecalculate(updatePayrollDto)) {
      const updatedData = { ...payroll, ...updatePayrollDto };
      const grossSalary = this.calculateGrossSalary(updatedData);
      const netSalary = this.calculateNetSalary(grossSalary, updatedData);
      
      Object.assign(payroll, updatePayrollDto, { grossSalary, netSalary });
    } else {
      Object.assign(payroll, updatePayrollDto);
    }
    
    return await this.payrollRepository.save(payroll);
  }

  async process(id: string, processPayrollDto: ProcessPayrollDto): Promise<Payroll> {
    const payroll = await this.findOne(id);

    if (payroll.status === PayrollStatus.PAID) {
      throw new BadRequestException('Payroll is already paid');
    }

    payroll.status = processPayrollDto.status;
    
    if (processPayrollDto.status === PayrollStatus.PROCESSED) {
      payroll.processedAt = new Date();
    } else if (processPayrollDto.status === PayrollStatus.PAID) {
      payroll.processedAt = payroll.processedAt || new Date();
      payroll.paidAt = new Date();
    }

    if (processPayrollDto.notes) {
      payroll.notes = processPayrollDto.notes;
    }

    return await this.payrollRepository.save(payroll);
  }

  async remove(id: string): Promise<void> {
    const payroll = await this.findOne(id);

    if (payroll.status === PayrollStatus.PAID) {
      throw new BadRequestException('Cannot delete paid payroll');
    }

    await this.payrollRepository.remove(payroll);
  }

  async generateBulkPayroll(payPeriod: string, employeeIds?: string[]): Promise<Payroll[]> {
    let employees: Employee[];

    if (employeeIds && employeeIds.length > 0) {
      employees = await this.employeeRepository.findByIds(employeeIds);
    } else {
      // Get all active employees
      employees = await this.employeeRepository.find({
        where: { status: EmployeeStatus.ACTIVE },
      });
    }

    const payrolls: Payroll[] = [];

    for (const employee of employees) {
      // Check if payroll already exists
      const existingPayroll = await this.payrollRepository.findOne({
        where: {
          employeeId: employee.id,
          payPeriod,
        },
      });

      if (!existingPayroll) {
        // Create basic payroll with employee's salary
        const basicSalary = Number(employee.salary) || 0;
        const grossSalary = basicSalary;
        const netSalary = basicSalary; // Simplified calculation

        const payroll = this.payrollRepository.create({
          employeeId: employee.id,
          payPeriod,
          basicSalary,
          grossSalary,
          netSalary,
          workingDays: 22, // Default working days
          actualWorkingDays: 22,
        });

        const savedPayroll = await this.payrollRepository.save(payroll);
        payrolls.push(savedPayroll);
      }
    }

    return payrolls;
  }

  async getPayrollSummary(payPeriod: string) {
    const payrolls = await this.payrollRepository.find({
      where: { payPeriod },
      relations: ['employee'],
    });

    const summary = {
      totalEmployees: payrolls.length,
      totalGrossSalary: payrolls.reduce((sum, p) => sum + Number(p.grossSalary), 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + Number(p.deductions), 0),
      totalTax: payrolls.reduce((sum, p) => sum + Number(p.taxDeduction), 0),
      statusBreakdown: {
        draft: payrolls.filter(p => p.status === PayrollStatus.DRAFT).length,
        processed: payrolls.filter(p => p.status === PayrollStatus.PROCESSED).length,
        paid: payrolls.filter(p => p.status === PayrollStatus.PAID).length,
        cancelled: payrolls.filter(p => p.status === PayrollStatus.CANCELLED).length,
      },
      payrolls,
    };

    return summary;
  }

  private calculateGrossSalary(payrollData: any): number {
    const basicSalary = Number(payrollData.basicSalary) || 0;
    const allowances = Number(payrollData.allowances) || 0;
    const overtime = Number(payrollData.overtime) || 0;
    const bonus = Number(payrollData.bonus) || 0;
    const commission = Number(payrollData.commission) || 0;

    return basicSalary + allowances + overtime + bonus + commission;
  }

  private calculateNetSalary(grossSalary: number, payrollData: any): number {
    const deductions = Number(payrollData.deductions) || 0;
    const taxDeduction = Number(payrollData.taxDeduction) || 0;
    const providentFund = Number(payrollData.providentFund) || 0;
    const insurance = Number(payrollData.insurance) || 0;

    const totalDeductions = deductions + taxDeduction + providentFund + insurance;
    return Math.max(0, grossSalary - totalDeductions);
  }

  private shouldRecalculate(updateData: any): boolean {
    const fieldsToCheck = [
      'basicSalary', 'allowances', 'overtime', 'bonus', 'commission',
      'deductions', 'taxDeduction', 'providentFund', 'insurance'
    ];

    return fieldsToCheck.some(field => updateData.hasOwnProperty(field));
  }
}
