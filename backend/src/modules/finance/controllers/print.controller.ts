import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  ParseBoolPipe,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { PaginationDto } from '../dto/pagination.dto';

@ApiTags('Finance - Print System')
@ApiBearerAuth()
@Controller('api/v1/finance/print')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FINANCE, UserRole.ADMIN)
export class PrintController {
  constructor() {
    // Services will be injected once implemented
  }

  @Get('templates')
  @ApiOperation({ 
    summary: 'List available print templates',
    description: 'Retrieve available print templates with pagination and filtering'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Print templates retrieved successfully' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'templateType', required: false, enum: ['invoice', 'receipt', 'statement'], description: 'Filter by template type' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search templates by name' })
  async getTemplates(@Query() query: any) {
    // Validate template type if provided
    const validTypes = ['invoice', 'receipt', 'statement'];
    if (query.templateType && !validTypes.includes(query.templateType)) {
      throw new BadRequestException(`Invalid template type. Must be one of: ${validTypes.join(', ')}`);
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print templates service not implemented yet');
  }

  @Get('templates/:id')
  @ApiOperation({ 
    summary: 'Get template details',
    description: 'Retrieve detailed template information including HTML content and variables'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template details retrieved successfully' 
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('id', ParseUUIDPipe) templateId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Template details service not implemented yet');
  }

  @Get('templates/:id/preview')
  @ApiOperation({ 
    summary: 'Get template preview',
    description: 'Generate a preview of the template with sample data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template preview generated successfully' 
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplatePreview(@Param('id', ParseUUIDPipe) templateId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Template preview service not implemented yet');
  }

  @Post('templates')
  @ApiOperation({ 
    summary: 'Create new print template',
    description: 'Create a new print template with HTML content and CSS styles'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Template created successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  async createTemplate(
    @Body(ValidationPipe) templateData: {
      name: string;
      templateType: string;
      description?: string;
      htmlTemplate: string;
      cssStyles?: string;
      renderOptions?: Record<string, any>;
    },
  ) {
    // Validate template type
    const validTypes = ['invoice', 'receipt', 'statement'];
    if (!validTypes.includes(templateData.templateType)) {
      throw new BadRequestException(`Invalid template type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Basic HTML validation
    if (!templateData.htmlTemplate || templateData.htmlTemplate.trim().length === 0) {
      throw new BadRequestException('HTML template content is required');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Template creation service not implemented yet');
  }

  @Put('templates/:id')
  @ApiOperation({ 
    summary: 'Update existing template',
    description: 'Update template content and create new version if needed'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template updated successfully' 
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) templateId: string,
    @Body(ValidationPipe) updateData: {
      name?: string;
      description?: string;
      htmlTemplate?: string;
      cssStyles?: string;
      renderOptions?: Record<string, any>;
    },
  ) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Template update service not implemented yet');
  }

  @Delete('templates/:id')
  @ApiOperation({ 
    summary: 'Deactivate template',
    description: 'Deactivate a template (soft delete) instead of hard deletion'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template deactivated successfully' 
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Template is in use and cannot be deleted' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) templateId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Template deletion service not implemented yet');
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create print job',
    description: 'Create a new print job for single or multiple entities'
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Print job created successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid print request' })
  @ApiResponse({ status: 404, description: 'Template or entity not found' })
  @HttpCode(HttpStatus.ACCEPTED)
  async createPrintJob(
    @Body(ValidationPipe) printRequest: {
      templateId: string;
      entityType: string;
      entityIds: string[];
      renderOptions?: {
        includeGSTDetails?: boolean;
        paperSize?: string;
        orientation?: string;
        copies?: number;
        combinePages?: boolean;
        addPageBreaks?: boolean;
      };
    },
  ) {
    // Validate entity type
    const validEntityTypes = ['invoice', 'receipt', 'customer'];
    if (!validEntityTypes.includes(printRequest.entityType)) {
      throw new BadRequestException(`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // Validate entity IDs
    if (!printRequest.entityIds || printRequest.entityIds.length === 0) {
      throw new BadRequestException('At least one entity ID is required');
    }

    // Validate render options
    if (printRequest.renderOptions?.paperSize) {
      const validSizes = ['A4', 'A3', 'Letter', 'Legal'];
      if (!validSizes.includes(printRequest.renderOptions.paperSize)) {
        throw new BadRequestException(`Invalid paper size. Must be one of: ${validSizes.join(', ')}`);
      }
    }

    if (printRequest.renderOptions?.orientation) {
      const validOrientations = ['portrait', 'landscape'];
      if (!validOrientations.includes(printRequest.renderOptions.orientation)) {
        throw new BadRequestException(`Invalid orientation. Must be one of: ${validOrientations.join(', ')}`);
      }
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print job creation service not implemented yet');
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get print job status',
    description: 'Retrieve print job status, progress, and details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Print job status retrieved successfully' 
  })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  async getPrintJobStatus(@Param('id', ParseUUIDPipe) printJobId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print job status service not implemented yet');
  }

  @Get(':id/download')
  @ApiOperation({ 
    summary: 'Download print job PDF',
    description: 'Download the completed print job as PDF file'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF downloaded successfully',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'Attachment with filename' }
    }
  })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  @ApiResponse({ status: 425, description: 'Print job not ready for download' })
  async downloadPrintJob(@Param('id', ParseUUIDPipe) printJobId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print job download service not implemented yet');
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Cancel or delete print job',
    description: 'Cancel a pending print job or delete a completed print job'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Print job cancelled/deleted successfully' 
  })
  @ApiResponse({ status: 404, description: 'Print job not found' })
  async deletePrintJob(@Param('id', ParseUUIDPipe) printJobId: string) {
    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print job deletion service not implemented yet');
  }

  @Get()
  @ApiOperation({ 
    summary: 'List print jobs',
    description: 'List user print jobs with pagination and filtering'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Print jobs retrieved successfully' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], description: 'Filter by status' })
  @ApiQuery({ name: 'templateId', required: false, type: String, description: 'Filter by template' })
  @ApiQuery({ name: 'entityType', required: false, enum: ['invoice', 'receipt', 'customer'], description: 'Filter by entity type' })
  async listPrintJobs(@Query() query: any) {
    // Validate status if provided
    const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    if (query.status && !validStatuses.includes(query.status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate entity type if provided
    const validEntityTypes = ['invoice', 'receipt', 'customer'];
    if (query.entityType && !validEntityTypes.includes(query.entityType)) {
      throw new BadRequestException(`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('Print job listing service not implemented yet');
  }
}
