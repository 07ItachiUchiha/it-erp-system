import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Invoice, Expense } from './entities/finance.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  // ==============================
  // INVOICE MANAGEMENT (Unified)
  // ==============================

  async createInvoice(createInvoiceDto: any): Promise<Invoice> {
    // Generate invoice number if not provided
    let invoiceNumber = createInvoiceDto.invoiceNumber;
    if (!invoiceNumber) {
      const count = await this.invoiceRepository.count();
      invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }

    // Calculate finalAmount if not provided
    let finalAmount = createInvoiceDto.finalAmount;
    if (!finalAmount) {
      const amount = createInvoiceDto.amount || 0;
      const tax = createInvoiceDto.tax || 0;
      const discount = createInvoiceDto.discount || 0;
      finalAmount = amount + tax - discount;
    }

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoiceNumber,
      finalAmount,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    return Array.isArray(savedInvoice) ? savedInvoice[0] : savedInvoice;
  }

  async findAllInvoices(page = 1, limit = 10, search?: string, status?: string): Promise<{
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.clientName ILIKE :search OR invoice.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    queryBuilder.orderBy('invoice.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async updateInvoice(id: string, updateInvoiceDto: any): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);

    // Recalculate finalAmount if amount, tax, or discount changes
    if (updateInvoiceDto.amount !== undefined || 
        updateInvoiceDto.tax !== undefined || 
        updateInvoiceDto.discount !== undefined) {
      const amount = updateInvoiceDto.amount !== undefined ? updateInvoiceDto.amount : invoice.amount;
      const tax = updateInvoiceDto.tax !== undefined ? updateInvoiceDto.tax : invoice.tax;
      const discount = updateInvoiceDto.discount !== undefined ? updateInvoiceDto.discount : invoice.discount;
      updateInvoiceDto.finalAmount = amount + tax - discount;
    }

    Object.assign(invoice, updateInvoiceDto);
    const savedInvoice = await this.invoiceRepository.save(invoice);
    return Array.isArray(savedInvoice) ? savedInvoice[0] : savedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    const result = await this.invoiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
  }

  async bulkUpdateInvoices(invoiceIds: string[], updateData: any): Promise<{ updated: number }> {
    const result = await this.invoiceRepository.update(invoiceIds, updateData);
    return { updated: result.affected || 0 };
  }

  async bulkDeleteInvoices(invoiceIds: string[]): Promise<{ deleted: number }> {
    const result = await this.invoiceRepository.delete(invoiceIds);
    return { deleted: result.affected || 0 };
  }

  async duplicateInvoice(id: string): Promise<Invoice> {
    const originalInvoice = await this.findInvoiceById(id);
    const count = await this.invoiceRepository.count();
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const { id: _, createdAt, updatedAt, ...invoiceData } = originalInvoice;
    
    const duplicatedInvoice = this.invoiceRepository.create({
      ...invoiceData,
      invoiceNumber: newInvoiceNumber,
      status: 'draft',
    });

    return await this.invoiceRepository.save(duplicatedInvoice);
  }

  async getInvoiceStatistics(): Promise<any> {
    const [
      total,
      sent,
      paid,
      overdue,
      draft,
      totalRevenue,
      monthlyRevenue
    ] = await Promise.all([
      this.invoiceRepository.count(),
      this.invoiceRepository.count({ where: { status: 'sent' } }),
      this.invoiceRepository.count({ where: { status: 'paid' } }),
      this.invoiceRepository.count({ where: { status: 'overdue' } }),
      this.invoiceRepository.count({ where: { status: 'draft' } }),
      this.invoiceRepository.createQueryBuilder('invoice')
        .select('SUM(invoice.finalAmount)', 'total')
        .where('invoice.status = :status', { status: 'paid' })
        .getRawOne(),
      this.invoiceRepository.createQueryBuilder('invoice')
        .select('SUM(invoice.finalAmount)', 'total')
        .where('invoice.status = :status AND invoice.createdAt >= :startDate', {
          status: 'paid',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        })
        .getRawOne()
    ]);

    return {
      totalInvoices: total,
      sentInvoices: sent,
      paidInvoices: paid,
      overdueInvoices: overdue,
      draftInvoices: draft,
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      monthlyRevenue: parseFloat(monthlyRevenue?.total || '0'),
    };
  }

  // ==============================
  // EXPENSE MANAGEMENT
  // ==============================

  async createExpense(createExpenseDto: any): Promise<Expense> {
    const expense = this.expenseRepository.create(createExpenseDto);
    const savedExpense = await this.expenseRepository.save(expense);
    return Array.isArray(savedExpense) ? savedExpense[0] : savedExpense;
  }

  async findAllExpenses(page = 1, limit = 10, search?: string, category?: string): Promise<{
    data: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (search) {
      queryBuilder.andWhere(
        '(expense.description ILIKE :search OR expense.vendor ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('expense.category = :category', { category });
    }

    queryBuilder.orderBy('expense.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findExpenseById(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async updateExpense(id: string, updateExpenseDto: any): Promise<Expense> {
    const expense = await this.findExpenseById(id);
    Object.assign(expense, updateExpenseDto);
    const savedExpense = await this.expenseRepository.save(expense);
    return Array.isArray(savedExpense) ? savedExpense[0] : savedExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    const result = await this.expenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
  }

  async getExpenseStatistics(): Promise<any> {
    const [
      total,
      pending,
      approved,
      rejected,
      totalAmount,
      monthlyAmount,
      categorySummary
    ] = await Promise.all([
      this.expenseRepository.count(),
      this.expenseRepository.count({ where: { status: 'pending' } }),
      this.expenseRepository.count({ where: { status: 'approved' } }),
      this.expenseRepository.count({ where: { status: 'rejected' } }),
      this.expenseRepository.createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.status = :status', { status: 'approved' })
        .getRawOne(),
      this.expenseRepository.createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.status = :status AND expense.createdAt >= :startDate', {
          status: 'approved',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        })
        .getRawOne(),
      this.expenseRepository.createQueryBuilder('expense')
        .select('expense.category', 'category')
        .addSelect('SUM(expense.amount)', 'total')
        .addSelect('COUNT(*)', 'count')
        .where('expense.status = :status', { status: 'approved' })
        .groupBy('expense.category')
        .getRawMany()
    ]);

    return {
      totalExpenses: total,
      pendingExpenses: pending,
      approvedExpenses: approved,
      rejectedExpenses: rejected,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      monthlyAmount: parseFloat(monthlyAmount?.total || '0'),
      categorySummary: categorySummary.map(item => ({
        category: item.category,
        total: parseFloat(item.total),
        count: parseInt(item.count)
      })),
    };
  }

  // ==============================
  // GST MANAGEMENT
  // ==============================

  async calculateGST(calculationData: {
    amount: number;
    gstRate: number;
    calculationType: 'inclusive' | 'exclusive';
    place: string;
    businessType: 'b2b' | 'b2c' | 'export';
  }): Promise<any> {
    const { amount, gstRate, calculationType, place, businessType } = calculationData;
    
    let cgst = 0, sgst = 0, igst = 0, totalAmount = 0, taxableAmount = 0;

    if (calculationType === 'inclusive') {
      taxableAmount = amount / (1 + gstRate / 100);
      const totalGst = amount - taxableAmount;
      
      if (businessType === 'export') {
        // No GST for exports
        cgst = sgst = igst = 0;
        totalAmount = taxableAmount;
      } else {
        // For interstate transactions
        if (place.toLowerCase() !== 'karnataka') {
          igst = totalGst;
        } else {
          cgst = totalGst / 2;
          sgst = totalGst / 2;
        }
        totalAmount = amount;
      }
    } else {
      taxableAmount = amount;
      const totalGst = (amount * gstRate) / 100;
      
      if (businessType === 'export') {
        cgst = sgst = igst = 0;
        totalAmount = taxableAmount;
      } else {
        if (place.toLowerCase() !== 'karnataka') {
          igst = totalGst;
        } else {
          cgst = totalGst / 2;
          sgst = totalGst / 2;
        }
        totalAmount = taxableAmount + totalGst;
      }
    }

    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalGst: Math.round((cgst + sgst + igst) * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstRate,
      calculationType,
      place,
      businessType,
    };
  }

  // ==============================
  // DASHBOARD & ANALYTICS
  // ==============================

  async getDashboardStats(): Promise<any> {
    const [invoiceStats, expenseStats] = await Promise.all([
      this.getInvoiceStatistics(),
      this.getExpenseStatistics(),
    ]);

    return {
      ...invoiceStats,
      ...expenseStats,
      netIncome: invoiceStats.totalRevenue - expenseStats.totalAmount,
      monthlyNetIncome: invoiceStats.monthlyRevenue - expenseStats.monthlyAmount,
    };
  }

  async getRecentActivities(limit = 10): Promise<any[]> {
    const [recentInvoices, recentExpenses] = await Promise.all([
      this.invoiceRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
        select: ['id', 'invoiceNumber', 'clientName', 'amount', 'status', 'createdAt']
      }),
      this.expenseRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
        select: ['id', 'description', 'amount', 'category', 'status', 'createdAt']
      }),
    ]);

    const activities = [
      ...recentInvoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        title: `Invoice ${invoice.invoiceNumber}`,
        description: `${invoice.clientName} - ₹${invoice.amount}`,
        status: invoice.status,
        createdAt: invoice.createdAt,
      })),
      ...recentExpenses.map(expense => ({
        id: expense.id,
        type: 'expense',
        title: expense.description,
        description: `${expense.category} - ₹${expense.amount}`,
        status: expense.status,
        createdAt: expense.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}
