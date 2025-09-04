import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ManufacturingOrder } from './manufacturing-order.entity';

@Entity('workstations')
export class Workstation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  workstationCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['manual', 'semi_automatic', 'automatic', 'cnc', 'assembly', 'quality_check', 'packaging'],
    default: 'manual'
  })
  type: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  hourlyRate: number; // Cost per hour

  @Column({ default: 1 })
  capacity: number; // How many operations can run simultaneously

  @Column({ default: 8 })
  hoursPerDay: number;

  @Column({ default: 5 })
  workingDaysPerWeek: number;

  @Column('decimal', { precision: 5, scale: 2, default: 85.0 })
  efficiency: number; // Efficiency percentage

  @Column({ type: 'json', nullable: true })
  capabilities: string[]; // e.g., ['cutting', 'drilling', 'welding']

  @Column({ type: 'json', nullable: true })
  equipment: Record<string, any>; // Equipment details

  @Column({ type: 'json', nullable: true })
  maintenanceSchedule: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['operational', 'maintenance', 'breakdown', 'idle'],
    default: 'operational'
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ManufacturingOrder, mo => mo.workstation)
  manufacturingOrders: ManufacturingOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
