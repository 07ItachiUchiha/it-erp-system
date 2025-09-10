import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Patch, 
  UseGuards,
  Request,
  Query,
  Res,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, CreateExpenseDto } from './dto/create-finance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GSTCalculationService } from './services/gst-calculation.service';
import { InvoiceExportService } from './services/invoice-export.service';
import { CustomerAddressService } from './services/customer-address.service';
import { GSTBreakupDto, GSTCalculationResultDto, CalculateGSTDto } from './dto/gst-calculation.dto';
import { BillToAddressDto } from './dto/bill-to-address.dto';
import { ShipToAddressDto } from './dto/ship-to-address.dto';
import { CreateCustomerAddressDto, UpdateCustomerAddressDto } from './dto/customer-address.dto';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly gstCalculationService: GSTCalculationService,
    private readonly invoiceExportService: InvoiceExportService,
    private readonly customerAddressService: CustomerAddressService,
  ) {}

  // Invoice endpoints
  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES)
  @ApiOperation({ summary: 'Create a new invoice with enhanced features' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully.' })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.financeService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.HR, UserRole.MANAGER, UserRole.SALES)
  @ApiOperation({ summary: 'Get all invoices' })
  findAllInvoices() {
    return this.financeService.findAllInvoices();
  }

  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.HR, UserRole.MANAGER, UserRole.SALES)
  @ApiOperation({ summary: 'Get invoice by ID with enhanced details' })
  getInvoiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.getInvoiceById(id);
  }

  @Patch('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Update invoice with enhanced validation' })
  updateInvoice(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateData: Partial<CreateInvoiceDto>
  ) {
    return this.financeService.updateInvoice(id, updateData);
  }

  @Patch('invoices/:id/status')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Update invoice status' })
  updateInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.financeService.updateInvoiceStatus(id, status);
  }

  @Delete('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Delete invoice' })
  removeInvoice(@Param('id') id: string) {
    return this.financeService.removeInvoice(id);
  }

  // GST Calculation endpoints
  @Post('gst/calculate')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES)
  @ApiOperation({ summary: 'Calculate GST for invoice items' })
  @ApiResponse({ status: 200, description: 'GST calculated successfully.', type: GSTCalculationResultDto })
  calculateGST(@Body() calculateGSTDto: CalculateGSTDto) {
    return this.gstCalculationService.calculateGST(calculateGSTDto);
  }

  @Post('gst/validate-override')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Validate GST override for manual adjustments' })
  validateGSTOverride(
    @Body() overrideData: {
      gstBreakup: GSTBreakupDto;
      subtotal: number;
      isIntraState: boolean;
    }
  ) {
    return this.gstCalculationService.validateGSTOverride(
      overrideData.gstBreakup,
      overrideData.subtotal,
      overrideData.isIntraState
    );
  }

  // Export endpoints
  @Get('invoices/export/excel')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export invoices to Excel format' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Invoice status filter' })
  @ApiQuery({ name: 'customerName', required: false, description: 'Customer name filter' })
  async exportInvoicesToExcel(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('customerName') customerName?: string,
    @Res() res?: Response
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      customerName,
      format: 'excel' as const
    };

    const exportBuffer = await this.invoiceExportService.exportInvoices(filters);
    
    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(exportBuffer);
    }
    
    return { message: 'Export completed', size: exportBuffer.length };
  }

  @Get('invoices/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export invoices to CSV format (returns Excel for now)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerName', required: false })
  async exportInvoicesToCSV(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('customerName') customerName?: string,
    @Res() res?: Response
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      customerName,
      format: 'csv' as const
    };

    const exportBuffer = await this.invoiceExportService.exportInvoices(filters);
    
    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(exportBuffer);
    }
    
    return { message: 'Export completed', size: exportBuffer.length };
  }

  // Expense endpoints
  @Post('expenses')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.HR, UserRole.MANAGER, UserRole.SALES, UserRole.EMPLOYEE)
  createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.financeService.createExpense(createExpenseDto);
  }

  @Get('expenses')
  findAllExpenses() {
    return this.financeService.findAllExpenses();
  }

  @Patch('expenses/:id/status')
  updateExpenseStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.financeService.updateExpenseStatus(id, status);
  }

  @Delete('expenses/:id')
  removeExpense(@Param('id') id: string) {
    return this.financeService.removeExpense(id);
  }

  // Analytics
  @Get('summary')
  @ApiOperation({ summary: 'Get enhanced financial summary with GST analytics' })
  getFinancialSummary() {
    return this.financeService.getFinancialSummary();
  }

  // Customer Address endpoints
  @Post('customer-addresses')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES)
  @ApiOperation({ summary: 'Create customer address' })
  createCustomerAddress(@Body() addressData: CreateCustomerAddressDto) {
    return this.customerAddressService.createAddress(addressData);
  }

  @Get('customer-addresses/:customerId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get customer addresses by customer ID' })
  getCustomerAddresses(@Param('customerId') customerId: string) {
    return this.customerAddressService.getCustomerAddresses(customerId);
  }

  @Get('customer-addresses/:customerId/default/:addressType')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES, UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get default customer address by type' })
  getDefaultCustomerAddress(
    @Param('customerId') customerId: string,
    @Param('addressType') addressType: 'billing' | 'shipping'
  ) {
    return this.customerAddressService.getDefaultAddress(customerId, addressType);
  }

  @Patch('customer-addresses/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES)
  @ApiOperation({ summary: 'Update customer address' })
  updateCustomerAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: UpdateCustomerAddressDto
  ) {
    return this.customerAddressService.updateAddress(id, updateData);
  }

  @Delete('customer-addresses/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Delete customer address' })
  deleteCustomerAddress(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerAddressService.deleteAddress(id);
  }
}
