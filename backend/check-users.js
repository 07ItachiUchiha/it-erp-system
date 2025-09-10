const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '6301',
    database: 'erp_system',
    synchronize: false,
    logging: false,
});

async function checkUsers() {
    try {
        await dataSource.initialize();
        console.log('Database connected successfully');

        // Check for existing users
        const users = await dataSource.query('SELECT id, email, "firstName", "lastName", role FROM users LIMIT 5');
        console.log('Existing users:', users);

        // If no users exist, create an admin user
        if (users.length === 0) {
            console.log('No users found. Creating admin user...');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            
            const adminUser = await dataSource.query(`
                INSERT INTO users (
                    id, email, password, "firstName", "lastName", 
                    role, status, "isActive", "isEmailVerified", "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid(), 'admin@example.com', $1, 
                    'Admin', 'User', 'admin', 'active', true, true, NOW(), NOW()
                ) RETURNING id, email, "firstName", "lastName", role;
            `, [hashedPassword]);
            
            console.log('Admin user created:', adminUser[0]);
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUsers();
