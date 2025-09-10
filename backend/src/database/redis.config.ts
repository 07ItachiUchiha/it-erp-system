import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  keyPrefix?: string;
}

export const createRedisConnection = (configService: ConfigService): Redis => {
  const redisConfig: RedisConfig = {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB', 0),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'erp:'),
  };

  // Remove undefined values
  Object.keys(redisConfig).forEach(key => {
    if (redisConfig[key] === undefined) {
      delete redisConfig[key];
    }
  });

  const redis = new Redis(redisConfig);

  // Connection event handlers
  redis.on('connect', () => {
    console.log('Redis connection established');
  });

  redis.on('ready', () => {
    console.log('Redis connection ready');
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  redis.on('close', () => {
    console.log('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  return redis;
};

// Redis client singleton for shared use
let redisClient: Redis;

export const getRedisClient = (configService: ConfigService): Redis => {
  if (!redisClient) {
    redisClient = createRedisConnection(configService);
  }
  return redisClient;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};
