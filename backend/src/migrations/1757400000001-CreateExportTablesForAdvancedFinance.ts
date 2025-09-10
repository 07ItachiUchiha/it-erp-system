import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExportTablesForAdvancedFinance1757400000001 implements MigrationInterface {
  name = 'CreateExportTablesForAdvancedFinance1757400000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if export_configurations table already exists
    const exportConfigTableExists = await queryRunner.hasTable('export_configurations');
    
    if (!exportConfigTableExists) {
      // Create export format enum
      await queryRunner.query(
        `CREATE TYPE "export_format_enum" AS ENUM('excel', 'csv', 'pdf')`
      );

      // Create export_configurations table
      await queryRunner.query(`
        CREATE TABLE "export_configurations" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" text,
          "format" "export_format_enum" NOT NULL,
          "template" jsonb NOT NULL,
          "filters" jsonb,
          "columns" jsonb NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "isDefault" boolean NOT NULL DEFAULT false,
          "createdBy" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_export_configurations_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_export_configurations_name" UNIQUE ("name")
        )
      `);

      // Create indexes
      await queryRunner.query('CREATE INDEX "IDX_export_configurations_format" ON "export_configurations" ("format")');
      await queryRunner.query('CREATE INDEX "IDX_export_configurations_isActive" ON "export_configurations" ("isActive")');
      await queryRunner.query('CREATE INDEX "IDX_export_configurations_createdBy" ON "export_configurations" ("createdBy")');

      // Add foreign key
      await queryRunner.query(
        `ALTER TABLE "export_configurations" ADD CONSTRAINT "FK_export_configurations_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }

    // Check if export_jobs table already exists
    const exportJobsTableExists = await queryRunner.hasTable('export_jobs');
    
    if (!exportJobsTableExists) {
      // Create export job status enum
      await queryRunner.query(
        `CREATE TYPE "export_job_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')`
      );

      // Create export_jobs table
      await queryRunner.query(`
        CREATE TABLE "export_jobs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "configurationId" uuid,
          "format" "export_format_enum" NOT NULL,
          "filters" jsonb,
          "totalRecords" integer DEFAULT 0,
          "processedRecords" integer DEFAULT 0,
          "status" "export_job_status_enum" NOT NULL DEFAULT 'pending',
          "filePath" varchar,
          "fileName" varchar,
          "fileSize" bigint,
          "errorMessage" text,
          "progress" decimal(5,2) DEFAULT 0,
          "estimatedTimeRemaining" integer,
          "startedAt" TIMESTAMP,
          "completedAt" TIMESTAMP,
          "expiresAt" TIMESTAMP,
          "downloadCount" integer DEFAULT 0,
          "requestedBy" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_export_jobs_id" PRIMARY KEY ("id")
        )
      `);

      // Create indexes
      await queryRunner.query('CREATE INDEX "IDX_export_jobs_status" ON "export_jobs" ("status")');
      await queryRunner.query('CREATE INDEX "IDX_export_jobs_requestedBy" ON "export_jobs" ("requestedBy")');
      await queryRunner.query('CREATE INDEX "IDX_export_jobs_createdAt" ON "export_jobs" ("createdAt")');
      await queryRunner.query('CREATE INDEX "IDX_export_jobs_expiresAt" ON "export_jobs" ("expiresAt")');
      await queryRunner.query('CREATE INDEX "IDX_export_jobs_configurationId" ON "export_jobs" ("configurationId")');

      // Add foreign keys
      await queryRunner.query(
        `ALTER TABLE "export_jobs" ADD CONSTRAINT "FK_export_jobs_configurationId" FOREIGN KEY ("configurationId") REFERENCES "export_configurations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
      );
      await queryRunner.query(
        `ALTER TABLE "export_jobs" ADD CONSTRAINT "FK_export_jobs_requestedBy" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP CONSTRAINT IF EXISTS "FK_export_jobs_configurationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP CONSTRAINT IF EXISTS "FK_export_jobs_requestedBy"`
    );
    await queryRunner.query(
      `ALTER TABLE "export_configurations" DROP CONSTRAINT IF EXISTS "FK_export_configurations_createdBy"`
    );

    // Drop indexes - export_jobs
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_jobs_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_jobs_requestedBy"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_jobs_createdAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_jobs_expiresAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_jobs_configurationId"');

    // Drop indexes - export_configurations
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_configurations_format"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_configurations_isActive"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_export_configurations_createdBy"');

    // Drop tables
    await queryRunner.query('DROP TABLE IF EXISTS "export_jobs"');
    await queryRunner.query('DROP TABLE IF EXISTS "export_configurations"');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "export_job_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "export_format_enum"');
  }
}
