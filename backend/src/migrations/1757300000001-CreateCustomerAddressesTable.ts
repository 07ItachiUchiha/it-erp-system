import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerAddressesTable1757300000001 implements MigrationInterface {
  name = 'CreateCustomerAddressesTable1757300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if customer_addresses table already exists
    const tableExists = await queryRunner.hasTable('customer_addresses');
    
    if (!tableExists) {
      // Create address type enum
      await queryRunner.query(
        `CREATE TYPE "customer_address_type_enum" AS ENUM('billing', 'shipping', 'both')`
      );

      // Create customer_addresses table
      await queryRunner.query(`
        CREATE TABLE "customer_addresses" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "customerId" varchar NOT NULL,
          "addressType" "customer_address_type_enum" NOT NULL DEFAULT 'billing',
          "contactName" varchar,
          "companyName" varchar,
          "address" text NOT NULL,
          "city" varchar NOT NULL,
          "state" varchar NOT NULL,
          "pincode" varchar(6) NOT NULL,
          "country" varchar DEFAULT 'India',
          "gstin" varchar,
          "isDefault" boolean NOT NULL DEFAULT false,
          "isActive" boolean NOT NULL DEFAULT true,
          "createdBy" uuid,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_customer_addresses_id" PRIMARY KEY ("id"),
          CONSTRAINT "CHK_customer_addresses_pincode" CHECK (char_length("pincode") = 6 AND "pincode" ~ '^[0-9]+$'),
          CONSTRAINT "CHK_customer_addresses_gstin" CHECK ("gstin" IS NULL OR "gstin" ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
        )
      `);

      // Create indexes
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_customerId" ON "customer_addresses" ("customerId")');
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_addressType" ON "customer_addresses" ("addressType")');
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_isDefault" ON "customer_addresses" ("isDefault")');
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_isActive" ON "customer_addresses" ("isActive")');
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_gstin" ON "customer_addresses" ("gstin")');
      await queryRunner.query('CREATE INDEX "IDX_customer_addresses_state" ON "customer_addresses" ("state")');

      // Add foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "customer_addresses" ADD CONSTRAINT "FK_customer_addresses_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
      );

      // Create unique constraint for default addresses
      await queryRunner.query(
        `CREATE UNIQUE INDEX "IDX_customer_addresses_default_unique" ON "customer_addresses" ("customerId", "addressType") WHERE "isDefault" = true AND "isActive" = true`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table and enum
    await queryRunner.query('DROP TABLE IF EXISTS "customer_addresses"');
    await queryRunner.query('DROP TYPE IF EXISTS "customer_address_type_enum"');
  }
}
