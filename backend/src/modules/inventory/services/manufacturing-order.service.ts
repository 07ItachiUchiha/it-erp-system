import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ManufacturingOrder } from '../entities/manufacturing-order.entity';
import { BillOfMaterialService } from './bill-of-material.service';
import { ItemService } from './item.service';

export interface CreateManufacturingOrderDto {
  moNumber: string;
  productId: string;
  bomId?: string;
  workstationId?: string;
  quantityToProduce: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  estimatedCost?: number;
  responsiblePerson?: string;
  notes?: string;
  operations?: Record<string, any>[];
  qualityChecks?: Record<string, any>[];
}

export interface UpdateManufacturingOrderDto extends Partial<CreateManufacturingOrderDto> {}

@Injectable()
export class ManufacturingOrderService {
  constructor(
    @InjectRepository(ManufacturingOrder)
    private moRepository: Repository<ManufacturingOrder>,
    private bomService: BillOfMaterialService,
    private itemService: ItemService,
  ) {}

  async create(createDto: CreateManufacturingOrderDto): Promise<ManufacturingOrder> {
    try {
      // Validate that product exists
      await this.itemService.findOne(createDto.productId);

      // If BOM is specified, validate it exists and is for the correct product
      if (createDto.bomId) {
        const bom = await this.bomService.findOne(createDto.bomId);
        if (bom.productId !== createDto.productId) {
          throw new BadRequestException('BOM does not match the specified product');
        }
      }

      const mo = this.moRepository.create(createDto);
      return await this.moRepository.save(mo);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Manufacturing order number already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindManyOptions<ManufacturingOrder>): Promise<ManufacturingOrder[]> {
    return await this.moRepository.find({
      relations: ['product', 'billOfMaterial', 'workstation'],
      order: { createdAt: 'DESC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<ManufacturingOrder> {
    const mo = await this.moRepository.findOne({
      where: { id },
      relations: ['product', 'billOfMaterial', 'workstation'],
    });

    if (!mo) {
      throw new NotFoundException(`Manufacturing order with ID ${id} not found`);
    }

    return mo;
  }

  async findByNumber(moNumber: string): Promise<ManufacturingOrder | null> {
    return await this.moRepository.findOne({
      where: { moNumber },
      relations: ['product', 'billOfMaterial', 'workstation'],
    });
  }

  async findByProduct(productId: string): Promise<ManufacturingOrder[]> {
    return await this.moRepository.find({
      where: { productId },
      relations: ['product', 'billOfMaterial', 'workstation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<ManufacturingOrder[]> {
    return await this.moRepository.find({
      where: { status },
      relations: ['product', 'billOfMaterial', 'workstation'],
      order: { plannedStartDate: 'ASC' },
    });
  }

  async findByWorkstation(workstationId: string): Promise<ManufacturingOrder[]> {
    return await this.moRepository.find({
      where: { workstationId },
      relations: ['product', 'billOfMaterial', 'workstation'],
      order: { plannedStartDate: 'ASC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ManufacturingOrder[]> {
    return await this.moRepository
      .createQueryBuilder('mo')
      .leftJoinAndSelect('mo.product', 'product')
      .leftJoinAndSelect('mo.billOfMaterial', 'bom')
      .leftJoinAndSelect('mo.workstation', 'workstation')
      .where('mo.plannedStartDate >= :startDate', { startDate })
      .andWhere('mo.plannedEndDate <= :endDate', { endDate })
      .orderBy('mo.plannedStartDate', 'ASC')
      .getMany();
  }

  async update(id: string, updateDto: UpdateManufacturingOrderDto): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    try {
      Object.assign(mo, updateDto);
      return await this.moRepository.save(mo);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Manufacturing order number already exists');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string, 
    status: 'draft' | 'confirmed' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  ): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    const oldStatus = mo.status;
    mo.status = status;

    // Update timestamps based on status changes
    const now = new Date();
    
    if (status === 'in_progress' && oldStatus !== 'in_progress') {
      mo.actualStartDate = now;
    } else if (status === 'completed' && oldStatus !== 'completed') {
      mo.actualEndDate = now;
    }

    return await this.moRepository.save(mo);
  }

  async startProduction(id: string): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    if (mo.status !== 'confirmed') {
      throw new BadRequestException('Manufacturing order must be confirmed to start production');
    }

    mo.status = 'in_progress';
    mo.actualStartDate = new Date();
    
    return await this.moRepository.save(mo);
  }

  async completeProduction(id: string, quantityProduced: number): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    if (mo.status !== 'in_progress') {
      throw new BadRequestException('Manufacturing order must be in progress to complete');
    }

    mo.status = 'completed';
    mo.actualEndDate = new Date();
    mo.quantityProduced = quantityProduced;
    
    // Update actual hours if not already set
    if (!mo.actualHours && mo.actualStartDate) {
      const timeDiff = mo.actualEndDate.getTime() - mo.actualStartDate.getTime();
      mo.actualHours = timeDiff / (1000 * 60 * 60); // Convert to hours
    }

    const savedMO = await this.moRepository.save(mo);

    // Update product stock
    await this.itemService.updateStock(mo.productId, quantityProduced, 'add');

    return savedMO;
  }

  async pauseProduction(id: string, reason?: string): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    if (mo.status !== 'in_progress') {
      throw new BadRequestException('Can only pause orders that are in progress');
    }

    mo.status = 'paused';
    
    if (reason) {
      mo.notes = mo.notes ? `${mo.notes}\n\nPaused: ${reason}` : `Paused: ${reason}`;
    }
    
    return await this.moRepository.save(mo);
  }

  async resumeProduction(id: string): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    if (mo.status !== 'paused') {
      throw new BadRequestException('Can only resume paused orders');
    }

    mo.status = 'in_progress';
    return await this.moRepository.save(mo);
  }

  async cancelOrder(id: string, reason?: string): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    if (mo.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed orders');
    }

    mo.status = 'cancelled';
    
    if (reason) {
      mo.notes = mo.notes ? `${mo.notes}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`;
    }
    
    return await this.moRepository.save(mo);
  }

  async updateProgress(
    id: string, 
    quantityProduced: number, 
    actualHours?: number,
    notes?: string
  ): Promise<ManufacturingOrder> {
    const mo = await this.findOne(id);
    
    mo.quantityProduced = quantityProduced;
    
    if (actualHours !== undefined) {
      mo.actualHours = actualHours;
    }
    
    if (notes) {
      mo.notes = mo.notes ? `${mo.notes}\n\n${notes}` : notes;
    }
    
    return await this.moRepository.save(mo);
  }

  async remove(id: string): Promise<void> {
    const mo = await this.findOne(id);
    
    if (mo.status === 'in_progress') {
      throw new BadRequestException('Cannot delete orders that are in progress');
    }
    
    await this.moRepository.remove(mo);
  }

  async getDashboardMetrics(): Promise<any> {
    const totalOrders = await this.moRepository.count();
    const draftOrders = await this.moRepository.count({ where: { status: 'draft' } });
    const confirmedOrders = await this.moRepository.count({ where: { status: 'confirmed' } });
    const inProgressOrders = await this.moRepository.count({ where: { status: 'in_progress' } });
    const completedOrders = await this.moRepository.count({ where: { status: 'completed' } });
    const cancelledOrders = await this.moRepository.count({ where: { status: 'cancelled' } });

    // Get orders due today and overdue
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const dueToday = await this.moRepository.count({
      where: {
        plannedEndDate: today,
        status: 'in_progress',
      },
    });

    const overdue = await this.moRepository
      .createQueryBuilder('mo')
      .where('mo.plannedEndDate < :today', { today })
      .andWhere('mo.status IN (:...statuses)', { statuses: ['confirmed', 'in_progress'] })
      .getCount();

    return {
      totalOrders,
      byStatus: {
        draft: draftOrders,
        confirmed: confirmedOrders,
        inProgress: inProgressOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      schedule: {
        dueToday,
        overdue,
      },
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  }

  async getProductionSchedule(startDate: Date, endDate: Date): Promise<any> {
    const orders = await this.findByDateRange(startDate, endDate);
    
    const schedule = orders.map(mo => ({
      id: mo.id,
      moNumber: mo.moNumber,
      product: {
        id: mo.product.id,
        name: mo.product.name,
        code: mo.product.itemCode,
      },
      workstation: mo.workstation ? {
        id: mo.workstation.id,
        name: mo.workstation.name,
        code: mo.workstation.workstationCode,
      } : null,
      quantity: {
        planned: mo.quantityToProduce,
        produced: mo.quantityProduced,
        remaining: mo.quantityToProduce - mo.quantityProduced,
      },
      schedule: {
        plannedStart: mo.plannedStartDate,
        plannedEnd: mo.plannedEndDate,
        actualStart: mo.actualStartDate,
        actualEnd: mo.actualEndDate,
      },
      status: mo.status,
      priority: mo.priority,
      estimatedHours: mo.estimatedHours,
      actualHours: mo.actualHours,
    }));

    return {
      period: { startDate, endDate },
      orders: schedule,
      summary: {
        totalOrders: schedule.length,
        byStatus: {
          draft: schedule.filter(o => o.status === 'draft').length,
          confirmed: schedule.filter(o => o.status === 'confirmed').length,
          inProgress: schedule.filter(o => o.status === 'in_progress').length,
          completed: schedule.filter(o => o.status === 'completed').length,
          cancelled: schedule.filter(o => o.status === 'cancelled').length,
        },
        totalPlannedQuantity: schedule.reduce((sum, o) => sum + o.quantity.planned, 0),
        totalProducedQuantity: schedule.reduce((sum, o) => sum + o.quantity.produced, 0),
      },
    };
  }

  async searchOrders(searchTerm: string): Promise<ManufacturingOrder[]> {
    return await this.moRepository
      .createQueryBuilder('mo')
      .leftJoinAndSelect('mo.product', 'product')
      .leftJoinAndSelect('mo.workstation', 'workstation')
      .where('mo.moNumber ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('mo.responsiblePerson ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('mo.createdAt', 'DESC')
      .getMany();
  }
}
