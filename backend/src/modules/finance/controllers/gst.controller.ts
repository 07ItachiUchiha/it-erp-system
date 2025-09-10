import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { GstCalculationDto } from '../dto/gst-calculation.dto';
import { GstValidationDto } from '../dto/gst-validation.dto';
import { GstReconciliationDto } from '../dto/gst-reconciliation.dto';

@ApiTags('Finance - GST Calculation & Compliance')
@ApiBearerAuth()
@Controller('api/v1/finance/gst')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FINANCE, UserRole.ADMIN)
export class GstController {
  constructor() {
    // Services will be injected once implemented
  }

  @Post('calculate')
  @ApiOperation({ 
    summary: 'Calculate GST for transaction',
    description: 'Calculate GST amounts including IGST, CGST, SGST based on transaction details and state codes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST calculation completed successfully',
    schema: {
      type: 'object',
      properties: {
        isInterState: { type: 'boolean' },
        taxDetails: {
          type: 'object',
          properties: {
            totalTaxableAmount: { type: 'number' },
            totalTaxAmount: { type: 'number' },
            igst: { type: 'number' },
            cgst: { type: 'number' },
            sgst: { type: 'number' },
            cessAmount: { type: 'number' }
          }
        },
        itemWiseBreakup: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              taxableAmount: { type: 'number' },
              gstRate: { type: 'number' },
              igstAmount: { type: 'number' },
              cgstAmount: { type: 'number' },
              sgstAmount: { type: 'number' },
              totalTaxAmount: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid calculation data or GSTIN format' })
  async calculateGst(@Body(ValidationPipe) calculationDto: GstCalculationDto) {
    // Validate GSTIN format
    if (calculationDto.billToGSTIN && !this.isValidGSTINFormat(calculationDto.billToGSTIN)) {
      throw new BadRequestException('Invalid billTo GSTIN format');
    }

    if (calculationDto.shipToGSTIN && !this.isValidGSTINFormat(calculationDto.shipToGSTIN)) {
      throw new BadRequestException('Invalid shipTo GSTIN format');
    }

    // Validate items
    if (!calculationDto.items || calculationDto.items.length === 0) {
      throw new BadRequestException('At least one item is required for GST calculation');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GST calculation service not implemented yet');
  }

  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate GSTIN format and checksum',
    description: 'Validate single or multiple GSTIN numbers for format correctness and checksum validation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GSTIN validation completed successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid GSTIN format' })
  async validateGstin(@Body(ValidationPipe) validationDto: GstValidationDto) {
    if (validationDto.gstin) {
      // Single GSTIN validation
      if (!this.isValidGSTINFormat(validationDto.gstin)) {
        throw new BadRequestException('Invalid GSTIN format');
      }
    } else if (validationDto.gstins) {
      // Multiple GSTIN validation
      if (!Array.isArray(validationDto.gstins) || validationDto.gstins.length === 0) {
        throw new BadRequestException('GSTINs array must contain at least one GSTIN');
      }
    } else {
      throw new BadRequestException('Either gstin or gstins array is required');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GSTIN validation service not implemented yet');
  }

  @Get('rates')
  @ApiOperation({ 
    summary: 'Get GST rate slabs and categories',
    description: 'Retrieve current GST rate slabs, categories, and HSN code mappings'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST rates retrieved successfully' 
  })
  @ApiQuery({ name: 'category', required: false, enum: ['goods', 'services'], description: 'Filter by category' })
  @ApiQuery({ name: 'hsnCode', required: false, type: String, description: 'Search by HSN/SAC code' })
  async getGstRates(
    @Query('category') category?: string,
    @Query('hsnCode') hsnCode?: string,
  ) {
    // Validate category if provided
    if (category && !['goods', 'services'].includes(category)) {
      throw new BadRequestException('Category must be either "goods" or "services"');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GST rates service not implemented yet');
  }

  @Post('reconcile')
  @ApiOperation({ 
    summary: 'Reconcile GST calculations for invoices',
    description: 'Reconcile and validate GST calculations across multiple invoices for a period'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST reconciliation completed successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid reconciliation parameters' })
  async reconcileGst(@Body(ValidationPipe) reconciliationDto: GstReconciliationDto) {
    // Validate invoice IDs or period
    if (!reconciliationDto.invoiceIds && !reconciliationDto.period) {
      throw new BadRequestException('Either invoiceIds or period is required for reconciliation');
    }

    // Validate period dates if provided
    if (reconciliationDto.period) {
      const { startDate, endDate } = reconciliationDto.period;
      if (new Date(startDate) > new Date(endDate)) {
        throw new BadRequestException('Start date cannot be after end date');
      }
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GST reconciliation service not implemented yet');
  }

  @Get('reports/summary')
  @ApiOperation({ 
    summary: 'Generate GST summary report',
    description: 'Generate comprehensive GST summary report for a specified period'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST summary report generated successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Report start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'Report end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Group results by period' })
  async getGstSummaryReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: string,
  ) {
    // Validate required parameters
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    // Validate date format and range
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Validate groupBy parameter
    if (groupBy && !['day', 'week', 'month'].includes(groupBy)) {
      throw new BadRequestException('GroupBy must be one of: day, week, month');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GST summary report service not implemented yet');
  }

  @Get('reports/compliance')
  @ApiOperation({ 
    summary: 'Generate GST compliance report',
    description: 'Generate GST compliance report with issues, recommendations, and filing deadlines'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST compliance report generated successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Report start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'Report end date (YYYY-MM-DD)' })
  async getGstComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Validate required parameters
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // For TDD: This service doesn't exist yet, so it will fail
    throw new NotFoundException('GST compliance report service not implemented yet');
  }

  @Get('state-codes')
  @ApiOperation({ 
    summary: 'Get GST state codes mapping',
    description: 'Retrieve mapping of Indian state/UT codes used in GSTIN'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'GST state codes retrieved successfully' 
  })
  async getGstStateCodes() {
    // Return static data - this doesn't need backend service
    const stateCodes = {
      '01': 'Jammu and Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '25': 'Daman and Diu',
      '26': 'Dadra and Nagar Haveli',
      '27': 'Maharashtra',
      '28': 'Andhra Pradesh',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman and Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh (New)',
    };

    return {
      stateCodes,
      total: Object.keys(stateCodes).length,
      lastUpdated: new Date().toISOString(),
    };
  }

  private isValidGSTINFormat(gstin: string): boolean {
    // GSTIN format: 15 characters
    // First 2: State code (01-37)
    // Next 10: PAN of the entity
    // 13th: Entity code (1-9, A-Z)
    // 14th: Check digit based on algorithm
    // 15th: Z (default)
    const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;
    return gstinRegex.test(gstin);
  }
}
