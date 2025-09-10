import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFinanceModuleIntegration1757600000000 implements MigrationInterface {
  name = 'FixFinanceModuleIntegration1757600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if expenses table exists, if not create it
    const expensesTableExists = await queryRunner.hasTable('expenses');
    
    if (!expensesTableExists) {
      // Create expenses table
      await queryRunner.query(`
        CREATE TABLE "expenses" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "description" character varying NOT NULL,
          "category" character varying NOT NULL,
          "vendor" character varying,
          "amount" numeric(10,2) NOT NULL,
          "date" date NOT NULL,
          "status" character varying NOT NULL DEFAULT 'pending',
          "receiptUrl" character varying,
          "notes" text,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id")
        )
      `);
    } else {
      // Add missing columns if they don't exist
      const hasDateColumn = await queryRunner.hasColumn('expenses', 'date');
      if (!hasDateColumn) {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "date" date`);
      }

      const hasVendorColumn = await queryRunner.hasColumn('expenses', 'vendor');
      if (!hasVendorColumn) {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "vendor" character varying`);
      }

      const hasReceiptUrlColumn = await queryRunner.hasColumn('expenses', 'receiptUrl');
      if (!hasReceiptUrlColumn) {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "receiptUrl" character varying`);
      }

      const hasNotesColumn = await queryRunner.hasColumn('expenses', 'notes');
      if (!hasNotesColumn) {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "notes" text`);
      }
    }

    // Check if bills table exists, if not create it
    const billsTableExists = await queryRunner.hasTable('bills');
    
    if (!billsTableExists) {
      // Create bills table
      await queryRunner.query(`
        CREATE TABLE "bills" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "billNumber" character varying NOT NULL UNIQUE,
          "vendorName" character varying NOT NULL,
          "vendorEmail" character varying,
          "description" text,
          "amount" numeric(10,2) NOT NULL,
          "tax" numeric(10,2) NOT NULL DEFAULT 0,
          "discount" numeric(10,2) NOT NULL DEFAULT 0,
          "finalAmount" numeric(10,2) NOT NULL,
          "dueDate" date NOT NULL,
          "status" character varying NOT NULL DEFAULT 'pending',
          "category" character varying NOT NULL,
          "notes" text,
          "receiptUrl" character varying,
          "items" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_bills_id" PRIMARY KEY ("id")
        )
      `);
    }

    // Create GST rates table if it doesn't exist
    const gstRatesTableExists = await queryRunner.hasTable('gst_rates');
    
    if (!gstRatesTableExists) {
      await queryRunner.query(`
        CREATE TABLE "gst_rates" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "hsn_code" character varying NOT NULL,
          "description" character varying NOT NULL,
          "cgst_rate" numeric(5,2) NOT NULL DEFAULT 0,
          "sgst_rate" numeric(5,2) NOT NULL DEFAULT 0,
          "igst_rate" numeric(5,2) NOT NULL DEFAULT 0,
          "cess_rate" numeric(5,2) NOT NULL DEFAULT 0,
          "is_active" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_gst_rates_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_gst_rates_hsn_code" UNIQUE ("hsn_code")
        )
      `);

      // Insert common GST rates
      await queryRunner.query(`
        INSERT INTO "gst_rates" ("hsn_code", "description", "cgst_rate", "sgst_rate", "igst_rate") VALUES
        ('1001', 'Software Services', 9.00, 9.00, 18.00),
        ('1002', 'Hardware Equipment', 6.00, 6.00, 12.00),
        ('1003', 'Consulting Services', 9.00, 9.00, 18.00),
        ('1004', 'Training Services', 9.00, 9.00, 18.00),
        ('1005', 'Maintenance Services', 9.00, 9.00, 18.00),
        ('9999', 'General Items', 9.00, 9.00, 18.00)
      `);
    }

    // Ensure invoices table has all required columns for integration
    const invoicesTableExists = await queryRunner.hasTable('invoices');
    if (invoicesTableExists) {
      const hasDescriptionColumn = await queryRunner.hasColumn('invoices', 'description');
      if (!hasDescriptionColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "description" text`);
      }

      const hasTaxColumn = await queryRunner.hasColumn('invoices', 'tax');
      if (!hasTaxColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "tax" numeric(10,2) DEFAULT 0`);
      }

      const hasDiscountColumn = await queryRunner.hasColumn('invoices', 'discount');
      if (!hasDiscountColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "discount" numeric(10,2) DEFAULT 0`);
      }

      const hasFinalAmountColumn = await queryRunner.hasColumn('invoices', 'finalAmount');
      if (!hasFinalAmountColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "finalAmount" numeric(10,2)`);
      }

      const hasGstInfoColumn = await queryRunner.hasColumn('invoices', 'gstInfo');
      if (!hasGstInfoColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "gstInfo" jsonb`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added columns from invoices
    const invoicesTableExists = await queryRunner.hasTable('invoices');
    if (invoicesTableExists) {
      const hasGstInfoColumn = await queryRunner.hasColumn('invoices', 'gstInfo');
      if (hasGstInfoColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "gstInfo"`);
      }

      const hasFinalAmountColumn = await queryRunner.hasColumn('invoices', 'finalAmount');
      if (hasFinalAmountColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "finalAmount"`);
      }

      const hasDiscountColumn = await queryRunner.hasColumn('invoices', 'discount');
      if (hasDiscountColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "discount"`);
      }

      const hasTaxColumn = await queryRunner.hasColumn('invoices', 'tax');
      if (hasTaxColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "tax"`);
      }

      const hasDescriptionColumn = await queryRunner.hasColumn('invoices', 'description');
      if (hasDescriptionColumn) {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "description"`);
      }
    }

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "gst_rates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
  }
}
