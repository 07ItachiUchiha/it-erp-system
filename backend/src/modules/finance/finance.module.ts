import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Invoice, Expense } from './entities/finance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice, 
      Expense
    ])
  ],
  controllers: [
    FinanceController
  ],
  providers: [
    FinanceService
  ],
  exports: [
    FinanceService
  ],
})
export class FinanceModule {}
