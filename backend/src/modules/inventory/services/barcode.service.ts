import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Barcode } from '../entities/barcode.entity';

export interface CreateBarcodeDto {
  barcodeValue: string;
  barcodeType: 'EAN13' | 'EAN8' | 'UPC_A' | 'UPC_E' | 'CODE128' | 'CODE39' | 'QR_CODE' | 'DATA_MATRIX';
  entityType: 'item' | 'variant' | 'batch' | 'serial';
  itemId?: string;
  variantId?: string;
  batchNumber?: string;
  serialNumber?: string;
  description?: string;
  isPrimary?: boolean;
  validFrom?: Date;
  validTo?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateBarcodeDto extends Partial<CreateBarcodeDto> {}

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Barcode)
    private barcodeRepository: Repository<Barcode>,
  ) {}

  async create(createDto: CreateBarcodeDto): Promise<Barcode> {
    try {
      const barcode = this.barcodeRepository.create(createDto);
      return await this.barcodeRepository.save(barcode);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('Barcode value already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindManyOptions<Barcode>): Promise<Barcode[]> {
    return await this.barcodeRepository.find({
      relations: ['item', 'variant'],
      order: { createdAt: 'DESC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<Barcode> {
    const barcode = await this.barcodeRepository.findOne({
      where: { id },
      relations: ['item', 'variant'],
    });

    if (!barcode) {
      throw new NotFoundException(`Barcode with ID ${id} not found`);
    }

    return barcode;
  }

  async findByValue(barcodeValue: string): Promise<Barcode | null> {
    return await this.barcodeRepository.findOne({
      where: { barcodeValue, isActive: true },
      relations: ['item', 'variant'],
    });
  }

  async findByItem(itemId: string): Promise<Barcode[]> {
    return await this.barcodeRepository.find({
      where: { itemId, isActive: true },
      relations: ['item'],
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async findByVariant(variantId: string): Promise<Barcode[]> {
    return await this.barcodeRepository.find({
      where: { variantId, isActive: true },
      relations: ['variant'],
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async scanBarcode(barcodeValue: string): Promise<any> {
    const barcode = await this.findByValue(barcodeValue);
    
    if (!barcode) {
      throw new NotFoundException(`Barcode ${barcodeValue} not found`);
    }

    // Return comprehensive scan result
    const result = {
      barcode: {
        id: barcode.id,
        value: barcode.barcodeValue,
        type: barcode.barcodeType,
        entityType: barcode.entityType,
      },
      entity: null as any,
    };

    if (barcode.item) {
      result.entity = {
        type: 'item',
        id: barcode.item.id,
        code: barcode.item.itemCode,
        name: barcode.item.name,
        currentStock: barcode.item.currentStock,
        unit: barcode.item.unit,
        sellingPrice: barcode.item.sellingPrice,
      };
    } else if (barcode.variant) {
      result.entity = {
        type: 'variant',
        id: barcode.variant.id,
        code: barcode.variant.variantCode,
        name: barcode.variant.variantName,
        currentStock: barcode.variant.currentStock,
        sellingPrice: barcode.variant.sellingPrice,
        attributes: barcode.variant.attributes,
      };
    }

    return result;
  }

  async update(id: string, updateDto: UpdateBarcodeDto): Promise<Barcode> {
    const barcode = await this.findOne(id);
    
    try {
      Object.assign(barcode, updateDto);
      return await this.barcodeRepository.save(barcode);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Barcode value already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const barcode = await this.findOne(id);
    await this.barcodeRepository.remove(barcode);
  }

  async generateBarcode(
    entityType: 'item' | 'variant',
    entityId: string,
    barcodeType: string = 'EAN13'
  ): Promise<Barcode> {
    // Generate a unique barcode value based on entity type and timestamp
    const timestamp = Date.now().toString();
    const prefix = entityType === 'item' ? '1' : '2';
    let barcodeValue: string;

    if (barcodeType === 'EAN13') {
      // Generate 13-digit EAN code
      const baseNumber = prefix + timestamp.slice(-11);
      const checkDigit = this.calculateEAN13CheckDigit(baseNumber);
      barcodeValue = baseNumber + checkDigit;
    } else {
      // For other types, use timestamp-based approach
      barcodeValue = prefix + timestamp + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    const createDto: CreateBarcodeDto = {
      barcodeValue,
      barcodeType: barcodeType as any,
      entityType,
      [entityType === 'item' ? 'itemId' : 'variantId']: entityId,
      isPrimary: true,
    };

    return await this.create(createDto);
  }

  private calculateEAN13CheckDigit(baseNumber: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(baseNumber[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  async bulkGenerate(items: Array<{id: string, type: 'item' | 'variant'}>): Promise<Barcode[]> {
    const barcodes: Barcode[] = [];
    
    for (const item of items) {
      try {
        const barcode = await this.generateBarcode(item.type, item.id);
        barcodes.push(barcode);
      } catch (error) {
        console.error(`Failed to generate barcode for ${item.type} ${item.id}:`, error.message);
      }
    }

    return barcodes;
  }
}
