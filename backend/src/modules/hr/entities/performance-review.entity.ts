import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum ReviewPeriod {
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum ReviewStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

export enum Rating {
  EXCELLENT = 5,
  GOOD = 4,
  SATISFACTORY = 3,
  NEEDS_IMPROVEMENT = 2,
  UNSATISFACTORY = 1,
}

@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: Employee;

  @Column({ type: 'varchar', length: 7 }) // Format: YYYY-MM
  reviewPeriod: string;

  @Column({ type: 'enum', enum: ReviewPeriod })
  periodType: ReviewPeriod;

  @Column({ type: 'date' })
  reviewDate: Date;

  @Column({ type: 'enum', enum: Rating })
  overallRating: Rating;

  @Column({ type: 'enum', enum: Rating })
  technicalSkills: Rating;

  @Column({ type: 'enum', enum: Rating })
  communication: Rating;

  @Column({ type: 'enum', enum: Rating })
  teamwork: Rating;

  @Column({ type: 'enum', enum: Rating })
  leadership: Rating;

  @Column({ type: 'enum', enum: Rating })
  problemSolving: Rating;

  @Column({ type: 'enum', enum: Rating })
  timeManagement: Rating;

  @Column({ type: 'text', nullable: true })
  achievements: string;

  @Column({ type: 'text', nullable: true })
  areasOfImprovement: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @Column({ type: 'text', nullable: true })
  reviewerComments: string;

  @Column({ type: 'text', nullable: true })
  employeeComments: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.DRAFT })
  status: ReviewStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
