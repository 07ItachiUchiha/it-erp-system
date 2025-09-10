import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as XLSX from 'xlsx';
import { Invoice } from '../entities/bill.entity';

export interface ExportFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  customerId?: string;
  format: 'excel' | 'csv';
}

@Injectable()
export class InvoiceExportService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * Export invoices to Excel/CSV format
   */
  async exportInvoices(filters: ExportFilter): Promise<Buffer> {
    // Build query based on filters
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      queryBuilder.andWhere('invoice.clientName = :customerId', { customerId: filters.customerId });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('invoice.createdAt', 'DESC');

    const invoices = await queryBuilder.getMany();

    // Transform data for export
    const exportData = this.transformInvoicesForExport(invoices);

    // Generate file based on format
    if (filters.format === 'excel') {
      return this.generateExcelFile(exportData);
    } else {
      return this.generateCSVFile(exportData);
    }
  }

  /**
   * Transform invoice data for export
   */
  private transformInvoicesForExport(invoices: Invoice[]): any[] {
    return invoices.map(invoice => ({
      'Invoice Number': invoice.generatedInvoiceNumber || invoice.invoiceNumber,
      'Legacy Invoice Number': invoice.invoiceNumber,
      'Client Name': invoice.clientName,
      'Bill To Name': invoice.billToName || 'N/A',
      'Bill To Address': invoice.billToAddress || 'N/A',
      'Bill To GSTIN': invoice.billToGSTIN || 'N/A',
      'Ship To Address': invoice.shipToAddress || 'Same as Bill To',
      'Subtotal': invoice.subtotal || 0,
      'Shipping Charges': invoice.shippingCharges || 0,
      'Tax Rate (%)': invoice.taxRate || 0,
      'Is Tax Optional': invoice.isTaxOptional ? 'Yes' : 'No',
      'CGST': invoice.gstBreakup?.cgst || 0,
      'SGST': invoice.gstBreakup?.sgst || 0,
      'IGST': invoice.gstBreakup?.igst || 0,
      'UTGST': invoice.gstBreakup?.utgst || 0,
      'Total Tax': this.calculateTotalTax(invoice.gstBreakup),
      'Calculated Total': invoice.calculatedTotal || invoice.amount,
      'Legacy Amount': invoice.amount,
      'Due Date': invoice.dueDate,
      'Status': invoice.status,
      'GST Override By': invoice.gstOverriddenBy || 'System Calculated',
      'GST Override Reason': invoice.gstOverrideReason || 'N/A',
      'GST Override Date': invoice.gstOverriddenAt || 'N/A',
      'Created Date': invoice.createdAt.toISOString().split('T')[0],
      'Updated Date': invoice.updatedAt.toISOString().split('T')[0],
    }));
  }

  /**
   * Generate Excel file
   */
  private generateExcelFile(data: any[]): Buffer {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // Invoice Number
      { wch: 20 }, // Legacy Invoice Number
      { wch: 25 }, // Client Name
      { wch: 25 }, // Bill To Name
      { wch: 40 }, // Bill To Address
      { wch: 15 }, // Bill To GSTIN
      { wch: 40 }, // Ship To Address
      { wch: 12 }, // Subtotal
      { wch: 15 }, // Shipping Charges
      { wch: 12 }, // Tax Rate
      { wch: 15 }, // Is Tax Optional
      { wch: 10 }, // CGST
      { wch: 10 }, // SGST
      { wch: 10 }, // IGST
      { wch: 10 }, // UTGST
      { wch: 12 }, // Total Tax
      { wch: 15 }, // Calculated Total
      { wch: 12 }, // Legacy Amount
      { wch: 12 }, // Due Date
      { wch: 10 }, // Status
      { wch: 20 }, // GST Override By
      { wch: 30 }, // GST Override Reason
      { wch: 15 }, // GST Override Date
      { wch: 12 }, // Created Date
      { wch: 12 }, // Updated Date
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    // Add summary sheet
    const summaryData = this.generateSummaryData(data);
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate CSV file
   */
  private generateCSVFile(data: any[]): Buffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    // Generate CSV buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
  }

  /**
   * Generate summary data for Excel export
   */
  private generateSummaryData(data: any[]): any[] {
    const totalInvoices = data.length;
    const totalAmount = data.reduce((sum, invoice) => sum + (parseFloat(invoice['Calculated Total']) || 0), 0);
    const totalTax = data.reduce((sum, invoice) => sum + (parseFloat(invoice['Total Tax']) || 0), 0);
    const totalShipping = data.reduce((sum, invoice) => sum + (parseFloat(invoice['Shipping Charges']) || 0), 0);

    // Status breakdown
    const statusCounts = data.reduce((acc, invoice) => {
      const status = invoice['Status'];
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Tax optional breakdown
    const taxOptionalCount = data.filter(inv => inv['Is Tax Optional'] === 'Yes').length;
    const taxAppliedCount = totalInvoices - taxOptionalCount;

    return [
      { Metric: 'Total Invoices', Value: totalInvoices },
      { Metric: 'Total Amount (₹)', Value: totalAmount.toFixed(2) },
      { Metric: 'Total Tax Amount (₹)', Value: totalTax.toFixed(2) },
      { Metric: 'Total Shipping Charges (₹)', Value: totalShipping.toFixed(2) },
      { Metric: 'Average Invoice Value (₹)', Value: totalInvoices > 0 ? (totalAmount / totalInvoices).toFixed(2) : 0 },
      { Metric: '', Value: '' }, // Empty row
      { Metric: 'Status Breakdown', Value: '' },
      ...Object.entries(statusCounts).map(([status, count]) => ({
        Metric: `  ${status}`,
        Value: count
      })),
      { Metric: '', Value: '' }, // Empty row
      { Metric: 'Tax Breakdown', Value: '' },
      { Metric: '  Tax Applied', Value: taxAppliedCount },
      { Metric: '  Tax Optional', Value: taxOptionalCount },
    ];
  }

  /**
   * Calculate total tax from GST breakup
   */
  private calculateTotalTax(gstBreakup: any): number {
    if (!gstBreakup) return 0;
    return (gstBreakup.cgst || 0) + (gstBreakup.sgst || 0) + (gstBreakup.igst || 0) + (gstBreakup.utgst || 0);
  }

  /**
   * Get export statistics
   */
  async getExportStatistics(filters: ExportFilter): Promise<{
    totalRecords: number;
    estimatedFileSize: string;
    processingTime: string;
  }> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    const totalRecords = await queryBuilder.getCount();

    // Estimate file size (rough calculation)
    const estimatedSizeKB = totalRecords * 1.5; // ~1.5KB per record
    const estimatedFileSize = estimatedSizeKB > 1024 
      ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
      : `${estimatedSizeKB.toFixed(0)} KB`;

    // Estimate processing time (rough calculation)
    const estimatedTimeSeconds = Math.ceil(totalRecords / 1000) * 2; // ~2 seconds per 1000 records
    const processingTime = estimatedTimeSeconds > 60
      ? `${Math.ceil(estimatedTimeSeconds / 60)} minutes`
      : `${estimatedTimeSeconds} seconds`;

    return {
      totalRecords,
      estimatedFileSize,
      processingTime,
    };
  }
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';