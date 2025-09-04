import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

export interface CreateProductVariantDto {
  variantCode: string;
  variantName: string;
  parentItemId: string;
  attributes: Record<string, any>;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock?: number;
  maximumStock?: number;
  weight?: string;
  dimensions?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateProductVariantDto extends Partial<CreateProductVariantDto> {}

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(createDto: CreateProductVariantDto): Promise<ProductVariant> {
    try {
      const variant = this.productVariantRepository.create(createDto);
      return await this.productVariantRepository.save(variant);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('Variant code already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindManyOptions<ProductVariant>): Promise<ProductVariant[]> {
    return await this.productVariantRepository.find({
      relations: ['parentItem'],
      order: { createdAt: 'DESC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findOne({
      where: { id },
      relations: ['parentItem'],
    });

    if (!variant) {
      throw new NotFoundException(`Product variant with ID ${id} not found`);
    }

    return variant;
  }

  async findByParentItem(parentItemId: string): Promise<ProductVariant[]> {
    return await this.productVariantRepository.find({
      where: { parentItemId },
      relations: ['parentItem'],
      order: { variantName: 'ASC' },
    });
  }

  async findByBarcode(barcode: string): Promise<ProductVariant | null> {
    return await this.productVariantRepository.findOne({
      where: { barcode },
      relations: ['parentItem'],
    });
  }

  async update(id: string, updateDto: UpdateProductVariantDto): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    
    try {
      Object.assign(variant, updateDto);
      return await this.productVariantRepository.save(variant);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Variant code already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const variant = await this.findOne(id);
    await this.productVariantRepository.remove(variant);
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    
    if (operation === 'add') {
      variant.currentStock += quantity;
    } else {
      if (variant.currentStock < quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      variant.currentStock -= quantity;
    }

    return await this.productVariantRepository.save(variant);
  }

  async getLowStockVariants(): Promise<ProductVariant[]> {
    return await this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.parentItem', 'item')
      .where('variant.currentStock <= variant.minimumStock')
      .andWhere('variant.isActive = :isActive', { isActive: true })
      .orderBy('variant.currentStock', 'ASC')
      .getMany();
  }

  async searchVariants(searchTerm: string): Promise<ProductVariant[]> {
    return await this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.parentItem', 'item')
      .where('variant.variantName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('variant.variantCode ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('variant.sku ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('variant.barcode ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('variant.variantName', 'ASC')
      .getMany();
  }
}
