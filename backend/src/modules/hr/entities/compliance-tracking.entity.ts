import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum ComplianceType {
  POLICY_ACKNOWLEDGMENT = 'policy_acknowledgment',
  TRAINING_COMPLETION = 'training_completion',
  DOCUMENT_SUBMISSION = 'document_submission',
  CERTIFICATION = 'certification',
  BACKGROUND_CHECK = 'background_check',
  MEDICAL_CHECKUP = 'medical_checkup',
  DATA_PRIVACY = 'data_privacy',
  CODE_OF_CONDUCT = 'code_of_conduct',
}

export enum ComplianceStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  NOT_APPLICABLE = 'not_applicable',
}

@Entity('compliance_tracking')
export class ComplianceTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'enum', enum: ComplianceType })
  complianceType: ComplianceType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ComplianceStatus, default: ComplianceStatus.PENDING })
  status: ComplianceStatus;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  documentUrl: string;

  @Column({ type: 'text', nullable: true })
  certificateUrl: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier: Employee;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
