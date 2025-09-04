import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('bill_of_materials')
export class BillOfMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  bomCode: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Item;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 3, default: 1 })
  productionQuantity: number; // Quantity this BOM produces

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  })
  status: string;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validTo: Date;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  setupTime: number; // in hours

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  operationTime: number; // in hours

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => BOMComponent, component => component.billOfMaterial, { cascade: true })
  components: BOMComponent[];

  @OneToMany(() => BOMOperation, operation => operation.billOfMaterial, { cascade: true })
  operations: BOMOperation[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bom_components')
export class BOMComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  bomId: string;

  @ManyToOne(() => BillOfMaterial, bom => bom.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bomId' })
  billOfMaterial: BillOfMaterial;

  @Column('uuid')
  componentId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'componentId' })
  component: Item;

  @Column('decimal', { precision: 10, scale: 3 })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  wastagePercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bom_operations')
export class BOMOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  bomId: string;

  @ManyToOne(() => BillOfMaterial, bom => bom.operations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bomId' })
  billOfMaterial: BillOfMaterial;

  @Column({ length: 200 })
  operationName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
  sequence: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  setupTime: number; // in hours

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  operationTime: number; // in hours per unit

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  hourlyRate: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ length: 100, nullable: true })
  workstation: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'json', nullable: true })
  qualityChecks: Record<string, any>[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
