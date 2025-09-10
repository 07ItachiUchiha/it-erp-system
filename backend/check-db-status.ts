import { AppDataSource } from './src/database/data-source';

async function checkDatabaseStatus() {
  try {
    await AppDataSource.initialize();
    
    // Check which tables exist
    const queryRunner = AppDataSource.createQueryRunner();
    
    console.log('=== DATABASE STATUS CHECK ===');
    
    // Check if tables exist
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check migrations that have been executed
    const migrations = await queryRunner.query(`
      SELECT * FROM migrations ORDER BY timestamp;
    `);
    
    console.log('\nExecuted migrations:');
    migrations.forEach((migration: any) => {
      console.log(`  - ${migration.timestamp}: ${migration.name}`);
    });
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error('Error checking database status:', error);
  }
}

checkDatabaseStatus();
