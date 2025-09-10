import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSettingsTables1709876543210 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_settings table
    await queryRunner.createTable(
      new Table({
        name: 'user_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'department',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'two_factor_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'session_timeout',
            type: 'integer',
            default: 30,
          },
          {
            name: 'password_expiry',
            type: 'integer',
            default: 90,
          },
          {
            name: 'email_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_notifications',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sms_notifications',
            type: 'boolean',
            default: false,
          },
          {
            name: 'notificationPreferences',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'theme',
            type: 'varchar',
            default: "'light'",
          },
          {
            name: 'primary_color',
            type: 'varchar',
            default: "'#3B82F6'",
          },
          {
            name: 'font_size',
            type: 'varchar',
            default: "'medium'",
          },
          {
            name: 'compact_mode',
            type: 'boolean',
            default: false,
          },
          {
            name: 'show_sidebar',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create company_settings table
    await queryRunner.createTable(
      new Table({
        name: 'company_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'zip_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            default: "'India'",
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tax_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'industry',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'employee_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'established',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create system_settings table (check if exists first)
    const systemSettingsExists = await queryRunner.hasTable('system_settings');
    
    if (!systemSettingsExists) {
      await queryRunner.createTable(
        new Table({
          name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'INR'",
          },
          {
            name: 'timezone',
            type: 'varchar',
            default: "'Asia/Kolkata'",
          },
          {
            name: 'date_format',
            type: 'varchar',
            default: "'DD/MM/YYYY'",
          },
          {
            name: 'language',
            type: 'varchar',
            default: "'en'",
          },
          {
            name: 'backup_frequency',
            type: 'varchar',
            default: "'daily'",
          },
          {
            name: 'auto_logout',
            type: 'boolean',
            default: true,
          },
          {
            name: 'maintenance_mode',
            type: 'boolean',
            default: false,
          },
          {
            name: 'moduleSettings',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    }

    // Add foreign key for user_settings -> users
    await queryRunner.createForeignKey(
      'user_settings',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const userSettingsTable = await queryRunner.getTable('user_settings');
    const foreignKey = userSettingsTable.foreignKeys.find(
      fk => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('user_settings', foreignKey);
    }

    // Drop tables
    await queryRunner.dropTable('system_settings');
    await queryRunner.dropTable('company_settings');
    await queryRunner.dropTable('user_settings');
  }
}
