import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('payroll')
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'varchar', length: 7 }) // Format: YYYY-MM
  payPeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overtime: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonus: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  providentFund: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  insurance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netSalary: number;

  @Column({ type: 'int', default: 0 })
  workingDays: number;

  @Column({ type: 'int', default: 0 })
  actualWorkingDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeHours: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
