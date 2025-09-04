import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Workstation } from '../entities/workstation.entity';

export interface CreateWorkstationDto {
  workstationCode: string;
  name: string;
  description?: string;
  type: 'manual' | 'semi_automatic' | 'automatic' | 'cnc' | 'assembly' | 'quality_check' | 'packaging';
  location?: string;
  hourlyRate?: number;
  capacity?: number;
  hoursPerDay?: number;
  workingDaysPerWeek?: number;
  efficiency?: number;
  capabilities?: string[];
  equipment?: Record<string, any>;
  maintenanceSchedule?: Record<string, any>;
  notes?: string;
}

export interface UpdateWorkstationDto extends Partial<CreateWorkstationDto> {}

@Injectable()
export class WorkstationService {
  constructor(
    @InjectRepository(Workstation)
    private workstationRepository: Repository<Workstation>,
  ) {}

  async create(createDto: CreateWorkstationDto): Promise<Workstation> {
    try {
      const workstation = this.workstationRepository.create(createDto);
      return await this.workstationRepository.save(workstation);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('Workstation code already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindManyOptions<Workstation>): Promise<Workstation[]> {
    return await this.workstationRepository.find({
      order: { name: 'ASC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<Workstation> {
    const workstation = await this.workstationRepository.findOne({
      where: { id },
      relations: ['manufacturingOrders'],
    });

    if (!workstation) {
      throw new NotFoundException(`Workstation with ID ${id} not found`);
    }

    return workstation;
  }

  async findByCode(workstationCode: string): Promise<Workstation | null> {
    return await this.workstationRepository.findOne({
      where: { workstationCode },
    });
  }

  async findByType(type: string): Promise<Workstation[]> {
    return await this.workstationRepository.find({
      where: { type, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByStatus(status: string): Promise<Workstation[]> {
    return await this.workstationRepository.find({
      where: { status, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAvailable(): Promise<Workstation[]> {
    return await this.workstationRepository.find({
      where: { 
        status: 'operational',
        isActive: true 
      },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateWorkstationDto): Promise<Workstation> {
    const workstation = await this.findOne(id);
    
    try {
      Object.assign(workstation, updateDto);
      return await this.workstationRepository.save(workstation);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Workstation code already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: 'operational' | 'maintenance' | 'breakdown' | 'idle'): Promise<Workstation> {
    const workstation = await this.findOne(id);
    workstation.status = status;
    return await this.workstationRepository.save(workstation);
  }

  async remove(id: string): Promise<void> {
    const workstation = await this.findOne(id);
    await this.workstationRepository.remove(workstation);
  }

  async getWorkstationUtilization(id: string, startDate: Date, endDate: Date): Promise<any> {
    const workstation = await this.findOne(id);
    
    // Calculate total available hours
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workingDays = Math.floor(totalDays * (workstation.workingDaysPerWeek / 7));
    const totalAvailableHours = workingDays * workstation.hoursPerDay;

    // Get manufacturing orders for this period
    const orders = await this.workstationRepository
      .createQueryBuilder('workstation')
      .leftJoinAndSelect('workstation.manufacturingOrders', 'mo')
      .where('workstation.id = :id', { id })
      .andWhere('mo.actualStartDate >= :startDate', { startDate })
      .andWhere('mo.actualEndDate <= :endDate', { endDate })
      .getOne();

    const totalUsedHours = orders?.manufacturingOrders?.reduce((sum, mo) => sum + (mo.actualHours || 0), 0) || 0;

    return {
      workstation: {
        id: workstation.id,
        name: workstation.name,
        code: workstation.workstationCode,
      },
      period: {
        startDate,
        endDate,
        totalDays,
        workingDays,
      },
      utilization: {
        totalAvailableHours,
        totalUsedHours,
        utilizationPercentage: totalAvailableHours > 0 ? (totalUsedHours / totalAvailableHours) * 100 : 0,
        idleHours: totalAvailableHours - totalUsedHours,
      },
      efficiency: workstation.efficiency,
    };
  }

  async getWorkstationLoad(id: string): Promise<any> {
    const workstation = await this.workstationRepository
      .createQueryBuilder('workstation')
      .leftJoinAndSelect('workstation.manufacturingOrders', 'mo')
      .where('workstation.id = :id', { id })
      .andWhere('mo.status IN (:...statuses)', { statuses: ['confirmed', 'in_progress'] })
      .getOne();

    const totalEstimatedHours = workstation?.manufacturingOrders?.reduce(
      (sum, mo) => sum + (mo.estimatedHours || 0), 0
    ) || 0;

    const currentCapacity = workstation ? workstation.capacity : 0;
    const dailyCapacity = workstation ? workstation.hoursPerDay * currentCapacity : 0;

    return {
      workstation: {
        id: workstation?.id,
        name: workstation?.name,
        code: workstation?.workstationCode,
      },
      currentLoad: {
        pendingOrders: workstation?.manufacturingOrders?.length || 0,
        totalEstimatedHours,
        dailyCapacity,
        loadPercentage: dailyCapacity > 0 ? (totalEstimatedHours / dailyCapacity) * 100 : 0,
      },
      capacity: {
        current: currentCapacity,
        dailyHours: workstation?.hoursPerDay || 0,
        efficiency: workstation?.efficiency || 0,
      },
    };
  }

  async searchWorkstations(searchTerm: string): Promise<Workstation[]> {
    return await this.workstationRepository
      .createQueryBuilder('workstation')
      .where('workstation.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('workstation.workstationCode ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('workstation.location ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('workstation.name', 'ASC')
      .getMany();
  }
}
