import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UserEmployeeIntegration1702200000000 implements MigrationInterface {
  name = 'UserEmployeeIntegration1702200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if userId column already exists
    const hasUserIdColumn = await queryRunner.hasColumn('employees', 'userId');
    
    if (!hasUserIdColumn) {
      // Add userId column to employees table
      await queryRunner.addColumn(
        'employees',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    // Check if foreign key already exists
    const table = await queryRunner.getTable('employees');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
    
    if (!foreignKey) {
      // Create foreign key relationship
      await queryRunner.createForeignKey(
        'employees',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        })
      );

      // Create index for faster lookups
      await queryRunner.query(`CREATE INDEX "IDX_employees_userId" ON "employees" ("userId")`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_employees_userId"`);

    // Drop foreign key
    const table = await queryRunner.getTable('employees');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('employees', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('employees', 'userId');
  }
}
