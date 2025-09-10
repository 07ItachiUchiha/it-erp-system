import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Invoice, Expense, Bill } from './entities/finance.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice, 
      Expense,
      Bill,
      User
      // TODO: Add Bill entity once schema is resolved
      // Bill
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
