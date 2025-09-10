import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEmployeesTableSchema1757487903636 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename employeeId to empId
        await queryRunner.query(`ALTER TABLE "employees" RENAME COLUMN "employeeId" TO "empId"`);
        
        // Rename joinDate to joiningDate  
        await queryRunner.query(`ALTER TABLE "employees" RENAME COLUMN "joinDate" TO "joiningDate"`);
        
        // Add new columns
        await queryRunner.query(`ALTER TABLE "employees" ADD "firstName" varchar NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "lastName" varchar NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "email" varchar NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "phone" varchar NOT NULL DEFAULT ''`);
        
        // Add enum columns
        await queryRunner.query(`
            CREATE TYPE "employee_status_enum" AS ENUM('active', 'inactive', 'terminated', 'on_leave', 'suspended');
            ALTER TABLE "employees" ADD "status" "employee_status_enum" NOT NULL DEFAULT 'active';
        `);
        
        await queryRunner.query(`
            CREATE TYPE "employment_type_enum" AS ENUM('full_time', 'part_time', 'contract', 'intern', 'consultant');
            ALTER TABLE "employees" ADD "employmentType" "employment_type_enum" NOT NULL DEFAULT 'full_time';
        `);
        
        // Add optional date column
        await queryRunner.query(`ALTER TABLE "employees" ADD "lastWorkingDate" TIMESTAMP NULL`);
        
        // Add optional manager reference
        await queryRunner.query(`ALTER TABLE "employees" ADD "managerId" uuid NULL`);
        
        // Add address fields
        await queryRunner.query(`ALTER TABLE "employees" ADD "address" text NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "city" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "state" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "pincode" varchar NULL`);
        
        // Add contact and financial fields
        await queryRunner.query(`ALTER TABLE "employees" ADD "emergencyContact" jsonb NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "bankAccount" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "ifscCode" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "panNumber" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "aadharNumber" varchar NULL`);
        
        // Add profile and skills
        await queryRunner.query(`ALTER TABLE "employees" ADD "profilePicture" varchar NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "skills" text[] NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "notes" text NULL`);
        
        // Add unique constraint on email
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "UQ_employees_email" UNIQUE ("email")`);
        
        // Add indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_employees_empId" ON "employees" ("empId")`);
        await queryRunner.query(`CREATE INDEX "IDX_employees_email" ON "employees" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_employees_department_designation" ON "employees" ("department", "designation")`);
        await queryRunner.query(`CREATE INDEX "IDX_employees_status" ON "employees" ("status")`);
        
        // Add foreign key constraint for manager
        await queryRunner.query(`
            ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_manager" 
            FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL
        `);
        
        // Remove default values after adding required columns
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "firstName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "lastName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "email" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "phone" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_employees_manager"`);
        
        // Remove indexes
        await queryRunner.query(`DROP INDEX "IDX_employees_status"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_department_designation"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_email"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_empId"`);
        
        // Remove unique constraint
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_employees_email"`);
        
        // Remove new columns
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "skills"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "profilePicture"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "aadharNumber"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "panNumber"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "ifscCode"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "bankAccount"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "emergencyContact"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "pincode"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "managerId"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "lastWorkingDate"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "employmentType"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "firstName"`);
        
        // Drop enum types
        await queryRunner.query(`DROP TYPE "employment_type_enum"`);
        await queryRunner.query(`DROP TYPE "employee_status_enum"`);
        
        // Rename columns back
        await queryRunner.query(`ALTER TABLE "employees" RENAME COLUMN "joiningDate" TO "joinDate"`);
        await queryRunner.query(`ALTER TABLE "employees" RENAME COLUMN "empId" TO "employeeId"`);
    }

}
