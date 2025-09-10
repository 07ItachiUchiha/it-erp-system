import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Invoice, Expense } from './entities/finance.entity';
import { Bill, BillItem, BillPayment, CustomerAddress } from './entities/bill.entity';
import { BillService } from './services/bill.service';
import { PdfService } from './services/pdf.service';
import { GSTCalculationService } from './services/gst-calculation.service';
import { InvoiceExportService } from './services/invoice-export.service';
import { CustomerAddressService } from './services/customer-address.service';
import { BillController } from './controllers/bill.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice, 
      Expense, 
      Bill, 
      BillItem, 
      BillPayment,
      CustomerAddress
    ])
  ],
  controllers: [
    FinanceController,
    BillController
  ],
  providers: [
    FinanceService,
    BillService,
    PdfService,
    GSTCalculationService,
    InvoiceExportService,
    CustomerAddressService
  ],
  exports: [
    FinanceService,
    BillService,
    PdfService
  ],
})
export class FinanceModule {}
