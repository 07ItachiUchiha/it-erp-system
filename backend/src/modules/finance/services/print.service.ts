import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrintTemplate, PrintJob, PrintTemplateType, PrintJobStatus } from '../entities/print.entity';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface CreatePrintTemplateDto {
  name: string;
  description?: string;
  templateType: PrintTemplateType;
  content: string;
  styles?: string;
  paperSize?: string;
  orientation?: string;
  margins?: any;
  headerContent?: string;
  footerContent?: string;
  createdBy: string;
}

export interface CreatePrintJobDto {
  templateId?: string;
  entityType: string;
  entityId?: string;
  entityIds?: string[];
  customTemplate?: string;
  renderOptions?: any;
  requestedBy: string;
}

export interface PrintOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
}

@Injectable()
export class PrintService {
  constructor(
    @InjectRepository(PrintTemplate)
    private printTemplateRepository: Repository<PrintTemplate>,
    @InjectRepository(PrintJob)
    private printJobRepository: Repository<PrintJob>,
  ) {
    this.setupHandlebarsHelpers();
  }

  /**
   * Create a new print template
   */
  async createTemplate(createDto: CreatePrintTemplateDto): Promise<PrintTemplate> {
    // Check if template name already exists for this type
    const existingTemplate = await this.printTemplateRepository.findOne({
      where: {
        name: createDto.name,
        templateType: createDto.templateType
      }
    });

    if (existingTemplate) {
      throw new Error(`Template with name "${createDto.name}" already exists for type "${createDto.templateType}"`);
    }

    const template = this.printTemplateRepository.create({
      ...createDto,
      paperSize: createDto.paperSize || 'A4',
      orientation: createDto.orientation || 'portrait',
      margins: createDto.margins || { top: 20, bottom: 20, left: 20, right: 20 }
    });

    return this.printTemplateRepository.save(template);
  }

  /**
   * Update print template
   */
  async updateTemplate(id: string, updateDto: Partial<CreatePrintTemplateDto>): Promise<PrintTemplate> {
    const template = await this.printTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('Print template not found');
    }

    // Increment version on content changes
    if (updateDto.content && updateDto.content !== template.content) {
      template.version += 1;
    }

