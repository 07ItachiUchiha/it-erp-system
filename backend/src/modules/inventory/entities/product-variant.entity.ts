import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  variantCode: string;

  @Column({ length: 200 })
  variantName: string;

  @Column('uuid')
  parentItemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentItemId' })
  parentItem: Item;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, any>; // e.g., { color: 'Red', size: 'Large', material: 'Cotton' }

  @Column({ length: 20, nullable: true })
  sku: string;

  @Column({ length: 50, nullable: true })
  barcode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellingPrice: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  currentStock: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  minimumStock: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  maximumStock: number;

  @Column({ length: 10, default: 'kg' })
  weight: string;

  @Column({ length: 50, nullable: true })
  dimensions: string; // e.g., "10x20x30 cm"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
