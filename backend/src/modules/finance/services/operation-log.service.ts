import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { OperationLog, OperationType, EntityType } from '../entities/operation-log.entity';

export interface OperationLogFilter {
  entityType?: EntityType;
  entityId?: string;
  operationType?: OperationType;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
  bulkOperationId?: string;
}

export interface CreateOperationLogDto {
  entityType: EntityType;
  entityId: string;
  operationType: OperationType;
  performedBy: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  bulkOperationId?: string;
}

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * Create a new operation log entry
   */
  async createLog(createLogDto: CreateOperationLogDto): Promise<OperationLog> {
    const log = OperationLog.createLog(
      createLogDto.entityType,
      createLogDto.entityId,
      createLogDto.operationType,
      createLogDto.performedBy,
      createLogDto.oldValues,
      createLogDto.newValues,
      createLogDto.metadata
    );

    // Add additional properties
    if (createLogDto.userAgent) log.userAgent = createLogDto.userAgent;
    if (createLogDto.ipAddress) log.ipAddress = createLogDto.ipAddress;
    if (createLogDto.sessionId) log.sessionId = createLogDto.sessionId;
    if (createLogDto.bulkOperationId) log.bulkOperationId = createLogDto.bulkOperationId;

    return this.operationLogRepository.save(log);
  }

  /**
   * Create multiple logs in batch (for bulk operations)
   */
  async createBatchLogs(logs: CreateOperationLogDto[]): Promise<OperationLog[]> {
    const logEntities = logs.map(logDto => {
      const log = OperationLog.createLog(
        logDto.entityType,
        logDto.entityId,
        logDto.operationType,
        logDto.performedBy,
        logDto.oldValues,
        logDto.newValues,
        logDto.metadata
      );

      if (logDto.userAgent) log.userAgent = logDto.userAgent;
      if (logDto.ipAddress) log.ipAddress = logDto.ipAddress;
      if (logDto.sessionId) log.sessionId = logDto.sessionId;
      if (logDto.bulkOperationId) log.bulkOperationId = logDto.bulkOperationId;

      return log;
    });

    return this.operationLogRepository.save(logEntities);
  }

  /**
   * Get operation logs with filtering and pagination
   */
  async getOperationLogs(
    filters: OperationLogFilter,
    page: number = 1,
    limit: number = 50
  ) {
    const queryBuilder = this.operationLogRepository.createQueryBuilder('log');

    // Apply filters
    if (filters.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('log.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.operationType) {
      queryBuilder.andWhere('log.operationType = :operationType', { operationType: filters.operationType });
    }

    if (filters.performedBy) {
      queryBuilder.andWhere('log.performedBy = :performedBy', { performedBy: filters.performedBy });
    }

    if (filters.bulkOperationId) {
      queryBuilder.andWhere('log.bulkOperationId = :bulkOperationId', { bulkOperationId: filters.bulkOperationId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('log.performedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    // Add pagination
    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('log.performedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(entityType: EntityType, entityId: string) {
    return this.operationLogRepository.find({
      where: {
        entityType,
        entityId
      },
      order: {
        performedAt: 'DESC'
      }
    });
  }

  /**
   * Get operation statistics
   */
  async getOperationStats(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.operationLogRepository.createQueryBuilder('log');

    if (startDate && endDate) {
      queryBuilder.where('log.performedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    const stats = await queryBuilder
      .select([
        'log.entityType as entityType',
        'log.operationType as operationType',
        'COUNT(*) as count'
      ])
      .groupBy('log.entityType, log.operationType')
      .getRawMany();

    // Transform stats into a more usable format
    const result = {};
    stats.forEach(stat => {
      if (!result[stat.entitytype]) {
        result[stat.entitytype] = {};
      }
      result[stat.entitytype][stat.operationtype] = parseInt(stat.count);
    });

    return result;
  }

  /**
   * Get logs for bulk operation
   */
  async getBulkOperationLogs(bulkOperationId: string) {
    return this.operationLogRepository.find({
      where: { bulkOperationId },
      order: { performedAt: 'ASC' }
    });
  }

  /**
   * Clean up old logs (for maintenance)
   */
  async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.operationLogRepository.delete({
      performedAt: Between(new Date('1970-01-01'), cutoffDate)
    });

    return result.affected || 0;
  }
}
