import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';
import { Batch } from './batch.entity';

@Entity('serials')
export class Serial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  serialNumber: string;

  @Column('uuid')
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid', { nullable: true })
  batchId: string;

  @ManyToOne(() => Batch, batch => batch.serials, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column({
    type: 'enum',
    enum: ['available', 'reserved', 'sold', 'damaged', 'returned', 'under_repair', 'scrapped'],
    default: 'available'
  })
  status: string;

  @Column({ type: 'date', nullable: true })
  manufacturingDate: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry: Date;

  @Column({ length: 100, nullable: true })
  supplier: string;

  @Column({ length: 50, nullable: true })
  purchaseOrderNumber: string;

  @Column('decimal', { precision: 10, scale: 2 })
  purchaseCost: number;

  @Column({ length: 100, nullable: true })
  warehouseLocation: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string; // Customer who purchased this serial

  @Column({ type: 'date', nullable: true })
  soldDate: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  soldPrice: number;

  @Column({ length: 50, nullable: true })
  salesOrderNumber: string;

  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

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
  serviceHistory: Record<string, any>[]; // Service and repair history

  @Column({ type: 'json', nullable: true })
  additionalAttributes: Record<string, any>; // Custom attributes

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
