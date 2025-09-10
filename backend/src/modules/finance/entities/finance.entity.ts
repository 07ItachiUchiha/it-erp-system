import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientEmail?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ default: 'pending' })
  status: string; // pending, paid, overdue, draft, cancelled

  @Column('json', { nullable: true })
  items?: any[];

  @Column('jsonb', { nullable: true })
  gstInfo?: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    hsnCode?: string;
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  vendor?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected

  @Column({ nullable: true })
  receiptUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
