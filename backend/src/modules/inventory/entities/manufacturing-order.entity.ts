import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';
import { Workstation } from './workstation.entity';
import { BillOfMaterial } from './bill-of-material.entity';

@Entity('manufacturing_orders')
export class ManufacturingOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  moNumber: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Item;

  @Column('uuid', { nullable: true })
  bomId: string;

  @ManyToOne(() => BillOfMaterial, { nullable: true })
  @JoinColumn({ name: 'bomId' })
  billOfMaterial: BillOfMaterial;

  @Column('uuid', { nullable: true })
  workstationId: string;

  @ManyToOne(() => Workstation, workstation => workstation.manufacturingOrders, { nullable: true })
  @JoinColumn({ name: 'workstationId' })
  workstation: Workstation;

  @Column('decimal', { precision: 10, scale: 3 })
  quantityToProduce: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  quantityProduced: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  quantityConsumed: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'confirmed', 'in_progress', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  })
  priority: string;

  @Column({ type: 'date', nullable: true })
  plannedStartDate: Date;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndDate: Date;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  estimatedHours: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  actualHours: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  actualCost: number;

  @Column({ length: 100, nullable: true })
  responsiblePerson: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  operations: Record<string, any>[]; // Manufacturing operations/steps

  @Column({ type: 'json', nullable: true })
  qualityChecks: Record<string, any>[]; // Quality control checkpoints

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
