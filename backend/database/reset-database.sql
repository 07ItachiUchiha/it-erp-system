-- Drop the database and recreate it to fix enum conflicts
-- Run this script if you encounter enum type conflicts

-- Connect to postgres database first, then run:
DROP DATABASE IF EXISTS erp_system;
DROP DATABASE IF EXISTS erp_system_test;

-- Recreate databases
CREATE DATABASE erp_system;
CREATE DATABASE erp_system_test;

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'erp_user') THEN
      
      CREATE ROLE erp_user LOGIN PASSWORD 'erp_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;
GRANT ALL PRIVILEGES ON DATABASE erp_system_test TO erp_user;
