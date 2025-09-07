import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  CONSULTANT = 'consultant',
}

export enum Department {
  INFORMATION_TECHNOLOGY = 'information_technology',
  HUMAN_RESOURCES = 'human_resources',
  FINANCE = 'finance',
  SALES = 'sales',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  CUSTOMER_SERVICE = 'customer_service',
  PROCUREMENT = 'procurement',
  QUALITY_ASSURANCE = 'quality_assurance',
  RESEARCH_DEVELOPMENT = 'research_development',
  ADMINISTRATION = 'administration',
  LEGAL = 'legal',
}

export enum Designation {
  // Management
  CEO = 'ceo',
  CTO = 'cto',
  CFO = 'cfo',
  DIRECTOR = 'director',
  MANAGER = 'manager',
  ASSISTANT_MANAGER = 'assistant_manager',
  
  // IT
  SENIOR_SOFTWARE_ENGINEER = 'senior_software_engineer',
  SOFTWARE_ENGINEER = 'software_engineer',
  JUNIOR_SOFTWARE_ENGINEER = 'junior_software_engineer',
  SYSTEM_ADMINISTRATOR = 'system_administrator',
  DEVOPS_ENGINEER = 'devops_engineer',
  QA_ENGINEER = 'qa_engineer',
  
  // HR
  HR_MANAGER = 'hr_manager',
  HR_EXECUTIVE = 'hr_executive',
  RECRUITER = 'recruiter',
  
  // Finance
  FINANCE_MANAGER = 'finance_manager',
  ACCOUNTANT = 'accountant',
  ACCOUNTS_EXECUTIVE = 'accounts_executive',
  
  // Sales
  SALES_MANAGER = 'sales_manager',
  SALES_EXECUTIVE = 'sales_executive',
  BUSINESS_DEVELOPMENT_EXECUTIVE = 'business_development_executive',
  
  // Marketing
  MARKETING_MANAGER = 'marketing_manager',
  MARKETING_EXECUTIVE = 'marketing_executive',
  DIGITAL_MARKETING_SPECIALIST = 'digital_marketing_specialist',
  
  // Operations
  OPERATIONS_MANAGER = 'operations_manager',
  OPERATIONS_EXECUTIVE = 'operations_executive',
  
  // Customer Service
  CUSTOMER_SERVICE_MANAGER = 'customer_service_manager',
  CUSTOMER_SERVICE_REPRESENTATIVE = 'customer_service_representative',
  
  // General
  INTERN = 'intern',
  TRAINEE = 'trainee',
  CONSULTANT = 'consultant',
  COORDINATOR = 'coordinator',
  SPECIALIST = 'specialist',
  EXECUTIVE = 'executive',
}

@Entity('employees')
@Index(['department', 'designation'])
@Index(['status'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  empId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: Department, nullable: true })
  department?: Department;

  @Column({ type: 'enum', enum: Designation })
  designation: Designation;

  @Column('decimal', { precision: 15, scale: 2, comment: 'Salary in INR' })
  salary: number;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType: EmploymentType;

  @Column({ type: 'date' })
  joiningDate: string;

  @Column({ type: 'date', nullable: true })
  lastWorkingDate?: string;

  @Column({ nullable: true })
  managerId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  pincode?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  @Column({ nullable: true })
  bankAccount?: string;

  @Column({ nullable: true })
  ifscCode?: string;

  @Column({ nullable: true })
  panNumber?: string;

  @Column({ nullable: true })
  aadharNumber?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column('text', { nullable: true })
  skills?: string;

  @Column('text', { nullable: true })
  notes?: string;

  // Relations
  @Column({ nullable: true })
  userId?: string;

  @OneToOne('User', 'employee', { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === EmployeeStatus.ACTIVE;
  }
}
