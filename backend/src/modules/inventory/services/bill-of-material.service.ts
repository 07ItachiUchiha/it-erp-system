import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { BillOfMaterial, BOMComponent, BOMOperation } from '../entities/bill-of-material.entity';

export interface CreateBOMDto {
  bomCode: string;
  productId: string;
  name: string;
  description?: string;
  productionQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
  setupTime?: number;
  operationTime?: number;
  notes?: string;
  components?: CreateBOMComponentDto[];
  operations?: CreateBOMOperationDto[];
}

export interface CreateBOMComponentDto {
  componentId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  wastagePercentage?: number;
  notes?: string;
}

export interface CreateBOMOperationDto {
  operationName: string;
  description?: string;
  sequence: number;
  setupTime?: number;
  operationTime?: number;
  hourlyRate?: number;
  workstation?: string;
  instructions?: string;
  qualityChecks?: Record<string, any>[];
}

export interface UpdateBOMDto extends Partial<CreateBOMDto> {}

@Injectable()
export class BillOfMaterialService {
  constructor(
    @InjectRepository(BillOfMaterial)
    private bomRepository: Repository<BillOfMaterial>,
    @InjectRepository(BOMComponent)
    private bomComponentRepository: Repository<BOMComponent>,
    @InjectRepository(BOMOperation)
    private bomOperationRepository: Repository<BOMOperation>,
  ) {}

