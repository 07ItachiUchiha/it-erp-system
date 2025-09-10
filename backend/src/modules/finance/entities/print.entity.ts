import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

export enum PrintTemplateType {
  INVOICE = 'invoice',
  BILL = 'bill',
  RECEIPT = 'receipt',
  STATEMENT = 'statement'
}

export enum PrintJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('print_templates')
export class PrintTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PrintTemplateType
  })
  @Index()
  templateType: PrintTemplateType;

  @Column('text')
  content: string; // Handlebars template content

  @Column('text', { nullable: true })
  styles?: string; // CSS styles for the template

  @Column({ default: 'A4' })
  paperSize: string; // A4, A3, Letter, etc.

  @Column({ default: 'portrait' })
  orientation: string; // portrait, landscape

  @Column('jsonb', { default: { top: 20, bottom: 20, left: 20, right: 20 } })
  margins: any; // Margin configuration

  @Column('text', { nullable: true })
  headerContent?: string; // Header template

  @Column('text', { nullable: true })
  footerContent?: string; // Footer template

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  @Index()
  isDefault: boolean;

  @Column('integer', { default: 1 })
  version: number;

  @Column('uuid')
  @Index()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PrintJob, printJob => printJob.template)
  printJobs: PrintJob[];
}

@Entity('print_jobs')
export class PrintJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  templateId?: string;

  @ManyToOne(() => PrintTemplate, template => template.printJobs, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: PrintTemplate;

  @Column()
  @Index()
  entityType: string; // 'invoice', 'bill', etc.

  @Column('uuid')
  @Index()
  entityId: string; // Single entity ID

  @Column('jsonb', { nullable: true })
  entityIds?: string[]; // Multiple entity IDs for batch printing

  @Column('text', { nullable: true })
  customTemplate?: string; // Custom template override

  @Column('jsonb', { nullable: true })
  renderOptions?: any; // Additional rendering options

  @Column({
    type: 'enum',
    enum: PrintJobStatus,
    default: PrintJobStatus.PENDING
  })
  @Index()
  status: PrintJobStatus;

  @Column('integer', { nullable: true })
  totalPages?: number;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column('bigint', { nullable: true })
  fileSize?: number;

  @Column({ default: 'application/pdf' })
  mimeType: string;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  @Index()
  expiresAt?: Date; // When the generated file expires

  @Column('integer', { default: 0 })
  downloadCount: number;

  @Column('uuid')
  @Index()
  requestedBy: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  markAsStarted(): void {
    this.status = PrintJobStatus.PROCESSING;
    this.startedAt = new Date();
  }

  markAsCompleted(filePath: string, fileName: string, fileSize: number, totalPages: number): void {
    this.status = PrintJobStatus.COMPLETED;
    this.completedAt = new Date();
    this.filePath = filePath;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.totalPages = totalPages;
    this.progress = 100;
    // Set expiration to 24 hours from now
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  markAsFailed(errorMessage: string): void {
    this.status = PrintJobStatus.FAILED;
    this.completedAt = new Date();
    this.errorMessage = errorMessage;
  }

  updateProgress(progress: number): void {
    this.progress = Math.min(100, Math.max(0, progress));
  }

  incrementDownloadCount(): void {
    this.downloadCount += 1;
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isDownloadable(): boolean {
    return this.status === PrintJobStatus.COMPLETED && 
           this.filePath && 
           !this.isExpired;
  }

  get isBatchJob(): boolean {
    return this.entityIds && this.entityIds.length > 1;
  }

  get entityCount(): number {
    return this.entityIds ? this.entityIds.length : 1;
  }
}
