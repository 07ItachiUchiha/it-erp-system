import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { Batch } from './batch.entity';
import { Serial } from './serial.entity';
import { ProductVariant } from './product-variant.entity';
import { Barcode } from './barcode.entity';
import { BillOfMaterial } from './bill-of-material.entity';
import { ManufacturingOrder } from './manufacturing-order.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  itemCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['product', 'service', 'asset'],
    default: 'product'
  })
  type: string;

  @Column({ length: 50 })
  category: string;

  @Column({ length: 50, nullable: true })
  subcategory: string;

  @Column({ length: 20 })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2 })
  standardCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellingPrice: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  currentStock: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  minimumStock: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  maximumStock: number;

  @Column({ default: false })
  isBatchTracked: boolean;

  @Column({ default: false })
  isSerialTracked: boolean;

  @Column({ default: false })
  hasVariants: boolean;

  @Column({ default: false })
  canBeManufactured: boolean;

  @Column({ default: false })
  canBePurchased: boolean;

  @Column({ default: false })
  canBeSold: boolean;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'json', nullable: true })
  images: string[]; // Multiple images

  @Column('decimal', { precision: 8, scale: 3, nullable: true })
  weight: number; // in kg

  @Column({ length: 50, nullable: true })
  dimensions: string; // e.g., "10x20x30 cm"

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  specifications: any;

  @Column({ length: 20, nullable: true })
  hsnCode: string; // For Indian GST compliance

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  gstRate: number; // GST rate in percentage

  @OneToMany(() => StockMovement, stockMovement => stockMovement.item)
  stockMovements: StockMovement[];

  @OneToMany(() => Batch, batch => batch.item)
  batches: Batch[];

  @OneToMany(() => Serial, serial => serial.item)
  serials: Serial[];

  @OneToMany(() => ProductVariant, variant => variant.parentItem)
  variants: ProductVariant[];

  @OneToMany(() => Barcode, barcode => barcode.item)
  barcodes: Barcode[];

  @OneToMany(() => BillOfMaterial, bom => bom.product)
  billOfMaterials: BillOfMaterial[];

  @OneToMany(() => ManufacturingOrder, mo => mo.product)
  manufacturingOrders: ManufacturingOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
