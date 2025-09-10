import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceInvoiceWithGSTFields1757300000000 implements MigrationInterface {
  name = 'EnhanceInvoiceWithGSTFields1757300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the columns already exist before adding them
    const invoicesTable = await queryRunner.getTable('invoices');
    if (!invoicesTable) {
      throw new Error('Invoices table does not exist');
    }

    // Add new columns for enhanced invoice functionality
    const columnsToAdd = [
      { name: 'billToName', type: 'varchar', isNullable: true },
      { name: 'billToAddress', type: 'text', isNullable: true },
      { name: 'billToGSTIN', type: 'varchar', isNullable: true },
      { name: 'shipToName', type: 'varchar', isNullable: true },
      { name: 'shipToAddress', type: 'text', isNullable: true },
      { name: 'shipToGSTIN', type: 'varchar', isNullable: true },
      { name: 'subtotal', type: 'decimal', precision: 10, scale: 2, isNullable: true },
      { name: 'shippingCharges', type: 'decimal', precision: 10, scale: 2, default: 0 },
      { name: 'taxRate', type: 'decimal', precision: 5, scale: 2, isNullable: true },
      { name: 'isTaxOptional', type: 'boolean', default: true },
      { name: 'gstBreakup', type: 'jsonb', isNullable: true },
      { name: 'calculatedTotal', type: 'decimal', precision: 10, scale: 2, isNullable: true },
      { name: 'generatedInvoiceNumber', type: 'varchar', isNullable: true },
      { name: 'gstOverriddenBy', type: 'uuid', isNullable: true },
      { name: 'gstOverrideReason', type: 'text', isNullable: true },
      { name: 'gstOverriddenAt', type: 'timestamp', isNullable: true }
    ];

    // Only add columns that don't exist
    for (const column of columnsToAdd) {
      const existingColumn = invoicesTable.findColumnByName(column.name);
      if (!existingColumn) {
        await queryRunner.query(
          `ALTER TABLE "invoices" ADD "${column.name}" ${column.type}${column.precision ? `(${column.precision}${column.scale ? `,${column.scale}` : ''})` : ''} ${column.isNullable ? 'NULL' : 'NOT NULL'} ${column.default !== undefined ? `DEFAULT ${column.default}` : ''}`
        );
      }
    }

    // Add indexes for performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS "IDX_invoices_billToGSTIN" ON "invoices" ("billToGSTIN")',
      'CREATE INDEX IF NOT EXISTS "IDX_invoices_shipToGSTIN" ON "invoices" ("shipToGSTIN")',
      'CREATE INDEX IF NOT EXISTS "IDX_invoices_generatedInvoiceNumber" ON "invoices" ("generatedInvoiceNumber")',
      'CREATE INDEX IF NOT EXISTS "IDX_invoices_isTaxOptional" ON "invoices" ("isTaxOptional")',
      'CREATE INDEX IF NOT EXISTS "IDX_invoices_gstOverriddenBy" ON "invoices" ("gstOverriddenBy")'
    ];

    for (const indexQuery of indexQueries) {
      await queryRunner.query(indexQuery);
    }

    // Add foreign key constraint for gstOverriddenBy
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_gstOverriddenBy" FOREIGN KEY ("gstOverriddenBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_gstOverriddenBy"`
    );

    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invoices_billToGSTIN"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invoices_shipToGSTIN"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invoices_generatedInvoiceNumber"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invoices_isTaxOptional"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invoices_gstOverriddenBy"');

    // Drop columns
    const columnsToDrop = [
      'billToName', 'billToAddress', 'billToGSTIN', 'shipToName', 'shipToAddress', 'shipToGSTIN',
      'subtotal', 'shippingCharges', 'taxRate', 'isTaxOptional', 'gstBreakup', 'calculatedTotal',
      'generatedInvoiceNumber', 'gstOverriddenBy', 'gstOverrideReason', 'gstOverriddenAt'
    ];

    for (const column of columnsToDrop) {
      await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "${column}"`);
    }
  }
}
