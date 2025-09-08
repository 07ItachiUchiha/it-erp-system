import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings, CompanySettings, SystemSettings } from './settings.entity';
import { User } from '../users/entities/user.entity';
import { 
  UpdateUserProfileDto, 
  UpdateSecuritySettingsDto, 
  ChangePasswordDto,
  UpdateNotificationSettingsDto,
  UpdateAppearanceSettingsDto,
  UpdateCompanySettingsDto,
  UpdateSystemSettingsDto
} from './dto/settings.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(CompanySettings)
    private companySettingsRepository: Repository<CompanySettings>,
    @InjectRepository(SystemSettings)
    private systemSettingsRepository: Repository<SystemSettings>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // User Profile Methods
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.userSettingsRepository.findOne({ where: { userId } });
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: settings?.phone,
      position: settings?.position,
      department: settings?.department,
      avatar: settings?.avatar,
    };
  }

  async updateUserProfile(userId: string, updateData: UpdateUserProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user entity fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;

    await this.userRepository.save(user);

    // Update or create user settings
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.userSettingsRepository.create({ userId });
    }

    if (updateData.phone) settings.phone = updateData.phone;
    if (updateData.position) settings.position = updateData.position;
    if (updateData.department) settings.department = updateData.department;
    if (updateData.avatar) settings.avatar = updateData.avatar;

    await this.userSettingsRepository.save(settings);

    return this.getUserProfile(userId);
  }

  // Security Methods
  async getSecuritySettings(userId: string) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    return {
      twoFactorEnabled: settings.twoFactorEnabled,
      sessionTimeout: settings.sessionTimeout,
      passwordExpiry: settings.passwordExpiry,
    };
  }

  async updateSecuritySettings(userId: string, updateData: UpdateSecuritySettingsDto) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    if (updateData.twoFactorEnabled !== undefined) settings.twoFactorEnabled = updateData.twoFactorEnabled;
    if (updateData.sessionTimeout) settings.sessionTimeout = updateData.sessionTimeout;
    if (updateData.passwordExpiry) settings.passwordExpiry = updateData.passwordExpiry;

    await this.userSettingsRepository.save(settings);
    return this.getSecuritySettings(userId);
  }

  async changePassword(userId: string, changePasswordData: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordData.newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  // Notification Methods
  async getNotificationSettings(userId: string) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    return {
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      smsNotifications: settings.smsNotifications,
      notificationPreferences: settings.notificationPreferences,
    };
  }

  async updateNotificationSettings(userId: string, updateData: UpdateNotificationSettingsDto) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    if (updateData.emailNotifications !== undefined) settings.emailNotifications = updateData.emailNotifications;
    if (updateData.pushNotifications !== undefined) settings.pushNotifications = updateData.pushNotifications;
    if (updateData.smsNotifications !== undefined) settings.smsNotifications = updateData.smsNotifications;
    if (updateData.notificationPreferences) {
      settings.notificationPreferences = { ...settings.notificationPreferences, ...updateData.notificationPreferences };
    }

    await this.userSettingsRepository.save(settings);
    return this.getNotificationSettings(userId);
  }

  // Appearance Methods
  async getAppearanceSettings(userId: string) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    return {
      theme: settings.theme,
      primaryColor: settings.primaryColor,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
      showSidebar: settings.showSidebar,
    };
  }

  async updateAppearanceSettings(userId: string, updateData: UpdateAppearanceSettingsDto) {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.createDefaultUserSettings(userId);
    }

    if (updateData.theme) settings.theme = updateData.theme;
    if (updateData.primaryColor) settings.primaryColor = updateData.primaryColor;
    if (updateData.fontSize) settings.fontSize = updateData.fontSize;
    if (updateData.compactMode !== undefined) settings.compactMode = updateData.compactMode;
    if (updateData.showSidebar !== undefined) settings.showSidebar = updateData.showSidebar;

    await this.userSettingsRepository.save(settings);
    return this.getAppearanceSettings(userId);
  }

  // Company Settings Methods
  async getCompanySettings() {
    let settings = await this.companySettingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultCompanySettings();
    }
    return settings;
  }

  async updateCompanySettings(updateData: UpdateCompanySettingsDto) {
    let settings = await this.companySettingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultCompanySettings();
    }

    Object.assign(settings, updateData);
    await this.companySettingsRepository.save(settings);
    return settings;
  }

  // System Settings Methods
  async getSystemSettings() {
    let settings = await this.systemSettingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultSystemSettings();
    }
    return settings;
  }

  async updateSystemSettings(updateData: UpdateSystemSettingsDto) {
    let settings = await this.systemSettingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultSystemSettings();
    }

    Object.assign(settings, updateData);
    await this.systemSettingsRepository.save(settings);
    return settings;
  }

  // System Info and Actions
  async getSystemInfo() {
    return {
      version: '1.0.0',
      database: 'PostgreSQL 14.0',
      lastBackup: new Date(),
      storageUsed: 2.5 * 1024 * 1024 * 1024, // 2.5 GB in bytes
      storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
      uptime: process.uptime(),
    };
  }

  async createBackup() {
    // Implement backup logic here
    const filename = `backup-${new Date().toISOString().split('T')[0]}.sql`;
    return {
      downloadUrl: `/api/backups/${filename}`,
      filename,
    };
  }

  async exportData(modules: string[]) {
    // Implement data export logic here
    const filename = `export-${new Date().toISOString().split('T')[0]}.json`;
    return {
      downloadUrl: `/api/exports/${filename}`,
      filename,
    };
  }

  async clearCache() {
    // Implement cache clearing logic here
    return { message: 'Cache cleared successfully' };
  }

  // Private helper methods
  private async createDefaultUserSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = this.userSettingsRepository.create({
      userId,
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationPreferences: {
        newOrders: true,
        lowInventory: true,
        paymentReceived: true,
        employeeLeave: true,
        systemAlerts: true,
        weeklyReports: false,
        monthlyReports: false,
        taskAssignments: true,
        projectUpdates: true,
        invoiceGenerated: true,
      },
      theme: 'light',
      primaryColor: '#3B82F6',
      fontSize: 'medium',
      compactMode: false,
      showSidebar: true,
    });

    return await this.userSettingsRepository.save(defaultSettings);
  }

  private async createDefaultCompanySettings(): Promise<CompanySettings> {
    const defaultSettings = this.companySettingsRepository.create({
      companyName: 'Your Company Name',
      country: 'India',
    });

    return await this.companySettingsRepository.save(defaultSettings);
  }

  private async createDefaultSystemSettings(): Promise<SystemSettings> {
    const defaultSettings = this.systemSettingsRepository.create({
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
      backupFrequency: 'daily',
      autoLogout: true,
      maintenanceMode: false,
      moduleSettings: {
        employees: { enabled: true, features: { attendance: true, payroll: true, performance: true, documents: true } },
        hr: { enabled: true, features: { recruitment: true, onboarding: true, leaves: true, appraisals: true } },
        finance: { enabled: true, features: { accounting: true, invoicing: true, expenses: true, budgeting: true } },
        inventory: { enabled: true, features: { stockManagement: true, warehouses: true, suppliers: true, reorderPoints: true } },
        sales: { enabled: true, features: { leads: true, opportunities: true, quotations: true, orders: true } },
        procurement: { enabled: true, features: { purchaseOrders: true, vendors: true, approvals: true, contracts: true } },
        projects: { enabled: true, features: { planning: true, tracking: true, collaboration: true, timeTracking: true } },
        files: { enabled: true, features: { storage: true, sharing: true, versioning: true, permissions: true } },
      },
    });

    return await this.systemSettingsRepository.save(defaultSettings);
  }
}
