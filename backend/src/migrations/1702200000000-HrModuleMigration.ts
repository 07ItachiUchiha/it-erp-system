import { MigrationInterface, QueryRunner } from 'typeorm';

export class HrModuleMigration1702200000000 implements MigrationInterface {
  name = 'HrModuleMigration1702200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create HR Leave Requests table
    await queryRunner.query(`
      CREATE TYPE "leave_type_enum" AS ENUM('vacation', 'sick', 'personal', 'maternity', 'paternity', 'emergency', 'other');
      CREATE TYPE "leave_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
      
      CREATE TABLE "leave_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "type" "leave_type_enum" NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "days" integer NOT NULL,
        "reason" text,
        "status" "leave_status_enum" NOT NULL DEFAULT 'pending',
        "approvedById" uuid,
        "approvedAt" TIMESTAMP,
        "rejectionReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests_id" PRIMARY KEY ("id")
      )
    `);

    // Create HR Payroll table
    await queryRunner.query(`
      CREATE TYPE "payroll_status_enum" AS ENUM('draft', 'calculated', 'approved', 'paid');
      
      CREATE TABLE "payroll" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "payPeriod" character varying NOT NULL,
        "basicSalary" numeric(10,2) NOT NULL DEFAULT 0,
        "allowances" numeric(10,2) NOT NULL DEFAULT 0,
        "overtime" numeric(10,2) NOT NULL DEFAULT 0,
        "grossSalary" numeric(10,2) NOT NULL DEFAULT 0,
        "taxDeductions" numeric(10,2) NOT NULL DEFAULT 0,
        "otherDeductions" numeric(10,2) NOT NULL DEFAULT 0,
        "netSalary" numeric(10,2) NOT NULL DEFAULT 0,
        "status" "payroll_status_enum" NOT NULL DEFAULT 'draft',
        "paidAt" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payroll_employee_period" UNIQUE ("employeeId", "payPeriod")
      )
    `);

    // Create HR Performance Reviews table
    await queryRunner.query(`
      CREATE TYPE "review_status_enum" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');
      CREATE TYPE "review_type_enum" AS ENUM('annual', 'semi_annual', 'quarterly', 'probationary', 'project_based');
      
      CREATE TABLE "performance_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "reviewerId" uuid,
        "type" "review_type_enum" NOT NULL DEFAULT 'annual',
        "reviewPeriodStart" DATE NOT NULL,
        "reviewPeriodEnd" DATE NOT NULL,
        "overallRating" integer,
        "goals" text,
        "achievements" text,
        "areasForImprovement" text,
        "feedback" text,
        "status" "review_status_enum" NOT NULL DEFAULT 'draft',
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_performance_reviews_rating" CHECK ("overallRating" >= 1 AND "overallRating" <= 5)
      )
    `);

    // Create HR Attendance table
    await queryRunner.query(`
      CREATE TYPE "attendance_status_enum" AS ENUM('present', 'absent', 'late', 'half_day', 'work_from_home');
      
      CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "date" DATE NOT NULL,
        "checkIn" TIME,
        "checkOut" TIME,
        "breakTime" integer DEFAULT 0,
        "workingHours" numeric(4,2) DEFAULT 0,
        "overtime" numeric(4,2) DEFAULT 0,
        "status" "attendance_status_enum" NOT NULL DEFAULT 'present',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_attendance_employee_date" UNIQUE ("employeeId", "date")
      )
    `);

