import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToEmployees1757236944734 implements MigrationInterface {
    name = 'AddUserIdToEmployees1757236944734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "items"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "clientEmail"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "vendor"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "receiptUrl"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "clientEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "items" json`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "vendor" character varying`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "receiptUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "receiptUrl"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "vendor"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "items"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "clientEmail"`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "receiptUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "vendor" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "clientEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "items" json`);
    }

}