  async create(createDto: CreateBOMDto): Promise<BillOfMaterial> {
    try {
      const bom = this.bomRepository.create({
        ...createDto,
        components: undefined,
        operations: undefined,
      });
      
      const savedBOM = await this.bomRepository.save(bom);

      // Add components if provided
      if (createDto.components && createDto.components.length > 0) {
        const components = createDto.components.map(comp => 
          this.bomComponentRepository.create({
            ...comp,
            bomId: savedBOM.id,
            totalCost: comp.quantity * (comp.unitCost || 0),
          })
        );
        await this.bomComponentRepository.save(components);
      }

      // Add operations if provided
      if (createDto.operations && createDto.operations.length > 0) {
        const operations = createDto.operations.map(op => 
          this.bomOperationRepository.create({
            ...op,
            bomId: savedBOM.id,
            totalCost: (op.setupTime || 0 + op.operationTime || 0) * (op.hourlyRate || 0),
          })
        );
        await this.bomOperationRepository.save(operations);
      }

      // Calculate and update total cost
      await this.updateTotalCost(savedBOM.id);

      return await this.findOne(savedBOM.id);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('BOM code already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindManyOptions<BillOfMaterial>): Promise<BillOfMaterial[]> {
    return await this.bomRepository.find({
      relations: ['product', 'components', 'components.component', 'operations'],
      order: { createdAt: 'DESC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<BillOfMaterial> {
    const bom = await this.bomRepository.findOne({
      where: { id },
      relations: ['product', 'components', 'components.component', 'operations'],
    });

    if (!bom) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }

    return bom;
  }

  async findByProduct(productId: string): Promise<BillOfMaterial[]> {
    return await this.bomRepository.find({
      where: { productId, isActive: true },
      relations: ['components', 'components.component', 'operations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCode(bomCode: string): Promise<BillOfMaterial | null> {
    return await this.bomRepository.findOne({
      where: { bomCode },
      relations: ['product', 'components', 'components.component', 'operations'],
    });
  }

  async findActiveByProduct(productId: string): Promise<BillOfMaterial | null> {
    return await this.bomRepository.findOne({
      where: { 
        productId, 
        status: 'active',
        isActive: true 
      },
      relations: ['components', 'components.component', 'operations'],
    });
  }

  async update(id: string, updateDto: UpdateBOMDto): Promise<BillOfMaterial> {
    const bom = await this.findOne(id);
    
    try {
      Object.assign(bom, {
        ...updateDto,
        components: undefined,
        operations: undefined,
      });
      
      await this.bomRepository.save(bom);

      // Update components if provided
      if (updateDto.components) {
        // Remove existing components
        await this.bomComponentRepository.delete({ bomId: id });
        
        // Add new components
        if (updateDto.components.length > 0) {
          const components = updateDto.components.map(comp => 
            this.bomComponentRepository.create({
              ...comp,
              bomId: id,
              totalCost: comp.quantity * (comp.unitCost || 0),
            })
          );
          await this.bomComponentRepository.save(components);
        }
      }

      // Update operations if provided
      if (updateDto.operations) {
        // Remove existing operations
        await this.bomOperationRepository.delete({ bomId: id });
        
        // Add new operations
        if (updateDto.operations.length > 0) {
          const operations = updateDto.operations.map(op => 
            this.bomOperationRepository.create({
              ...op,
              bomId: id,
              totalCost: (op.setupTime || 0 + op.operationTime || 0) * (op.hourlyRate || 0),
            })
          );
          await this.bomOperationRepository.save(operations);
        }
      }

      // Recalculate total cost
      await this.updateTotalCost(id);

      return await this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('BOM code already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<BillOfMaterial> {
    const bom = await this.findOne(id);
    bom.status = status;
    return await this.bomRepository.save(bom);
  }

  async remove(id: string): Promise<void> {
    const bom = await this.findOne(id);
    
    // Remove related components and operations (cascade should handle this)
    await this.bomComponentRepository.delete({ bomId: id });
    await this.bomOperationRepository.delete({ bomId: id });
    
    await this.bomRepository.remove(bom);
  }

  async addComponent(bomId: string, componentDto: CreateBOMComponentDto): Promise<BOMComponent> {
    const component = this.bomComponentRepository.create({
      ...componentDto,
      bomId,
      totalCost: componentDto.quantity * (componentDto.unitCost || 0),
    });
    
    const savedComponent = await this.bomComponentRepository.save(component);
    await this.updateTotalCost(bomId);
    
    return savedComponent;
  }

  async updateComponent(componentId: string, updateDto: Partial<CreateBOMComponentDto>): Promise<BOMComponent> {
    const component = await this.bomComponentRepository.findOne({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException(`BOM component with ID ${componentId} not found`);
    }

    Object.assign(component, updateDto);
    component.totalCost = component.quantity * (component.unitCost || 0);
    
    const savedComponent = await this.bomComponentRepository.save(component);
    await this.updateTotalCost(component.bomId);
    
    return savedComponent;
  }

  async removeComponent(componentId: string): Promise<void> {
    const component = await this.bomComponentRepository.findOne({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException(`BOM component with ID ${componentId} not found`);
    }

    const bomId = component.bomId;
    await this.bomComponentRepository.remove(component);
    await this.updateTotalCost(bomId);
  }

  async addOperation(bomId: string, operationDto: CreateBOMOperationDto): Promise<BOMOperation> {
    const operation = this.bomOperationRepository.create({
      ...operationDto,
      bomId,
      totalCost: (operationDto.setupTime || 0 + operationDto.operationTime || 0) * (operationDto.hourlyRate || 0),
    });
    
    const savedOperation = await this.bomOperationRepository.save(operation);
    await this.updateTotalCost(bomId);
    
    return savedOperation;
  }

  async updateOperation(operationId: string, updateDto: Partial<CreateBOMOperationDto>): Promise<BOMOperation> {
    const operation = await this.bomOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`BOM operation with ID ${operationId} not found`);
    }

    Object.assign(operation, updateDto);
    operation.totalCost = (operation.setupTime + operation.operationTime) * (operation.hourlyRate || 0);
    
    const savedOperation = await this.bomOperationRepository.save(operation);
    await this.updateTotalCost(operation.bomId);
    
    return savedOperation;
  }

  async removeOperation(operationId: string): Promise<void> {
    const operation = await this.bomOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`BOM operation with ID ${operationId} not found`);
    }

    const bomId = operation.bomId;
    await this.bomOperationRepository.remove(operation);
    await this.updateTotalCost(bomId);
  }

  private async updateTotalCost(bomId: string): Promise<void> {
    const bom = await this.bomRepository.findOne({
      where: { id: bomId },
      relations: ['components', 'operations'],
    });

    if (!bom) return;

    const componentsCost = bom.components?.reduce((sum, comp) => sum + comp.totalCost, 0) || 0;
    const operationsCost = bom.operations?.reduce((sum, op) => sum + op.totalCost, 0) || 0;
    
    bom.totalCost = componentsCost + operationsCost;
    await this.bomRepository.save(bom);
  }

  async calculateRequiredMaterials(bomId: string, quantityToProduce: number): Promise<any> {
    const bom = await this.findOne(bomId);
    
    const materialRequirements = bom.components.map(component => {
      const requiredQuantity = (component.quantity * quantityToProduce) / bom.productionQuantity;
      const wastageQuantity = requiredQuantity * (component.wastagePercentage / 100);
      const totalRequired = requiredQuantity + wastageQuantity;
      
      return {
        component: {
          id: component.component.id,
          code: component.component.itemCode,
          name: component.component.name,
          currentStock: component.component.currentStock,
        },
        unitRequirement: component.quantity,
        requiredQuantity,
        wastageQuantity,
        totalRequired,
        unit: component.unit,
        unitCost: component.unitCost,
        totalCost: totalRequired * component.unitCost,
        availability: component.component.currentStock >= totalRequired ? 'available' : 'shortage',
        shortage: Math.max(0, totalRequired - component.component.currentStock),
      };
    });

    return {
      bom: {
        id: bom.id,
        code: bom.bomCode,
        name: bom.name,
        product: bom.product.name,
      },
      production: {
        quantityToProduce,
        baseQuantity: bom.productionQuantity,
      },
      materials: materialRequirements,
      summary: {
        totalMaterials: materialRequirements.length,
        totalCost: materialRequirements.reduce((sum, mat) => sum + mat.totalCost, 0),
        shortages: materialRequirements.filter(mat => mat.availability === 'shortage').length,
        canProduce: materialRequirements.every(mat => mat.availability === 'available'),
      },
    };
  }

  async searchBOMs(searchTerm: string): Promise<BillOfMaterial[]> {
    return await this.bomRepository
      .createQueryBuilder('bom')
      .leftJoinAndSelect('bom.product', 'product')
      .where('bom.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('bom.bomCode ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('bom.name', 'ASC')
      .getMany();
  }
}
