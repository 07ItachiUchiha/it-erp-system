import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBulkOperationTable1757400000003 implements MigrationInterface {
  name = 'CreateBulkOperationTable1757400000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if bulk_operations table already exists
    const tableExists = await queryRunner.hasTable('bulk_operations');
    
    if (!tableExists) {
      // Create bulk operation type enum
      await queryRunner.query(
        `CREATE TYPE "bulk_operation_type_enum" AS ENUM('create', 'update', 'delete', 'status_change', 'export', 'import')`
      );

      // Create bulk operation status enum
      await queryRunner.query(
        `CREATE TYPE "bulk_operation_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'partially_completed')`
      );

      // Create entity type enum
      await queryRunner.query(
        `CREATE TYPE "bulk_operation_entity_enum" AS ENUM('invoice', 'bill', 'expense', 'customer_address', 'bill_payment')`
      );

      // Create bulk_operations table
      await queryRunner.query(`
        CREATE TABLE "bulk_operations" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "operationType" "bulk_operation_type_enum" NOT NULL,
          "entityType" "bulk_operation_entity_enum" NOT NULL,
          "entityIds" jsonb NOT NULL,
          "operationData" jsonb,
          "totalRecords" integer NOT NULL DEFAULT 0,
          "processedRecords" integer NOT NULL DEFAULT 0,
          "successfulRecords" integer NOT NULL DEFAULT 0,
          "failedRecords" integer NOT NULL DEFAULT 0,
          "status" "bulk_operation_status_enum" NOT NULL DEFAULT 'pending',
          "progress" decimal(5,2) DEFAULT 0,
          "results" jsonb,
          "errors" jsonb,
          "errorSummary" text,
          "estimatedTimeRemaining" integer,
          "canUndo" boolean NOT NULL DEFAULT false,
          "undoData" jsonb,
          "undoExpiresAt" TIMESTAMP,
          "startedAt" TIMESTAMP,
          "completedAt" TIMESTAMP,
          "performedBy" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_bulk_operations_id" PRIMARY KEY ("id")
        )
      `);

      // Create indexes for performance
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_operationType" ON "bulk_operations" ("operationType")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_entityType" ON "bulk_operations" ("entityType")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_status" ON "bulk_operations" ("status")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_performedBy" ON "bulk_operations" ("performedBy")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_createdAt" ON "bulk_operations" ("createdAt")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_canUndo" ON "bulk_operations" ("canUndo")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_undoExpiresAt" ON "bulk_operations" ("undoExpiresAt")');
      await queryRunner.query('CREATE INDEX "IDX_bulk_operations_operation_entity" ON "bulk_operations" ("operationType", "entityType")');

      // Add foreign key constraint
      await queryRunner.query(
        `ALTER TABLE "bulk_operations" ADD CONSTRAINT "FK_bulk_operations_performedBy" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "bulk_operations" DROP CONSTRAINT IF EXISTS "FK_bulk_operations_performedBy"`
    );

    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_operationType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_entityType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_performedBy"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_createdAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_canUndo"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_undoExpiresAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bulk_operations_operation_entity"');

    // Drop table
    await queryRunner.query('DROP TABLE IF EXISTS "bulk_operations"');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "bulk_operation_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "bulk_operation_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "bulk_operation_entity_enum"');
  }
}
