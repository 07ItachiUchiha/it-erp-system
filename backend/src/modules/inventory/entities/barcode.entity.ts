import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('barcodes')
export class Barcode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  barcodeValue: string;

  @Column({
    type: 'enum',
    enum: ['EAN13', 'EAN8', 'UPC_A', 'UPC_E', 'CODE128', 'CODE39', 'QR_CODE', 'DATA_MATRIX'],
    default: 'EAN13'
  })
  barcodeType: string;

  @Column({
    type: 'enum',
    enum: ['item', 'variant', 'batch', 'serial'],
    default: 'item'
  })
  entityType: string;

  @Column('uuid', { nullable: true })
  itemId: string;

  @ManyToOne(() => Item, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid', { nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ length: 50, nullable: true })
  batchNumber: string;

  @Column({ length: 50, nullable: true })
  serialNumber: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isPrimary: boolean; // Main barcode for the item

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validTo: Date;

  @Column({ type: 'text', nullable: true })
  imageUrl: string; // URL to barcode image

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional barcode data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
