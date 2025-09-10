import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BulkOperation, BulkOperationType, BulkOperationStatus, BulkOperationEntityType } from '../entities/bulk-operation.entity';
import { OperationLogService, CreateOperationLogDto } from './operation-log.service';
import { OperationType, EntityType } from '../entities/operation-log.entity';

export interface CreateBulkOperationDto {
  operationType: BulkOperationType;
  entityType: BulkOperationEntityType;
  entityIds: string[];
  operationData?: any;
  performedBy: string;
  canUndo?: boolean;
}

export interface BulkOperationFilter {
  status?: BulkOperationStatus;
  operationType?: BulkOperationType;
  entityType?: BulkOperationEntityType;
  performedBy?: string;
  canUndo?: boolean;
}

@Injectable()
export class BulkOperationService {
  constructor(
    @InjectRepository(BulkOperation)
    private bulkOperationRepository: Repository<BulkOperation>,
    private operationLogService: OperationLogService,
  ) {}

  /**
   * Create a new bulk operation
   */
  async createBulkOperation(createDto: CreateBulkOperationDto): Promise<BulkOperation> {
    const bulkOperation = this.bulkOperationRepository.create({
      ...createDto,
      totalRecords: createDto.entityIds.length,
      canUndo: createDto.canUndo || false
    });

    bulkOperation.initializeRecords();
    return this.bulkOperationRepository.save(bulkOperation);
  }

  /**
   * Start processing a bulk operation
   */
  async startBulkOperation(id: string): Promise<BulkOperation> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    if (operation.status !== BulkOperationStatus.PENDING) {
      throw new Error('Bulk operation is not in pending status');
    }

