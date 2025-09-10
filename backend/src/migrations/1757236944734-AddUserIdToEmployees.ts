import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToEmployees1757236944734 implements MigrationInterface {
    name = 'AddUserIdToEmployees1757236944734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add invoice items column if it doesn't exist
        const itemsExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'items'
        `);
        if (itemsExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "invoices" ADD "items" json`);
        }

        // Add notes column to invoices if it doesn't exist
        const notesInvoicesExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'notes'
        `);
        if (notesInvoicesExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "invoices" ADD "notes" text`);
        }

        // Add vendor column to expenses if it doesn't exist
        const vendorExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'vendor'
        `);
        if (vendorExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "expenses" ADD "vendor" character varying`);
        }

        // Add receiptUrl column to expenses if it doesn't exist
        const receiptUrlExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'receiptUrl'
        `);
        if (receiptUrlExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "expenses" ADD "receiptUrl" character varying`);
        }

        // Add notes column to expenses if it doesn't exist
        const notesExpensesExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'notes'
        `);
        if (notesExpensesExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "expenses" ADD "notes" text`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop columns if they exist
        const itemsExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'items'
        `);
        if (itemsExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "items"`);
        }

        const notesInvoicesExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'notes'
        `);
        if (notesInvoicesExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "notes"`);
        }

        const vendorExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'vendor'
        `);
        if (vendorExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "vendor"`);
        }

        const receiptUrlExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'receiptUrl'
        `);
        if (receiptUrlExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "receiptUrl"`);
        }

        const notesExpensesExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'notes'
        `);
        if (notesExpensesExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "notes"`);
        }
    }

}
