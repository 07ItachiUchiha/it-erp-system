import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, OneToOne } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  FINANCE = 'finance',
  SALES = 'sales',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Don't include password in queries by default
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: Department, nullable: true })
  department?: Department;

  @Column({ type: 'enum', enum: Designation, nullable: true })
  designation?: Designation;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Relations
  @OneToOne('Employee', 'user', { nullable: true })
  employee?: any;

  @ManyToMany('Project', 'teamMembers')
  assignedProjects: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Virtual property
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
