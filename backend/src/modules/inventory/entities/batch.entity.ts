import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';
import { Serial } from './serial.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  batchNumber: string;

  @Column({ length: 50, nullable: true })
  lotNumber: string;

  @Column('uuid')
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ type: 'date' })
  manufacturingDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column('decimal', { precision: 10, scale: 3 })
  totalQuantity: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  usedQuantity: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column('decimal', { precision: 10, scale: 3 })
  availableQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costPerUnit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalValue: number;

  @Column({ length: 100, nullable: true })
  supplier: string;

  @Column({ length: 50, nullable: true })
  purchaseOrderNumber: string;

  @Column({ length: 50, nullable: true })
  warehouseLocation: string;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'quarantine', 'consumed', 'returned', 'damaged'],
    default: 'active'
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['passed', 'failed', 'pending', 'not_required'],
    default: 'not_required'
  })
  qualityStatus: string;

  @Column({ type: 'text', nullable: true })
  qualityNotes: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  additionalAttributes: Record<string, any>; // For custom fields like temperature, humidity, etc.

  @OneToMany(() => Serial, serial => serial.batch)
  serials: Serial[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