    Object.assign(template, updateDto);
    return this.printTemplateRepository.save(template);
  }

  /**
   * Get print templates with filtering
   */
  async getTemplates(templateType?: PrintTemplateType, isActive?: boolean) {
    const where: any = {};
    if (templateType) where.templateType = templateType;
    if (isActive !== undefined) where.isActive = isActive;

    return this.printTemplateRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  /**
   * Get default template for type
   */
  async getDefaultTemplate(templateType: PrintTemplateType): Promise<PrintTemplate | null> {
    return this.printTemplateRepository.findOne({
      where: {
        templateType,
        isDefault: true,
        isActive: true
      }
    });
  }

  /**
   * Create a print job
   */
  async createPrintJob(createDto: CreatePrintJobDto): Promise<PrintJob> {
    let template: PrintTemplate | undefined;
    
    if (createDto.templateId) {
      template = await this.printTemplateRepository.findOne({ 
        where: { id: createDto.templateId } 
      });
      if (!template) {
        throw new Error('Print template not found');
      }
    }

    const printJob = this.printJobRepository.create({
      ...createDto,
      entityIds: createDto.entityIds || (createDto.entityId ? [createDto.entityId] : [])
    });

    return this.printJobRepository.save(printJob);
  }

  /**
   * Process a print job
   */
  async processPrintJob(jobId: string, entityData: any | any[]): Promise<string> {
    const job = await this.printJobRepository.findOne({
      where: { id: jobId },
      relations: ['template']
    });

    if (!job) {
      throw new Error('Print job not found');
    }

    if (job.status !== PrintJobStatus.PENDING) {
      throw new Error('Print job is not in pending status');
    }

    try {
      job.markAsStarted();
      await this.printJobRepository.save(job);

      // Generate PDF
      const filePath = await this.generatePDF(job, entityData);
      const fileStats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      // Count pages (basic implementation)
      const pageCount = await this.countPDFPages(filePath);

      job.markAsCompleted(filePath, fileName, fileStats.size, pageCount);
      await this.printJobRepository.save(job);

      return filePath;
    } catch (error) {
      job.markAsFailed(error.message);
      await this.printJobRepository.save(job);
      throw error;
    }
  }

  /**
   * Generate PDF from template and data
   */
  private async generatePDF(job: PrintJob, entityData: any | any[]): Promise<string> {
    // Determine template content
    let templateContent: string;
    let printOptions: PrintOptions = {};

    if (job.template) {
      templateContent = job.template.content;
      printOptions = {
        format: job.template.paperSize as any,
        orientation: job.template.orientation as any,
        margins: job.template.margins,
        headerTemplate: job.template.headerContent,
        footerTemplate: job.template.footerContent,
        displayHeaderFooter: !!(job.template.headerContent || job.template.footerContent)
      };
    } else if (job.customTemplate) {
      templateContent = job.customTemplate;
    } else {
      throw new Error('No template content available');
    }

    // Compile template
    const template = Handlebars.compile(templateContent);
    
    // Prepare data for rendering
    const templateData: any = Array.isArray(entityData) 
      ? { entities: entityData, isBatch: true, count: entityData.length }
      : { entity: entityData, isBatch: false };

    // Add global helpers and data
    templateData.currentDate = new Date().toLocaleDateString();
    templateData.currentTime = new Date().toLocaleTimeString();

    // Render HTML
    const html = template(templateData);

    // Add CSS styles
    let styledHtml = html;
    if (job.template?.styles) {
      styledHtml = `
        <style>${job.template.styles}</style>
        ${html}
      `;
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

      // Configure PDF options
      const pdfOptions: any = {
        format: printOptions.format || 'A4',
        landscape: printOptions.orientation === 'landscape',
        printBackground: true,
        margin: printOptions.margins || { top: '20px', bottom: '20px', left: '20px', right: '20px' }
      };

      if (printOptions.displayHeaderFooter) {
        pdfOptions.displayHeaderFooter = true;
        pdfOptions.headerTemplate = printOptions.headerTemplate || '';
        pdfOptions.footerTemplate = printOptions.footerTemplate || '';
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${job.entityType}_${job.id}_${timestamp}.pdf`;
      const uploadsDir = path.join(process.cwd(), 'uploads', 'prints');
      await fs.ensureDir(uploadsDir);
      const filePath = path.join(uploadsDir, fileName);

      // Generate PDF
      await page.pdf({ ...pdfOptions, path: filePath });

      return filePath;
    } finally {
      await browser.close();
    }
  }

  /**
   * Get print job status
   */
  async getPrintJobStatus(jobId: string): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: { id: jobId },
      relations: ['template']
    });
  }

  /**
   * Get print jobs for user
   */
  async getUserPrintJobs(userId: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.printJobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.template', 'template')
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
   * Download print job file
   */
  async downloadPrintJob(jobId: string, userId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const job = await this.printJobRepository.findOne({
      where: { id: jobId, requestedBy: userId }
    });

    if (!job) {
      throw new Error('Print job not found');
    }

    if (!job.isDownloadable) {
      throw new Error('Print job is not available for download');
    }

    // Increment download count
    job.incrementDownloadCount();
    await this.printJobRepository.save(job);

    return {
      filePath: job.filePath!,
      fileName: job.fileName!,
      mimeType: job.mimeType
    };
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(templateId: string, sampleData: any): Promise<string> {
    const template = await this.printTemplateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new Error('Template not found');
    }

    const compiledTemplate = Handlebars.compile(template.content);
    return compiledTemplate(sampleData);
  }

  /**
   * Delete print template
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.printTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('Template not found');
    }

    // Check if template is being used by any jobs
    const jobsCount = await this.printJobRepository.count({
      where: { templateId: id }
    });

    if (jobsCount > 0) {
      // Soft delete - mark as inactive
      template.isActive = false;
      await this.printTemplateRepository.save(template);
    } else {
      // Hard delete
      await this.printTemplateRepository.remove(template);
    }
  }

  /**
   * Setup Handlebars helpers
   */
  private setupHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', function(date: Date, format: string) {
      if (!date) return '';
      
      const d = new Date(date);
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'iso':
          return d.toISOString().split('T')[0];
        default:
          return d.toLocaleDateString();
      }
    });

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', function(amount: number, currency = 'INR') {
      if (amount === null || amount === undefined) return '';
      
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', function(num: number, decimals = 2) {
      if (num === null || num === undefined) return '';
      return Number(num).toFixed(decimals);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Loop with index
    Handlebars.registerHelper('eachWithIndex', function(array: any[], options: any) {
      let result = '';
      for (let i = 0; i < array.length; i++) {
        result += options.fn({
          ...array[i],
          index: i + 1,
          isFirst: i === 0,
          isLast: i === array.length - 1
        });
      }
      return result;
    });
  }

  /**
   * Count PDF pages (basic implementation)
   */
  private async countPDFPages(filePath: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you might want to use a proper PDF parsing library
      const stats = await fs.stat(filePath);
      // Rough estimation: 1 page ≈ 50KB for typical documents
      return Math.max(1, Math.ceil(stats.size / 50000));
    } catch {
      return 1; // Default to 1 page if estimation fails
    }
  }

  /**
   * Clean up expired print jobs
   */
  async cleanupExpiredJobs(): Promise<number> {
    const expiredJobs = await this.printJobRepository.find({
      where: {
        status: PrintJobStatus.COMPLETED,
        expiresAt: { $lt: new Date() } as any
      }
    });

    let deletedCount = 0;
    for (const job of expiredJobs) {
      try {
        if (job.filePath && await fs.pathExists(job.filePath)) {
          await fs.remove(job.filePath);
        }
        await this.printJobRepository.remove(job);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to clean up print job ${job.id}:`, error);
      }
    }

    return deletedCount;
  }
}
