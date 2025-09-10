import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_CREATE = 'bulk_create',
  BULK_UPDATE = 'bulk_update',
  BULK_DELETE = 'bulk_delete',
  EXPORT = 'export',
  PRINT = 'print',
  EMAIL = 'email',
  STATUS_CHANGE = 'status_change',
  PAYMENT_ADD = 'payment_add'
}

export enum EntityType {
  INVOICE = 'invoice',
  BILL = 'bill',
  EXPENSE = 'expense',
  CUSTOMER_ADDRESS = 'customer_address',
  BILL_PAYMENT = 'bill_payment'
}

@Entity('operation_logs')
@Index(['entityType', 'entityId'])
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EntityType
  })
  @Index()
  entityType: EntityType;

  @Column('uuid')
  @Index()
  entityId: string;

  @Column({
    type: 'enum',
    enum: OperationType
  })
  @Index()
  operationType: OperationType;

  @Column('jsonb', { nullable: true })
  oldValues?: any;

  @Column('jsonb', { nullable: true })
  newValues?: any;

  @Column('jsonb', { nullable: true })
  changes?: any;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column('uuid', { nullable: true })
  @Index()
  bulkOperationId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: any;

  @Column('uuid')
  @Index()
  performedBy: string;

  @CreateDateColumn()
  @Index()
  performedAt: Date;

  // Helper methods for creating operation logs
  static createLog(
    entityType: EntityType,
    entityId: string,
    operationType: OperationType,
    performedBy: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Partial<OperationLog> {
    const changes = this.calculateChanges(oldValues, newValues);
    
    return {
      entityType,
      entityId,
      operationType,
      performedBy,
      oldValues,
      newValues,
      changes,
      metadata,
      performedAt: new Date()
    };
  }

  private static calculateChanges(oldValues?: any, newValues?: any): any {
    if (!oldValues || !newValues) return null;

    const changes: any = {};
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }
}
