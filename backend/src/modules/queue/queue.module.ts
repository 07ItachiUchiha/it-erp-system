import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const QUEUE_NAMES = {
  EXPORT_JOBS: 'export-jobs',
  PRINT_JOBS: 'print-jobs',
  BULK_OPERATIONS: 'bulk-operations',
} as const;

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'erp:bull:'),
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        settings: {
          stalledInterval: 30 * 1000, // Check for stalled jobs every 30 seconds
          maxStalledCount: 1, // Max number of times a job can be stalled
        },
      }),
      inject: [ConfigService],
    }),
    // Register individual queues
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EXPORT_JOBS,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2, // Export jobs are less critical, fewer retries
        },
      },
      {
        name: QUEUE_NAMES.PRINT_JOBS,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
        },
      },
      {
        name: QUEUE_NAMES.BULK_OPERATIONS,
        defaultJobOptions: {
          removeOnComplete: 25,
          removeOnFail: 25,
          attempts: 1, // Bulk operations should not auto-retry
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
