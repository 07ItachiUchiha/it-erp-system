import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToUsers1757486736714 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add deletedAt column to users table for soft delete functionality
        const deletedAtExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'deletedAt'
        `);
        
        if (deletedAtExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove deletedAt column from users table
        const deletedAtExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'deletedAt'
        `);
        
        if (deletedAtExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        }
    }

}
