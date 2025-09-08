import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Profile Settings
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  avatar: string;

  // Security Settings
  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'session_timeout', default: 30 })
  sessionTimeout: number;

  @Column({ name: 'password_expiry', default: 90 })
  passwordExpiry: number;

  // Notification Settings
  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'push_notifications', default: true })
  pushNotifications: boolean;

  @Column({ name: 'sms_notifications', default: false })
  smsNotifications: boolean;

  @Column({ type: 'jsonb', default: {} })
  notificationPreferences: {
    newOrders: boolean;
    lowInventory: boolean;
    paymentReceived: boolean;
    employeeLeave: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    taskAssignments: boolean;
    projectUpdates: boolean;
    invoiceGenerated: boolean;
  };

  // Appearance Settings
  @Column({ default: 'light' })
  theme: string;

  @Column({ name: 'primary_color', default: '#3B82F6' })
  primaryColor: string;

  @Column({ name: 'font_size', default: 'medium' })
  fontSize: string;

  @Column({ name: 'compact_mode', default: false })
  compactMode: boolean;

  @Column({ name: 'show_sidebar', default: true })
  showSidebar: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'zip_code', nullable: true })
  zipCode: string;

  @Column({ default: 'India' })
  country: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ name: 'employee_count', nullable: true })
  employeeCount: number;

  @Column({ nullable: true })
  established: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ name: 'date_format', default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ name: 'backup_frequency', default: 'daily' })
  backupFrequency: string;

  @Column({ name: 'auto_logout', default: true })
  autoLogout: boolean;

  @Column({ name: 'maintenance_mode', default: false })
  maintenanceMode: boolean;

  @Column({ type: 'jsonb', default: {} })
  moduleSettings: {
    employees: { enabled: boolean; features: Record<string, boolean> };
    hr: { enabled: boolean; features: Record<string, boolean> };
    finance: { enabled: boolean; features: Record<string, boolean> };
    inventory: { enabled: boolean; features: Record<string, boolean> };
    sales: { enabled: boolean; features: Record<string, boolean> };
    procurement: { enabled: boolean; features: Record<string, boolean> };
    projects: { enabled: boolean; features: Record<string, boolean> };
    files: { enabled: boolean; features: Record<string, boolean> };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
