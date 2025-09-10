import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperationLogTable1757400000000 implements MigrationInterface {
  name = 'CreateOperationLogTable1757400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if operation_logs table already exists
    const tableExists = await queryRunner.hasTable('operation_logs');
    
    if (!tableExists) {
      // Create operation type enum
      await queryRunner.query(
        `CREATE TYPE "operation_log_type_enum" AS ENUM('create', 'update', 'delete', 'bulk_create', 'bulk_update', 'bulk_delete', 'export', 'print', 'email', 'status_change', 'payment_add')`
      );

      // Create entity type enum
      await queryRunner.query(
        `CREATE TYPE "operation_log_entity_enum" AS ENUM('invoice', 'bill', 'expense', 'customer_address', 'bill_payment')`
      );

      // Create operation_logs table
      await queryRunner.query(`
        CREATE TABLE "operation_logs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "entityType" "operation_log_entity_enum" NOT NULL,
          "entityId" uuid NOT NULL,
          "operationType" "operation_log_type_enum" NOT NULL,
          "oldValues" jsonb,
          "newValues" jsonb,
          "changes" jsonb,
          "userAgent" varchar,
          "ipAddress" varchar(45),
          "sessionId" varchar,
          "bulkOperationId" uuid,
          "metadata" jsonb,
          "performedBy" uuid NOT NULL,
          "performedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_operation_logs_id" PRIMARY KEY ("id")
        )
      `);

      // Create indexes for performance
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_entityType" ON "operation_logs" ("entityType")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_entityId" ON "operation_logs" ("entityId")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_operationType" ON "operation_logs" ("operationType")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_performedBy" ON "operation_logs" ("performedBy")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_performedAt" ON "operation_logs" ("performedAt")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_bulkOperationId" ON "operation_logs" ("bulkOperationId")');
      await queryRunner.query('CREATE INDEX "IDX_operation_logs_entity_composite" ON "operation_logs" ("entityType", "entityId")');

      // Add foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "operation_logs" ADD CONSTRAINT "FK_operation_logs_performedBy" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "operation_logs" DROP CONSTRAINT IF EXISTS "FK_operation_logs_performedBy"`
    );

    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_entityType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_entityId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_operationType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_performedBy"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_performedAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_bulkOperationId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_operation_logs_entity_composite"');

    // Drop table
    await queryRunner.query('DROP TABLE IF EXISTS "operation_logs"');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "operation_log_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "operation_log_entity_enum"');
  }
}
