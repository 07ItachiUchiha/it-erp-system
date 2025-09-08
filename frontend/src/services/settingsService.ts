
export interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  avatar?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  lastPasswordChange?: Date;
  loginHistory?: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notifications: {
    newOrders: boolean;
    lowInventory: boolean;
    paymentReceived: boolean;
    employeeLeave: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    taskAssignments: boolean;
    projectUpdates: boolean;
    invoiceGenerated: boolean;
    appointmentReminders: boolean;
    deadlineAlerts: boolean;
  };
}

export interface IntegrationSettings {
  email: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    encryption?: 'tls' | 'ssl' | 'none';
  };
  payment: {
    enabled: boolean;
    gateways: {
      razorpay?: { enabled: boolean; keyId?: string; keySecret?: string };
      stripe?: { enabled: boolean; publishableKey?: string; secretKey?: string };
      paypal?: { enabled: boolean; clientId?: string; clientSecret?: string };
    };
  };
  storage: {
    provider: 'local' | 'aws' | 'google' | 'azure';
    aws?: { accessKey?: string; secretKey?: string; bucket?: string; region?: string };
    google?: { projectId?: string; keyFile?: string; bucket?: string };
    azure?: { accountName?: string; accountKey?: string; container?: string };
  };
  sms: {
    enabled: boolean;
    provider: 'twilio' | 'textlocal' | 'msg91';
    apiKey?: string;
    apiSecret?: string;
    senderId?: string;
  };
  analytics: {
    enabled: boolean;
    googleAnalytics?: { trackingId?: string };
    mixpanel?: { projectToken?: string };
  };
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  logo?: string;
  industry?: string;
  employeeCount?: number;
  established?: Date;
}

export interface SystemSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  autoLogout: boolean;
  maintenanceMode: boolean;
}

export interface ModuleSettings {
  employees: {
    enabled: boolean;
    features: {
      attendance: boolean;
      payroll: boolean;
      performance: boolean;
      documents: boolean;
    };
  };
  hr: {
    enabled: boolean;
    features: {
      recruitment: boolean;
      onboarding: boolean;
      leaves: boolean;
      appraisals: boolean;
    };
  };
  finance: {
    enabled: boolean;
    features: {
      accounting: boolean;
      invoicing: boolean;
      expenses: boolean;
      budgeting: boolean;
    };
  };
  inventory: {
    enabled: boolean;
    features: {
      stockManagement: boolean;
      warehouses: boolean;
      suppliers: boolean;
      reorderPoints: boolean;
    };
  };
  sales: {
    enabled: boolean;
    features: {
      leads: boolean;
      opportunities: boolean;
      quotations: boolean;
      orders: boolean;
    };
  };
  procurement: {
    enabled: boolean;
    features: {
      purchaseOrders: boolean;
      vendors: boolean;
      approvals: boolean;
      contracts: boolean;
    };
  };
  projects: {
    enabled: boolean;
    features: {
      planning: boolean;
      tracking: boolean;
      collaboration: boolean;
      timeTracking: boolean;
    };
  };
  files: {
    enabled: boolean;
    features: {
      storage: boolean;
      sharing: boolean;
      versioning: boolean;
      permissions: boolean;
    };
  };
}

class SettingsService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // User Profile Settings
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Security Settings
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/security/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching security settings:', error);
      throw error;
    }
  }

  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/security/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update security settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/password/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Notification Settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/notifications/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/notifications/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Company Settings
  async getCompanySettings(): Promise<CompanySettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/company`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
  }

  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update company settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/system`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/system`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update system settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // Appearance Settings
  async getAppearanceSettings(userId: string): Promise<{
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    showSidebar: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/appearance/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appearance settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appearance settings:', error);
      throw error;
    }
  }

  async updateAppearanceSettings(userId: string, settings: {
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
    compactMode?: boolean;
    showSidebar?: boolean;
  }): Promise<{
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    showSidebar: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/appearance/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update appearance settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating appearance settings:', error);
      throw error;
    }
  }

  // Module Settings
  async getModuleSettings(): Promise<ModuleSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/modules`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch module settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching module settings:', error);
      throw error;
    }
  }

  async updateModuleSettings(settings: Partial<ModuleSettings>): Promise<ModuleSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/modules`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update module settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating module settings:', error);
      throw error;
    }
  }

  // Backup and Export
  async createBackup(): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async exportData(modules: string[]): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modules }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async getSystemInfo(): Promise<{
    version: string;
    database: string;
    lastBackup?: Date;
    storageUsed: number;
    storageLimit: number;
    uptime: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/system-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system info:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  // Integration Settings
  async getIntegrationSettings(): Promise<IntegrationSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/integrations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch integration settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching integration settings:', error);
      // Return default settings if fetch fails
      return {
        email: { enabled: false, provider: 'smtp' },
        payment: { enabled: false, gateways: {} },
        storage: { provider: 'local' },
        sms: { enabled: false, provider: 'twilio' },
        analytics: { enabled: false }
      };
    }
  }

  async updateIntegrationSettings(settings: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/integrations`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update integration settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating integration settings:', error);
      throw error;
    }
  }

  // Test integrations
  async testEmailIntegration(settings: IntegrationSettings['email']): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to test email integration');
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing email integration:', error);
      return { success: false, message: 'Failed to test email integration' };
    }
  }

  async testSmsIntegration(settings: IntegrationSettings['sms']): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/test-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to test SMS integration');
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing SMS integration:', error);
      return { success: false, message: 'Failed to test SMS integration' };
    }
  }

  // Advanced Features
  async getAuditLogs(page: number = 1, limit: number = 50): Promise<{
    logs: Array<{
      id: string;
      action: string;
      module: string;
      userId: string;
      userName: string;
      timestamp: Date;
      details: any;
      ipAddress: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/admin/audit-logs?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  async importSettings(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('settings', file);

      const response = await fetch(`${this.baseURL}/api/v1/api/settings/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing settings:', error);
      return { success: false, message: 'Failed to import settings' };
    }
  }

  async resetToDefaults(modules: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/api/settings/reset-defaults`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modules }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings to defaults');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resetting settings to defaults:', error);
      return { success: false, message: 'Failed to reset settings to defaults' };
    }
  }

  // File upload helper
  async uploadFile(file: File, type: 'avatar' | 'logo' | 'document'): Promise<{ url: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${this.baseURL}/api/v1/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();