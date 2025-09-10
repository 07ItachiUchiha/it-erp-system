import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrintTablesForAdvancedFinance1757400000002 implements MigrationInterface {
  name = 'CreatePrintTablesForAdvancedFinance1757400000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if print_templates table already exists
    const printTemplateTableExists = await queryRunner.hasTable('print_templates');
    
    if (!printTemplateTableExists) {
      // Create template type enum
      await queryRunner.query(
        `CREATE TYPE "print_template_type_enum" AS ENUM('invoice', 'bill', 'receipt', 'statement')`
      );

      // Create print_templates table
      await queryRunner.query(`
        CREATE TABLE "print_templates" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" text,
          "templateType" "print_template_type_enum" NOT NULL,
          "content" text NOT NULL,
          "styles" text,
          "paperSize" varchar DEFAULT 'A4',
          "orientation" varchar DEFAULT 'portrait',
          "margins" jsonb DEFAULT '{"top": 20, "bottom": 20, "left": 20, "right": 20}',
          "headerContent" text,
          "footerContent" text,
          "isActive" boolean NOT NULL DEFAULT true,
          "isDefault" boolean NOT NULL DEFAULT false,
          "version" integer DEFAULT 1,
          "createdBy" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_print_templates_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_print_templates_name_type" UNIQUE ("name", "templateType")
        )
      `);

      // Create indexes
      await queryRunner.query('CREATE INDEX "IDX_print_templates_templateType" ON "print_templates" ("templateType")');
      await queryRunner.query('CREATE INDEX "IDX_print_templates_isActive" ON "print_templates" ("isActive")');
      await queryRunner.query('CREATE INDEX "IDX_print_templates_isDefault" ON "print_templates" ("isDefault")');
      await queryRunner.query('CREATE INDEX "IDX_print_templates_createdBy" ON "print_templates" ("createdBy")');

      // Add foreign key
      await queryRunner.query(
        `ALTER TABLE "print_templates" ADD CONSTRAINT "FK_print_templates_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }

    // Check if print_jobs table already exists
    const printJobsTableExists = await queryRunner.hasTable('print_jobs');
    
    if (!printJobsTableExists) {
      // Create print job status enum
      await queryRunner.query(
        `CREATE TYPE "print_job_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')`
      );

      // Create print_jobs table
      await queryRunner.query(`
        CREATE TABLE "print_jobs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "templateId" uuid,
          "entityType" varchar NOT NULL,
          "entityId" uuid NOT NULL,
          "entityIds" jsonb,
          "customTemplate" text,
          "renderOptions" jsonb,
          "status" "print_job_status_enum" NOT NULL DEFAULT 'pending',
          "totalPages" integer,
          "filePath" varchar,
          "fileName" varchar,
          "fileSize" bigint,
          "mimeType" varchar DEFAULT 'application/pdf',
          "errorMessage" text,
          "progress" decimal(5,2) DEFAULT 0,
          "startedAt" TIMESTAMP,
          "completedAt" TIMESTAMP,
          "expiresAt" TIMESTAMP,
          "downloadCount" integer DEFAULT 0,
          "requestedBy" uuid NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_print_jobs_id" PRIMARY KEY ("id")
        )
      `);

      // Create indexes
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_status" ON "print_jobs" ("status")');
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_requestedBy" ON "print_jobs" ("requestedBy")');
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_createdAt" ON "print_jobs" ("createdAt")');
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_expiresAt" ON "print_jobs" ("expiresAt")');
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_templateId" ON "print_jobs" ("templateId")');
      await queryRunner.query('CREATE INDEX "IDX_print_jobs_entity" ON "print_jobs" ("entityType", "entityId")');

      // Add foreign keys
      await queryRunner.query(
        `ALTER TABLE "print_jobs" ADD CONSTRAINT "FK_print_jobs_templateId" FOREIGN KEY ("templateId") REFERENCES "print_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
      );
      await queryRunner.query(
        `ALTER TABLE "print_jobs" ADD CONSTRAINT "FK_print_jobs_requestedBy" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "print_jobs" DROP CONSTRAINT IF EXISTS "FK_print_jobs_templateId"`
    );
    await queryRunner.query(
      `ALTER TABLE "print_jobs" DROP CONSTRAINT IF EXISTS "FK_print_jobs_requestedBy"`
    );
    await queryRunner.query(
      `ALTER TABLE "print_templates" DROP CONSTRAINT IF EXISTS "FK_print_templates_createdBy"`
    );

    // Drop indexes - print_jobs
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_requestedBy"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_createdAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_expiresAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_templateId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_jobs_entity"');

    // Drop indexes - print_templates
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_templates_templateType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_templates_isActive"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_templates_isDefault"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_print_templates_createdBy"');

    // Drop tables
    await queryRunner.query('DROP TABLE IF EXISTS "print_jobs"');
    await queryRunner.query('DROP TABLE IF EXISTS "print_templates"');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "print_job_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "print_template_type_enum"');
  }
}
