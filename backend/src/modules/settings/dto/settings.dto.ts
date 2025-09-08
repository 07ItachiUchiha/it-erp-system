import { IsOptional, IsString, IsBoolean, IsNumber, IsEmail, IsObject, IsEnum } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateSecuritySettingsDto {
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  sessionTimeout?: number;

  @IsOptional()
  @IsNumber()
  passwordExpiry?: number;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    newOrders?: boolean;
    lowInventory?: boolean;
    paymentReceived?: boolean;
    employeeLeave?: boolean;
    systemAlerts?: boolean;
    weeklyReports?: boolean;
    monthlyReports?: boolean;
    taskAssignments?: boolean;
    projectUpdates?: boolean;
    invoiceGenerated?: boolean;
  };
}

export class UpdateAppearanceSettingsDto {
  @IsOptional()
  @IsEnum(['light', 'dark', 'auto'])
  theme?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsBoolean()
  showSidebar?: boolean;
}

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;
}

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  backupFrequency?: string;

  @IsOptional()
  @IsBoolean()
  autoLogout?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsObject()
  moduleSettings?: Record<string, any>;
}
