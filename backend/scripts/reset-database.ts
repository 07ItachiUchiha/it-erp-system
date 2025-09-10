import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function resetDatabase() {
  // Connect to postgres database first (not erp_system)
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '6301',
    database: 'postgres', // Connect to postgres db to drop/create erp_system
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await adminClient.connect();

    console.log('🗑️ Dropping existing databases...');
    
    // Terminate any active connections to the databases
    await adminClient.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity 
      WHERE datname IN ('erp_system', 'erp_system_test') 
      AND pid <> pg_backend_pid()
    `);

    // Drop databases
    await adminClient.query('DROP DATABASE IF EXISTS erp_system');
    await adminClient.query('DROP DATABASE IF EXISTS erp_system_test');

    console.log('🏗️ Creating fresh databases...');
    
    // Create databases
    await adminClient.query('CREATE DATABASE erp_system');
    await adminClient.query('CREATE DATABASE erp_system_test');

    console.log('✅ Database reset completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run migration:run');
    console.log('   2. Run: npm run start:dev');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    
    if (error.message.includes('does not exist')) {
      console.log('ℹ️ Database does not exist, creating fresh...');
      try {
        await adminClient.query('CREATE DATABASE erp_system');
        await adminClient.query('CREATE DATABASE erp_system_test');
        console.log('✅ Fresh databases created!');
      } catch (createError) {
        console.error('❌ Error creating databases:', createError);
      }
    }
  } finally {
    await adminClient.end();
  }
}

// Run the reset
resetDatabase().catch(console.error);
