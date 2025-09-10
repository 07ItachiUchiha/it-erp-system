import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf'
}

export enum ExportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('export_configurations')
export class ExportConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ExportFormat
  })
  @Index()
  format: ExportFormat;

  @Column('jsonb')
  template: any; // Template configuration for the export format

  @Column('jsonb', { nullable: true })
  filters?: any; // Default filters to apply

  @Column('jsonb')
  columns: any; // Column configuration for export

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column('uuid')
  @Index()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ExportJob, exportJob => exportJob.configuration)
  exportJobs: ExportJob[];
}

@Entity('export_jobs')
export class ExportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  configurationId?: string;

  @ManyToOne(() => ExportConfiguration, config => config.exportJobs, { nullable: true })
  @JoinColumn({ name: 'configurationId' })
  configuration?: ExportConfiguration;

  @Column({
    type: 'enum',
    enum: ExportFormat
  })
  format: ExportFormat;

  @Column('jsonb', { nullable: true })
  filters?: any; // Filters applied for this specific export

  @Column('integer', { default: 0 })
  totalRecords: number;

  @Column('integer', { default: 0 })
  processedRecords: number;

  @Column({
    type: 'enum',
    enum: ExportJobStatus,
    default: ExportJobStatus.PENDING
  })
  @Index()
  status: ExportJobStatus;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column('bigint', { nullable: true })
  fileSize?: number;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column('integer', { nullable: true })
  estimatedTimeRemaining?: number; // in seconds

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  @Index()
  expiresAt?: Date; // When the exported file expires

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
  updateProgress(processed: number, total?: number): void {
    this.processedRecords = processed;
    if (total) this.totalRecords = total;
    this.progress = this.totalRecords > 0 ? (this.processedRecords / this.totalRecords) * 100 : 0;
  }

  markAsStarted(): void {
    this.status = ExportJobStatus.PROCESSING;
    this.startedAt = new Date();
  }

  markAsCompleted(filePath: string, fileName: string, fileSize: number): void {
    this.status = ExportJobStatus.COMPLETED;
    this.completedAt = new Date();
    this.filePath = filePath;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.progress = 100;
    // Set expiration to 7 days from now
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  markAsFailed(errorMessage: string): void {
    this.status = ExportJobStatus.FAILED;
    this.completedAt = new Date();
    this.errorMessage = errorMessage;
  }

  incrementDownloadCount(): void {
    this.downloadCount += 1;
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isDownloadable(): boolean {
    return this.status === ExportJobStatus.COMPLETED && 
           this.filePath && 
           !this.isExpired;
  }
}
