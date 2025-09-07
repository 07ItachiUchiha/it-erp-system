import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { Employee } from './src/modules/employees/entities/employee.entity';

async function checkUsersAndEmployees() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '6301',
    database: 'it_erp',
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    const userRepo = dataSource.getRepository(User);
    const employeeRepo = dataSource.getRepository(Employee);
    
    const users = await userRepo.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'department', 'designation']
    });
    
    const employees = await employeeRepo.find({
      select: ['id', 'empId', 'userId', 'department', 'designation'],
      relations: ['user']
    });
    
    console.log('===== USERS =====');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.department}/${user.designation}`);
    });
    
    console.log('\n===== EMPLOYEES =====');
    employees.forEach((employee, index) => {
      console.log(`${index + 1}. ${employee.empId} - ${employee.department}/${employee.designation} - UserID: ${employee.userId}`);
    });
    
    console.log(`\nSummary: ${users.length} users, ${employees.length} employees`);
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsersAndEmployees();
