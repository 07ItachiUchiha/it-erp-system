import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  clientName: string;

  @Column({ nullable: false })
  clientEmail: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'timestamp' })
  dueDate: string;

  @Column({ default: 'draft' })
  status: string; // draft, sent, paid, overdue, cancelled

  @Column({ type: 'uuid' })
  createdBy: string;

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

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  gstAmount: number;

  @Column({ type: 'timestamp', name: 'expenseDate' })
  expenseDate: string;

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected

  @Column({ type: 'uuid' })
  submittedBy: string;

  @Column({ nullable: true })
  receiptUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  billNumber: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorEmail?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  gstAmount: number;

  @Column({ type: 'timestamp' })
  billDate: string;

  @Column({ type: 'timestamp' })
  dueDate: string;

  @Column({ default: 'pending' })
  status: string; // pending, paid, overdue, cancelled

  @Column({ type: 'timestamp', nullable: true })
  paidDate?: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column('json', { nullable: true })
  items?: any[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
