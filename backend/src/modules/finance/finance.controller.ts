import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  Delete, 
  Patch, 
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==============================
  // DASHBOARD/SUMMARY ENDPOINTS
  // ==============================

  @Get('summary')
  getFinancialSummary() {
    return this.financeService.getFinancialSummary();
  }

  @Get('dashboard')
  getDashboard() {
    return this.financeService.getDashboard();
  }

  // ==============================
  // INVOICE ENDPOINTS (Unified)
  // ==============================

  @Post('invoices')
  createInvoice(@Body() createInvoiceDto: any) {
    return this.financeService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  findAllInvoices(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findAllInvoices(+page, +limit, search, status);
  }

  @Get('invoices/search')
  searchInvoices(
    @Query('query') query: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.financeService.findAllInvoices(+page, +limit, query, status);
  }

  @Get('invoices/statistics')
  getInvoiceStatistics() {
    return this.financeService.getInvoiceStatistics();
  }

  @Get('invoices/recent')
  getRecentInvoices(@Query('limit') limit = 5) {
    return this.financeService.findAllInvoices(1, +limit);
  }

  @Get('invoices/:id')
  findInvoiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findInvoiceById(id);
  }

  @Patch('invoices/:id')
  updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: any,
  ) {
    return this.financeService.updateInvoice(id, updateInvoiceDto);
  }

  @Put('invoices/:id')
  updateInvoiceWithPut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: any,
  ) {
    return this.financeService.updateInvoice(id, updateInvoiceDto);
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.deleteInvoice(id);
  }

  @Patch('invoices/bulk-update')
  bulkUpdateInvoices(@Body() bulkUpdateDto: { invoiceIds: string[]; data: any }) {
    return this.financeService.bulkUpdateInvoices(bulkUpdateDto.invoiceIds, bulkUpdateDto.data);
  }

  @Delete('invoices/bulk-delete')
  bulkDeleteInvoices(@Body() bulkDeleteDto: { invoiceIds: string[] }) {
    return this.financeService.bulkDeleteInvoices(bulkDeleteDto.invoiceIds);
  }

  @Post('invoices/:id/duplicate')
  duplicateInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.duplicateInvoice(id);
  }

  @Patch('invoices/:id/status')
  updateInvoiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: { status: string },
  ) {
    return this.financeService.updateInvoice(id, { status: statusDto.status });
  }

  // ==============================
  // EXPENSE ENDPOINTS
  // ==============================

  @Post('expenses')
  createExpense(@Body() createExpenseDto: any) {
    return this.financeService.createExpense(createExpenseDto);
  }

  @Get('expenses')
  findAllExpenses(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.financeService.findAllExpenses(+page, +limit, search, category);
  }

  @Get('expenses/statistics')
  getExpenseStatistics() {
    return this.financeService.getExpenseStatistics();
  }

  @Get('expenses/:id')
  findExpenseById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findExpenseById(id);
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: any,
  ) {
    return this.financeService.updateExpense(id, updateExpenseDto);
  }

  @Put('expenses/:id')
  updateExpenseWithPut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: any,
  ) {
    return this.financeService.updateExpense(id, updateExpenseDto);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.deleteExpense(id);
  }

  // ==============================
  // BILL ENDPOINTS
  // ==============================

  @Post('bills')
  createBill(@Body() createBillDto: any) {
    return this.financeService.createBill(createBillDto);
  }

  @Get('bills')
  findAllBills(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findAllBills(+page, +limit, search, status);
  }

  @Get('bills/:id')
  findBillById(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findBillById(id);
  }

  @Patch('bills/:id')
  updateBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBillDto: any,
  ) {
    return this.financeService.updateBill(id, updateBillDto);
  }

  @Put('bills/:id')
  updateBillWithPut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBillDto: any,
  ) {
    return this.financeService.updateBill(id, updateBillDto);
  }

  @Delete('bills/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBill(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.deleteBill(id);
  }

  // ==============================
  // GST MANAGEMENT ENDPOINTS
  // ==============================

  @Get('gst/configurations')
  getGSTConfigurations() {
    return this.financeService.getGSTConfigurations();
  }

  @Post('gst/configurations')
  createGSTConfiguration(@Body() createGSTConfigDto: any) {
    return this.financeService.createGSTConfiguration(createGSTConfigDto);
  }

  // ==============================
  // EXPORT MANAGEMENT ENDPOINTS
  // ==============================

  @Post('export')
  createExportJob(@Body() exportData: any) {
    return this.financeService.createExportJob(exportData);
  }

  @Get('export/:id/status')
  getExportStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.getExportStatus(id);
  }

  @Get('export/history')
  getExportHistory(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.financeService.getExportHistory(+page, +limit);
  }

  // ==============================
  // PRINT MANAGEMENT ENDPOINTS
  // ==============================

  @Post('print')
  createPrintJob(@Body() printData: any) {
    return this.financeService.createPrintJob(printData);
  }

  @Get('print/:id/status')
  getPrintJobStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.getPrintJobStatus(id);
  }

  // ==============================
  // GST ENDPOINTS
  // ==============================

  @Post('gst/calculate')
  calculateGST(@Body() calculationData: {
    amount: number;
    gstRate: number;
    calculationType: 'inclusive' | 'exclusive';
    place: string;
    businessType: 'b2b' | 'b2c' | 'export';
  }) {
    return this.financeService.calculateGST(calculationData);
  }

  @Get('gst/rates')
  getGSTRates() {
    return {
      rates: [
        { rate: 0, description: 'Exempt' },
        { rate: 5, description: 'Essential goods' },
        { rate: 12, description: 'Standard goods' },
        { rate: 18, description: 'Services & Goods' },
        { rate: 28, description: 'Luxury items' },
      ],
    };
  }

  @Get('gst/summary')
  getGSTSummary(@Query('month') month?: string, @Query('year') year?: string) {
    // Mock GST summary for now
    return {
      totalGSTCollected: 50000,
      totalGSTPaid: 30000,
      netGST: 20000,
      period: `${month || new Date().getMonth() + 1}/${year || new Date().getFullYear()}`,
    };
  }

  // ==============================
  // EXPORT ENDPOINTS
  // ==============================

  @Post('export/excel')
  exportToExcel(
    @Query('type') type: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const jobId = `export-${Date.now()}`;
    return {
      jobId,
      status: 'queued',
      message: 'Export job has been queued for processing',
    };
  }

  @Post('export/csv')
  exportToCSV(
    @Query('type') type: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const jobId = `export-csv-${Date.now()}`;
    return {
      jobId,
      status: 'queued',
      message: 'CSV export job has been queued for processing',
    };
  }

  @Get('export/jobs')
  getExportJobs() {
    return {
      data: [],
      message: 'No export jobs found',
    };
  }

  @Get('export/jobs/:id')
  getExportJobStatus(@Param('id') id: string) {
    return {
      jobId: id,
      status: 'completed',
      progress: 100,
      downloadUrl: `/api/v1/finance/export/download/${id}`,
    };
  }

  // ==============================
  // PRINT ENDPOINTS
  // ==============================

  @Post('print/invoice/:id')
  printInvoice(@Param('id', ParseUUIDPipe) id: string) {
    const jobId = `print-${Date.now()}`;
    return {
      jobId,
      status: 'queued',
      message: 'Print job has been queued for processing',
    };
  }

  @Post('print/bulk')
  bulkPrint(@Body() printDto: { invoiceIds: string[] }) {
    const jobId = `bulk-print-${Date.now()}`;
    return {
      jobId,
      status: 'queued',
      message: 'Bulk print job has been queued for processing',
    };
  }

  @Get('print/jobs')
  getPrintJobs() {
    return {
      data: [],
      message: 'No print jobs found',
    };
  }

  @Get('print/jobs/:id')
  getPrintJob(@Param('id') id: string) {
    return {
      jobId: id,
      status: 'completed',
      progress: 100,
    };
  }

  // ==============================
  // DASHBOARD ENDPOINTS
  // ==============================

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.financeService.getDashboardStats();
  }

  @Get('dashboard/recent-activities')
  getRecentActivities(@Query('limit') limit = 10) {
    return this.financeService.getRecentActivities(+limit);
  }
}