    operation.markAsStarted();
    return this.bulkOperationRepository.save(operation);
  }

  /**
   * Record success for an entity in bulk operation
   */
  async recordSuccess(id: string, entityId: string, result?: any): Promise<void> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    operation.recordSuccess(entityId, result);
    await this.bulkOperationRepository.save(operation);

    // Create operation log
    await this.operationLogService.createLog({
      entityType: this.mapEntityType(operation.entityType),
      entityId,
      operationType: this.mapOperationType(operation.operationType),
      performedBy: operation.performedBy,
      newValues: result,
      bulkOperationId: operation.id
    });
  }

  /**
   * Record failure for an entity in bulk operation
   */
  async recordFailure(id: string, entityId: string, error: string): Promise<void> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    operation.recordFailure(entityId, error);
    await this.bulkOperationRepository.save(operation);
  }

  /**
   * Complete a bulk operation
   */
  async completeBulkOperation(id: string, undoData?: any): Promise<BulkOperation> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    if (undoData && operation.canUndo) {
      operation.undoData = undoData;
    }

    operation.markAsCompleted();
    return this.bulkOperationRepository.save(operation);
  }

  /**
   * Mark bulk operation as failed
   */
  async markAsFailed(id: string, errorMessage: string): Promise<BulkOperation> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    operation.markAsFailed(errorMessage);
    return this.bulkOperationRepository.save(operation);
  }

  /**
   * Cancel a bulk operation
   */
  async cancelBulkOperation(id: string): Promise<BulkOperation> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    if (operation.isFinished) {
      throw new Error('Cannot cancel a finished bulk operation');
    }

    operation.markAsCancelled();
    return this.bulkOperationRepository.save(operation);
  }

  /**
   * Get bulk operation by ID
   */
  async findOne(id: string): Promise<BulkOperation | null> {
    return this.bulkOperationRepository.findOne({ where: { id } });
  }

  /**
   * Get bulk operations with filtering and pagination
   */
  async getBulkOperations(
    filters: BulkOperationFilter,
    page: number = 1,
    limit: number = 20
  ) {
    const queryBuilder = this.bulkOperationRepository.createQueryBuilder('bulk');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('bulk.status = :status', { status: filters.status });
    }

    if (filters.operationType) {
      queryBuilder.andWhere('bulk.operationType = :operationType', { operationType: filters.operationType });
    }

    if (filters.entityType) {
      queryBuilder.andWhere('bulk.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.performedBy) {
      queryBuilder.andWhere('bulk.performedBy = :performedBy', { performedBy: filters.performedBy });
    }

    if (filters.canUndo !== undefined) {
      queryBuilder.andWhere('bulk.canUndo = :canUndo', { canUndo: filters.canUndo });
    }

    // Add pagination
    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('bulk.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [operations, total] = await queryBuilder.getManyAndCount();

    return {
      data: operations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get operations that can be undone
   */
  async getUndoableOperations(performedBy?: string) {
    const queryBuilder = this.bulkOperationRepository.createQueryBuilder('bulk');

    queryBuilder
      .where('bulk.canUndo = :canUndo', { canUndo: true })
      .andWhere('bulk.undoExpiresAt > :now', { now: new Date() })
      .andWhere('bulk.successfulRecords > 0');

    if (performedBy) {
      queryBuilder.andWhere('bulk.performedBy = :performedBy', { performedBy });
    }

    return queryBuilder
      .orderBy('bulk.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Undo a bulk operation
   */
  async undoBulkOperation(id: string, performedBy: string): Promise<BulkOperation> {
    const operation = await this.findOne(id);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    if (!operation.canStillUndo) {
      throw new Error('This operation cannot be undone');
    }

    // Create a new bulk operation for the undo
    const undoOperation = await this.createBulkOperation({
      operationType: this.getUndoOperationType(operation.operationType),
      entityType: operation.entityType,
      entityIds: Object.keys(operation.results || {}),
      operationData: operation.undoData,
      performedBy,
      canUndo: false
    });

    // Mark original operation as undone
    operation.canUndo = false;
    operation.undoExpiresAt = new Date(); // Expire immediately
    await this.bulkOperationRepository.save(operation);

    return undoOperation;
  }

  /**
   * Clean up expired undo data
   */
  async cleanupExpiredUndoData(): Promise<number> {
    const result = await this.bulkOperationRepository.update(
      {
        canUndo: true,
        undoExpiresAt: In(['< :now']),
      },
      {
        canUndo: false,
        undoData: null
      }
    );

    return result.affected || 0;
  }

  /**
   * Get operation statistics
   */
  async getOperationStats() {
    const stats = await this.bulkOperationRepository
      .createQueryBuilder('bulk')
      .select([
        'bulk.status as status',
        'bulk.operationType as operationType',
        'bulk.entityType as entityType',
        'COUNT(*) as count',
        'AVG(bulk.successRate) as avgSuccessRate'
      ])
      .groupBy('bulk.status, bulk.operationType, bulk.entityType')
      .getRawMany();

    return stats.map(stat => ({
      status: stat.status,
      operationType: stat.operationtype,
      entityType: stat.entitytype,
      count: parseInt(stat.count),
      avgSuccessRate: parseFloat(stat.avgsuccessrate) || 0
    }));
  }

  private mapEntityType(entityType: BulkOperationEntityType): EntityType {
    const mapping = {
      [BulkOperationEntityType.INVOICE]: EntityType.INVOICE,
      [BulkOperationEntityType.BILL]: EntityType.BILL,
      [BulkOperationEntityType.EXPENSE]: EntityType.EXPENSE,
      [BulkOperationEntityType.CUSTOMER_ADDRESS]: EntityType.CUSTOMER_ADDRESS,
      [BulkOperationEntityType.BILL_PAYMENT]: EntityType.BILL_PAYMENT
    };
    return mapping[entityType];
  }

  private mapOperationType(operationType: BulkOperationType): OperationType {
    const mapping = {
      [BulkOperationType.CREATE]: OperationType.BULK_CREATE,
      [BulkOperationType.UPDATE]: OperationType.BULK_UPDATE,
      [BulkOperationType.DELETE]: OperationType.BULK_DELETE,
      [BulkOperationType.STATUS_CHANGE]: OperationType.STATUS_CHANGE,
      [BulkOperationType.EXPORT]: OperationType.EXPORT,
      [BulkOperationType.IMPORT]: OperationType.CREATE // Import is essentially creation
    };
    return mapping[operationType];
  }

  private getUndoOperationType(operationType: BulkOperationType): BulkOperationType {
    const undoMapping = {
      [BulkOperationType.CREATE]: BulkOperationType.DELETE,
      [BulkOperationType.DELETE]: BulkOperationType.CREATE,
      [BulkOperationType.UPDATE]: BulkOperationType.UPDATE, // Will use undo data
      [BulkOperationType.STATUS_CHANGE]: BulkOperationType.STATUS_CHANGE // Will use undo data
    };
    
    if (!undoMapping[operationType]) {
      throw new Error(`Operation type ${operationType} cannot be undone`);
    }
    
    return undoMapping[operationType];
  }
}
