import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { FilesModule } from './modules/files/files.module';
import { EmailModule } from './modules/email/email.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AdminModule } from './modules/admin/admin.module';
import { HrModule } from './modules/hr/hr.module';
import { AppController } from './app.controller';
import { databaseConfig } from './database/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => databaseConfig(configService),
    }),
    
    // Authentication module (must be imported first)
    AuthModule,
    
    // Feature modules
    UsersModule,
    EmployeesModule,
    FinanceModule,
    ProcurementModule,
    FilesModule,
    EmailModule,
    InventoryModule,
    SalesModule,
    NotificationsModule,
    ProjectsModule,
    AdminModule,
    HrModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
