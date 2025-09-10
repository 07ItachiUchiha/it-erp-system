import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, Expense } from './entities/bill.entity';
import { CreateInvoiceDto, CreateExpenseDto } from './dto/create-finance.dto';
import { GSTCalculationService } from './services/gst-calculation.service';
import { CustomerAddressService } from './services/customer-address.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly gstCalculationService: GSTCalculationService,
    private readonly customerAddressService: CustomerAddressService,
  ) {}

  // Enhanced Invoice operations
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Generate invoice number if not provided
    let invoiceNumber = createInvoiceDto.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = this.gstCalculationService.generateInvoiceNumber();
      // Ensure uniqueness
      const exists = await this.invoiceRepository.findOne({
        where: { generatedInvoiceNumber: invoiceNumber }
      });
      if (exists) {
        invoiceNumber = this.gstCalculationService.generateInvoiceNumber();
      }
    }

    // Calculate subtotal from items
    const subtotal = createInvoiceDto.items.reduce((sum, item) => sum + item.amount, 0);

    // Handle ship-to address
    let shipToAddress = createInvoiceDto.shipTo?.address;
    if (createInvoiceDto.shipTo?.useCustomerAddress && createInvoiceDto.shipTo?.customerAddressId) {
      const customerAddress = await this.customerAddressService.getAddressById(
        createInvoiceDto.shipTo.customerAddressId
      );
      shipToAddress = `${customerAddress.address}, ${customerAddress.city}, ${customerAddress.state} ${customerAddress.pincode}`;
    }

    // Calculate GST if tax is not optional
    let gstBreakup = null;
    let calculatedTotal = subtotal + (createInvoiceDto.shippingCharges || 0);

    if (createInvoiceDto.taxSettings.isTaxOptional) {
      if (createInvoiceDto.taxSettings.isManualOverride && createInvoiceDto.taxSettings.gstBreakup) {
        // Manual override
        gstBreakup = createInvoiceDto.taxSettings.gstBreakup;
        const totalTax = gstBreakup.cgst + gstBreakup.sgst + gstBreakup.igst + (gstBreakup.utgst || 0);
        calculatedTotal += totalTax;
      } else {
        // Auto-calculate GST
        const billToState = this.extractStateFromAddress(createInvoiceDto.billTo.address);
        const shipToState = shipToAddress ? this.extractStateFromAddress(shipToAddress) : billToState;
        
        const gstResult = this.gstCalculationService.calculateGST({
          billToState,
          shipToState,
          subtotal,
          shippingCharges: createInvoiceDto.shippingCharges || 0,
          taxRate: createInvoiceDto.taxSettings.taxRate
        });
        
        gstBreakup = gstResult.gstBreakup;
        calculatedTotal = gstResult.grandTotal;
      }
    }

    const invoice = this.invoiceRepository.create({
      invoiceNumber: createInvoiceDto.invoiceNumber || `LEGACY-${Date.now()}`,
      generatedInvoiceNumber: invoiceNumber,
      clientName: createInvoiceDto.clientName,
      billToName: createInvoiceDto.billTo.name,
      billToAddress: createInvoiceDto.billTo.address,
      billToGSTIN: createInvoiceDto.billTo.gstin,
      shipToAddress,
      subtotal,
      shippingCharges: createInvoiceDto.shippingCharges || 0,
      taxRate: createInvoiceDto.taxSettings.taxRate,
      isTaxOptional: createInvoiceDto.taxSettings.isTaxOptional,
      gstBreakup,
      calculatedTotal,
      amount: createInvoiceDto.amount || calculatedTotal, // For backward compatibility
      dueDate: createInvoiceDto.dueDate,
      status: createInvoiceDto.status || 'draft',
      // GST override audit fields
      gstOverriddenBy: createInvoiceDto.taxSettings.isManualOverride ? 'current-user-id' : null, // TODO: Get from JWT token
      gstOverrideReason: createInvoiceDto.taxSettings.overrideReason,
      gstOverriddenAt: createInvoiceDto.taxSettings.isManualOverride ? new Date() : null,
    });

    return await this.invoiceRepository.save(invoice);
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    invoice.status = status;
    return await this.invoiceRepository.save(invoice);
  }

  async removeInvoice(id: string): Promise<void> {
    const result = await this.invoiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
  }

  // Expense operations
  async createExpense(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create(createExpenseDto);
    return await this.expenseRepository.save(expense);
  }

  async findAllExpenses(): Promise<Expense[]> {
    return await this.expenseRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateExpenseStatus(id: string, status: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    expense.status = status;
    return await this.expenseRepository.save(expense);
  }

  async removeExpense(id: string): Promise<void> {
    const result = await this.expenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
  }

  // Analytics
  async getFinancialSummary(): Promise<any> {
    const totalRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(COALESCE(invoice.calculatedTotal, invoice.amount))', 'total')
      .getRawOne();

    const totalExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .getRawOne();

    const paidInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: 'paid' })
      .select('SUM(COALESCE(invoice.calculatedTotal, invoice.amount))', 'total')
      .getRawOne();

    // Enhanced analytics for GST
    const gstSummary = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'SUM((invoice.gstBreakup->>\'cgst\')::numeric) as totalCGST',
        'SUM((invoice.gstBreakup->>\'sgst\')::numeric) as totalSGST',
        'SUM((invoice.gstBreakup->>\'igst\')::numeric) as totalIGST',
        'COUNT(*) FILTER (WHERE invoice.isTaxOptional = false) as taxableInvoices',
        'COUNT(*) FILTER (WHERE invoice.gstOverriddenBy IS NOT NULL) as overriddenInvoices'
      ])
      .getRawOne();

    return {
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      totalExpenses: parseFloat(totalExpenses.total) || 0,
      paidRevenue: parseFloat(paidInvoices.total) || 0,
      netProfit: (parseFloat(paidInvoices.total) || 0) - (parseFloat(totalExpenses.total) || 0),
      // Enhanced GST analytics
      gstSummary: {
        totalCGST: parseFloat(gstSummary.totalcgst) || 0,
        totalSGST: parseFloat(gstSummary.totalsgst) || 0,
        totalIGST: parseFloat(gstSummary.totaligst) || 0,
        taxableInvoices: parseInt(gstSummary.taxableinvoices) || 0,
        overriddenInvoices: parseInt(gstSummary.overriddeninvoices) || 0,
      }
    };
  }

  /**
   * Extract state name from address string
   * This is a simple implementation - could be enhanced with better parsing
   */
  private extractStateFromAddress(address: string): string {
    // Common Indian state patterns
    const statePatterns = [
      'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh',
      'Telangana', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal',
      'Bihar', 'Odisha', 'Punjab', 'Haryana', 'Jharkhand', 'Assam', 'Uttarakhand',
      'Himachal Pradesh', 'Goa', 'Manipur', 'Meghalaya', 'Tripura', 'Mizoram',
      'Arunachal Pradesh', 'Nagaland', 'Sikkim', 'Chhattisgarh', 'Delhi'
    ];

    const addressUpper = address.toUpperCase();
    
    for (const state of statePatterns) {
      if (addressUpper.includes(state.toUpperCase())) {
        return state;
      }
    }

    // Default fallback - extract last word before pincode
    const parts = address.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 2]; // Assume state is second last part
      return lastPart;
    }

    return 'Unknown';
  }

  /**
   * Get invoice with enhanced details
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  /**
   * Update invoice with enhanced validation
   */
  async updateInvoice(id: string, updateData: Partial<CreateInvoiceDto>): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id);
    
    // If GST settings are being updated, recalculate
    if (updateData.taxSettings) {
      // Recalculate GST and totals
      const subtotal = invoice.subtotal;
      const shippingCharges = updateData.shippingCharges || invoice.shippingCharges;
      
      if (updateData.taxSettings.isTaxOptional) {
        if (updateData.taxSettings.isManualOverride && updateData.taxSettings.gstBreakup) {
          invoice.gstBreakup = updateData.taxSettings.gstBreakup;
          const totalTax = invoice.gstBreakup.cgst + invoice.gstBreakup.sgst + invoice.gstBreakup.igst + (invoice.gstBreakup.utgst || 0);
          invoice.calculatedTotal = subtotal + shippingCharges + totalTax;
          
          // Update override audit fields
          invoice.gstOverriddenBy = 'current-user-id'; // TODO: Get from JWT token
          invoice.gstOverrideReason = updateData.taxSettings.overrideReason;
          invoice.gstOverriddenAt = new Date();
        }
      }
    }

    Object.assign(invoice, updateData);
    return await this.invoiceRepository.save(invoice);
  }
}