    // Create HR Compliance Tracking table
    await queryRunner.query(`
      CREATE TYPE "compliance_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'expired', 'not_applicable');
      CREATE TYPE "compliance_type_enum" AS ENUM('training', 'certification', 'license', 'policy', 'background_check', 'health_safety', 'other');
      
      CREATE TABLE "compliance_tracking" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "type" "compliance_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "requiredDate" DATE,
        "completedDate" DATE,
        "expiryDate" DATE,
        "status" "compliance_status_enum" NOT NULL DEFAULT 'pending',
        "documentUrl" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compliance_tracking_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "leave_requests" 
      ADD CONSTRAINT "FK_leave_requests_employee" 
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "leave_requests" 
      ADD CONSTRAINT "FK_leave_requests_approver" 
      FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "payroll" 
      ADD CONSTRAINT "FK_payroll_employee" 
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_reviews" 
      ADD CONSTRAINT "FK_performance_reviews_employee" 
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_reviews" 
      ADD CONSTRAINT "FK_performance_reviews_reviewer" 
      FOREIGN KEY ("reviewerId") REFERENCES "employees"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attendance" 
      ADD CONSTRAINT "FK_attendance_employee" 
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "compliance_tracking" 
      ADD CONSTRAINT "FK_compliance_tracking_employee" 
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_leave_requests_employee" ON "leave_requests" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_leave_requests_status" ON "leave_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_leave_requests_dates" ON "leave_requests" ("startDate", "endDate")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_payroll_employee" ON "payroll" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payroll_period" ON "payroll" ("payPeriod")`);
    await queryRunner.query(`CREATE INDEX "IDX_payroll_status" ON "payroll" ("status")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_performance_reviews_employee" ON "performance_reviews" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_reviews_reviewer" ON "performance_reviews" ("reviewerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_performance_reviews_period" ON "performance_reviews" ("reviewPeriodStart", "reviewPeriodEnd")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_attendance_employee" ON "attendance" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_date" ON "attendance" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_status" ON "attendance" ("status")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_compliance_tracking_employee" ON "compliance_tracking" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_compliance_tracking_type" ON "compliance_tracking" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_compliance_tracking_status" ON "compliance_tracking" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_compliance_tracking_expiry" ON "compliance_tracking" ("expiryDate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_compliance_tracking_expiry"`);
    await queryRunner.query(`DROP INDEX "IDX_compliance_tracking_status"`);
    await queryRunner.query(`DROP INDEX "IDX_compliance_tracking_type"`);
    await queryRunner.query(`DROP INDEX "IDX_compliance_tracking_employee"`);
    
    await queryRunner.query(`DROP INDEX "IDX_attendance_status"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_employee"`);
    
    await queryRunner.query(`DROP INDEX "IDX_performance_reviews_period"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_reviews_reviewer"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_reviews_employee"`);
    
    await queryRunner.query(`DROP INDEX "IDX_payroll_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payroll_period"`);
    await queryRunner.query(`DROP INDEX "IDX_payroll_employee"`);
    
    await queryRunner.query(`DROP INDEX "IDX_leave_requests_dates"`);
    await queryRunner.query(`DROP INDEX "IDX_leave_requests_status"`);
    await queryRunner.query(`DROP INDEX "IDX_leave_requests_employee"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "compliance_tracking" DROP CONSTRAINT "FK_compliance_tracking_employee"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_employee"`);
    await queryRunner.query(`ALTER TABLE "performance_reviews" DROP CONSTRAINT "FK_performance_reviews_reviewer"`);
    await queryRunner.query(`ALTER TABLE "performance_reviews" DROP CONSTRAINT "FK_performance_reviews_employee"`);
    await queryRunner.query(`ALTER TABLE "payroll" DROP CONSTRAINT "FK_payroll_employee"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_leave_requests_approver"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_leave_requests_employee"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "compliance_tracking"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TABLE "performance_reviews"`);
    await queryRunner.query(`DROP TABLE "payroll"`);
    await queryRunner.query(`DROP TABLE "leave_requests"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "compliance_type_enum"`);
    await queryRunner.query(`DROP TYPE "compliance_status_enum"`);
    await queryRunner.query(`DROP TYPE "attendance_status_enum"`);
    await queryRunner.query(`DROP TYPE "review_type_enum"`);
    await queryRunner.query(`DROP TYPE "review_status_enum"`);
    await queryRunner.query(`DROP TYPE "payroll_status_enum"`);
    await queryRunner.query(`DROP TYPE "leave_status_enum"`);
    await queryRunner.query(`DROP TYPE "leave_type_enum"`);
  }
}
