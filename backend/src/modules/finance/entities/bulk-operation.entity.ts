import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum BulkOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum BulkOperationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIALLY_COMPLETED = 'partially_completed'
}

export enum BulkOperationEntityType {
  INVOICE = 'invoice',
  BILL = 'bill',
  EXPENSE = 'expense',
  CUSTOMER_ADDRESS = 'customer_address',
  BILL_PAYMENT = 'bill_payment'
}

@Entity('bulk_operations')
@Index(['operationType', 'entityType'])
export class BulkOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BulkOperationType
  })
  @Index()
  operationType: BulkOperationType;

  @Column({
    type: 'enum',
    enum: BulkOperationEntityType
  })
  @Index()
  entityType: BulkOperationEntityType;

  @Column('jsonb')
  entityIds: string[]; // Array of entity IDs to process

  @Column('jsonb', { nullable: true })
  operationData?: any; // Data to apply in bulk operations

  @Column('integer', { default: 0 })
  totalRecords: number;

  @Column('integer', { default: 0 })
  processedRecords: number;

  @Column('integer', { default: 0 })
  successfulRecords: number;

  @Column('integer', { default: 0 })
  failedRecords: number;

  @Column({
    type: 'enum',
    enum: BulkOperationStatus,
    default: BulkOperationStatus.PENDING
  })
  @Index()
  status: BulkOperationStatus;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column('jsonb', { nullable: true })
  results?: any; // Detailed results for each entity

  @Column('jsonb', { nullable: true })
  errors?: any; // Detailed errors for failed entities

  @Column('text', { nullable: true })
  errorSummary?: string; // Summary of errors

  @Column('integer', { nullable: true })
  estimatedTimeRemaining?: number; // in seconds

  @Column({ default: false })
  @Index()
  canUndo: boolean;

  @Column('jsonb', { nullable: true })
  undoData?: any; // Data needed to undo the operation

  @Column({ nullable: true })
  @Index()
  undoExpiresAt?: Date; // When the undo option expires

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column('uuid')
  @Index()
  performedBy: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  initializeRecords(): void {
    this.totalRecords = this.entityIds.length;
    this.processedRecords = 0;
    this.successfulRecords = 0;
    this.failedRecords = 0;
    this.progress = 0;
    this.results = {};
    this.errors = {};
  }

  markAsStarted(): void {
    this.status = BulkOperationStatus.PROCESSING;
    this.startedAt = new Date();
  }

  recordSuccess(entityId: string, result?: any): void {
    this.successfulRecords += 1;
    this.processedRecords += 1;
    if (result && this.results) {
      this.results[entityId] = result;
    }
    this.updateProgress();
  }

  recordFailure(entityId: string, error: string): void {
    this.failedRecords += 1;
    this.processedRecords += 1;
    if (this.errors) {
      this.errors[entityId] = error;
    }
    this.updateProgress();
  }

  private updateProgress(): void {
    if (this.totalRecords > 0) {
      this.progress = (this.processedRecords / this.totalRecords) * 100;
    }
  }

  markAsCompleted(): void {
    this.completedAt = new Date();
    this.progress = 100;

    if (this.failedRecords === 0) {
      this.status = BulkOperationStatus.COMPLETED;
    } else if (this.successfulRecords === 0) {
      this.status = BulkOperationStatus.FAILED;
    } else {
      this.status = BulkOperationStatus.PARTIALLY_COMPLETED;
    }

    // Set undo expiration for successful operations
    if (this.canUndo && this.successfulRecords > 0) {
      this.undoExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
  }

  markAsFailed(errorMessage: string): void {
    this.status = BulkOperationStatus.FAILED;
    this.completedAt = new Date();
    this.errorSummary = errorMessage;
  }

  markAsCancelled(): void {
    this.status = BulkOperationStatus.CANCELLED;
    this.completedAt = new Date();
  }

  // Calculate success rate as percentage
  get successRate(): number {
    return this.processedRecords > 0 ? (this.successfulRecords / this.processedRecords) * 100 : 0;
  }

  // Check if undo is still available
  get canStillUndo(): boolean {
    return this.canUndo && 
           this.undoExpiresAt && 
           new Date() < this.undoExpiresAt &&
           this.successfulRecords > 0;
  }

  // Get remaining entities to process
  get remainingRecords(): number {
    return Math.max(0, this.totalRecords - this.processedRecords);
  }

  // Check if operation is in a final state
  get isFinished(): boolean {
    return [
      BulkOperationStatus.COMPLETED,
      BulkOperationStatus.FAILED,
      BulkOperationStatus.CANCELLED,
      BulkOperationStatus.PARTIALLY_COMPLETED
    ].includes(this.status);
  }

  // Get detailed error summary
  getErrorSummary(): string {
    if (!this.errors || Object.keys(this.errors).length === 0) {
      return 'No errors';
    }

    const errorCount = Object.keys(this.errors).length;
    const uniqueErrors = [...new Set(Object.values(this.errors))];
    
    return `${errorCount} failed operations. Common errors: ${uniqueErrors.slice(0, 3).join(', ')}${uniqueErrors.length > 3 ? '...' : ''}`;
  }
}
