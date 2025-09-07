import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../modules/admin/services/audit-log.service';
import { AuditLog, AuditAction, AuditEntityType } from '../modules/admin/entities/audit-log.entity';
import { User } from '../modules/users/entities/user.entity';
import { CreateAuditLogDto } from '../modules/admin/dto/audit-log.dto';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: Repository<AuditLog>;
  let userRepository: Repository<User>;

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Setup the query builder mock to return the mockQueryBuilder
    mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an audit log', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: 'user-1',
        userId: 'admin-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: { test: 'data' },
      };

      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
      };

      const mockAuditLog = {
        id: '1',
        ...createAuditLogDto,
        user: mockUser,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditLogRepository.create.mockReturnValue(mockAuditLog);
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.create(createAuditLogDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'admin-1' } });
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        ...createAuditLogDto,
        user: mockUser,
      });
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log without user when userId is not provided', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        action: AuditAction.LOGIN,
        entityType: AuditEntityType.USER,
        entityId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      const mockAuditLog = {
        id: '1',
        ...createAuditLogDto,
        user: null,
        createdAt: new Date(),
      };

      mockAuditLogRepository.create.mockReturnValue(mockAuditLog);
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.create(createAuditLogDto);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        ...createAuditLogDto,
        user: null,
      });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findAll', () => {
    it('should return filtered audit logs', async () => {
      const mockLogs = [
        { id: '1', action: AuditAction.CREATE, entityType: AuditEntityType.USER },
        { id: '2', action: AuditAction.UPDATE, entityType: AuditEntityType.USER },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const filters = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('auditLog.user', 'user');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.action = :action', { action: AuditAction.CREATE });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.entityType = :entityType', { entityType: AuditEntityType.USER });
      expect(result).toEqual({
        data: mockLogs,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return audit log by id', async () => {
      const mockAuditLog = {
        id: '1',
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
      };

      mockAuditLogRepository.findOne.mockResolvedValue(mockAuditLog);

      const result = await service.findOne('1');

      expect(mockAuditLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['user'],
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should throw NotFoundException when audit log not found', async () => {
      mockAuditLogRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('Audit log not found');
    });
  });
});
