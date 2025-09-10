import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ExportConfiguration, ExportJob, ExportFormat, ExportJobStatus } from '../entities/export.entity';
import { Invoice } from '../entities/bill.entity';
import * as XLSX from 'exceljs';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface CreateExportConfigurationDto {
  name: string;
  description?: string;
  format: ExportFormat;
  template: any;
  filters?: any;
  columns: any;
  createdBy: string;
}

export interface CreateExportJobDto {
  configurationId?: string;
  format: ExportFormat;
  filters?: any;
  requestedBy: string;
}

export interface ExportFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable()
export class AdvancedExportService {
  constructor(
    @InjectRepository(ExportConfiguration)
    private exportConfigRepository: Repository<ExportConfiguration>,
    @InjectRepository(ExportJob)
    private exportJobRepository: Repository<ExportJob>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * Create export configuration
   */
  async createConfiguration(createDto: CreateExportConfigurationDto): Promise<ExportConfiguration> {
    // Check if configuration name already exists
    const existingConfig = await this.exportConfigRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingConfig) {
      throw new Error(`Export configuration with name "${createDto.name}" already exists`);
    }

    const config = this.exportConfigRepository.create(createDto);
    return this.exportConfigRepository.save(config);
  }

  /**
   * Get export configurations
   */
  async getConfigurations(format?: ExportFormat, isActive?: boolean) {
    const where: any = {};
    if (format) where.format = format;
    if (isActive !== undefined) where.isActive = isActive;

    return this.exportConfigRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  /**
   * Create export job
   */
  async createExportJob(createDto: CreateExportJobDto): Promise<ExportJob> {
    let configuration: ExportConfiguration | undefined;
    
    if (createDto.configurationId) {
      configuration = await this.exportConfigRepository.findOne({
        where: { id: createDto.configurationId }
      });
      if (!configuration) {
        throw new Error('Export configuration not found');
      }
    }

    const exportJob = this.exportJobRepository.create(createDto);
    return this.exportJobRepository.save(exportJob);
  }

  /**
   * Process export job
   */
  async processExportJob(jobId: string): Promise<string> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId },
      relations: ['configuration']
    });

    if (!job) {
      throw new Error('Export job not found');
    }

    if (job.status !== ExportJobStatus.PENDING) {
      throw new Error('Export job is not in pending status');
    }

    try {
      job.markAsStarted();
      await this.exportJobRepository.save(job);

      // Get data to export
      const data = await this.getExportData(job);
      job.totalRecords = data.length;
      await this.exportJobRepository.save(job);

      // Generate file based on format
      let filePath: string;
      switch (job.format) {
        case ExportFormat.EXCEL:
          filePath = await this.generateExcelFile(job, data);
          break;
        case ExportFormat.CSV:
          filePath = await this.generateCSVFile(job, data);
          break;
        case ExportFormat.PDF:
          filePath = await this.generatePDFFile(job, data);
          break;
        default:
          throw new Error(`Unsupported export format: ${job.format}`);
      }

      const fileStats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      job.markAsCompleted(filePath, fileName, fileStats.size);
      await this.exportJobRepository.save(job);

      return filePath;
    } catch (error) {
      job.markAsFailed(error.message);
      await this.exportJobRepository.save(job);
      throw error;
    }
  }

  /**
   * Get export data based on job configuration
   */
  private async getExportData(job: ExportJob): Promise<any[]> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    // Apply filters from job or configuration
    const filters = job.filters || job.configuration?.filters || {};

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      queryBuilder.andWhere('invoice.clientName = :clientName', { clientName: filters.customerId });
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('invoice.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      queryBuilder.andWhere('invoice.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    return queryBuilder.getMany();
  }

  /**
   * Generate Excel file
   */
  private async generateExcelFile(job: ExportJob, data: any[]): Promise<string> {
    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    // Get column configuration
    const columns = job.configuration?.columns || this.getDefaultColumns();
    
    // Set up headers
    const headers = Object.keys(columns).map(key => columns[key].header || key);
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach((item, index) => {
      const row = Object.keys(columns).map(key => {
        const column = columns[key];
        let value = this.getNestedValue(item, key);

        // Apply formatting if specified
        if (column.format && value !== null && value !== undefined) {
          switch (column.format) {
            case 'currency':
              value = Number(value).toFixed(2);
              break;
            case 'date':
              value = new Date(value).toLocaleDateString();
              break;
            case 'datetime':
              value = new Date(value).toLocaleString();
              break;
          }
        }

        return value;
      });

      worksheet.addRow(row);

      // Update progress
      job.processedRecords = index + 1;
      job.updateProgress(job.processedRecords, job.totalRecords);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        const maxLength = Math.max(
          ...column.values.map(value => 
            value ? String(value).length : 0
          )
        );
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Generate filename and save
    const timestamp = Date.now();
    const fileName = `invoices_export_${timestamp}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    await fs.ensureDir(uploadsDir);
    const filePath = path.join(uploadsDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate CSV file
   */
  private async generateCSVFile(job: ExportJob, data: any[]): Promise<string> {
    const columns = job.configuration?.columns || this.getDefaultColumns();
    
    // Create CSV header
    const headers = Object.keys(columns).map(key => columns[key].header || key);
    let csvContent = headers.join(',') + '\n';

    // Add data rows
    data.forEach((item, index) => {
      const row = Object.keys(columns).map(key => {
        let value = this.getNestedValue(item, key);
        
        // Format value
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        
        return value;
      });

      csvContent += row.join(',') + '\n';

      // Update progress
      job.processedRecords = index + 1;
      job.updateProgress(job.processedRecords, job.totalRecords);
    });

    // Generate filename and save
    const timestamp = Date.now();
    const fileName = `invoices_export_${timestamp}.csv`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    await fs.ensureDir(uploadsDir);
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, csvContent, 'utf8');
    return filePath;
  }

  /**
   * Generate PDF file (simplified version)
   */
  private async generatePDFFile(job: ExportJob, data: any[]): Promise<string> {
    // For now, we'll create a simple HTML and convert to PDF
    // In a real implementation, you might want to use the PrintService
    const html = this.generateHTMLReport(data, job.configuration?.columns);
    
    // This would need Puppeteer for PDF generation
    // For now, save as HTML file
    const timestamp = Date.now();
    const fileName = `invoices_export_${timestamp}.html`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    await fs.ensureDir(uploadsDir);
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, html, 'utf8');
    return filePath;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(data: any[], columns?: any): string {
    const cols = columns || this.getDefaultColumns();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Export Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .currency { text-align: right; }
          .date { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Invoice Export Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${data.length}</p>
        <table>
          <thead>
            <tr>
    `;

    // Add headers
    Object.keys(cols).forEach(key => {
      html += `<th>${cols[key].header || key}</th>`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    // Add data rows
    data.forEach(item => {
      html += '<tr>';
      Object.keys(cols).forEach(key => {
        let value = this.getNestedValue(item, key);
        const cssClass = cols[key].format === 'currency' ? 'currency' : 
                        cols[key].format === 'date' ? 'date' : '';
        
        if (value === null || value === undefined) {
          value = '';
        } else if (cols[key].format === 'currency') {
          value = Number(value).toFixed(2);
        } else if (cols[key].format === 'date') {
          value = new Date(value).toLocaleDateString();
        }

        html += `<td class="${cssClass}">${value}</td>`;
      });
      html += '</tr>';
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Get default column configuration
   */
  private getDefaultColumns() {
    return {
      invoiceNumber: { header: 'Invoice Number', format: 'text' },
      clientName: { header: 'Client Name', format: 'text' },
      amount: { header: 'Amount', format: 'currency' },
      status: { header: 'Status', format: 'text' },
      dueDate: { header: 'Due Date', format: 'date' },
      createdAt: { header: 'Created At', format: 'date' }
    };
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get export job status
   */
  async getExportJobStatus(jobId: string): Promise<ExportJob | null> {
    return this.exportJobRepository.findOne({
      where: { id: jobId },
      relations: ['configuration']
    });
  }

  /**
   * Get user export jobs
   */
  async getUserExportJobs(userId: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.exportJobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.configuration', 'config')
      .where('job.requestedBy = :userId', { userId })
      .orderBy('job.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [jobs, total] = await queryBuilder.getManyAndCount();

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Download export job file
   */
  async downloadExportJob(jobId: string, userId: string): Promise<{ filePath: string; fileName: string }> {
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId, requestedBy: userId }
    });

    if (!job) {
      throw new Error('Export job not found');
    }

    if (!job.isDownloadable) {
      throw new Error('Export job is not available for download');
    }

    // Increment download count
    job.incrementDownloadCount();
    await this.exportJobRepository.save(job);

    return {
      filePath: job.filePath!,
      fileName: job.fileName!
    };
  }

  /**
   * Clean up expired export jobs
   */
  async cleanupExpiredJobs(): Promise<number> {
    const expiredJobs = await this.exportJobRepository.find({
      where: {
        status: ExportJobStatus.COMPLETED,
        expiresAt: { $lt: new Date() } as any
      }
    });

    let deletedCount = 0;
    for (const job of expiredJobs) {
      try {
        if (job.filePath && await fs.pathExists(job.filePath)) {
          await fs.remove(job.filePath);
        }
        await this.exportJobRepository.remove(job);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to clean up export job ${job.id}:`, error);
      }
    }

    return deletedCount;
  }
}
