import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settingsService';
import type {
  UserProfile,
  SecuritySettings as SecuritySettingsType,
  NotificationSettings as NotificationSettingsType,
  CompanySettings as CompanySettingsType,
  SystemSettings as SystemSettingsType,
  ModuleSettings as ModuleSettingsType,
  IntegrationSettings
} from '../services/settingsService';
import {
  Settings,
  User,
  Lock,
  Bell,
  Globe,
  Palette,
  Database,
  Shield,
  Mail,
  Clock,
  DollarSign,
  Archive,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Users,
  Building,
  CreditCard,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Briefcase,
  UserCheck
} from 'lucide-react';

type SettingsTab = 
  | 'profile' 
  | 'security' 
  | 'notifications' 
  | 'appearance' 
  | 'currency' 
  | 'company' 
  | 'modules' 
  | 'integrations' 
  | 'backup' 
  | 'system';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentCurrency, setCurrency, getSupportedCurrencies } = useCurrency();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Get supported currencies
  const supportedCurrencies = getSupportedCurrencies();

  // Settings states
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    position: '',
    department: ''
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notifications: {
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
      appointmentReminders: true,
      deadlineAlerts: true
    }
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    primaryColor: '#3B82F6',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    compactMode: false,
    showSidebar: true
  });

  const [companySettings, setCompanySettings] = useState<CompanySettingsType>({
    companyName: 'Your Company Name',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
    taxId: ''
  });

  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsType>({
    employees: {
      enabled: true,
      features: {
        attendance: true,
        payroll: true,
        performance: true,
        documents: true
      }
    },
    hr: {
      enabled: true,
      features: {
        recruitment: true,
        onboarding: true,
        leaves: true,
        appraisals: true
      }
    },
    finance: {
      enabled: true,
      features: {
        accounting: true,
        invoicing: true,
        expenses: true,
        budgeting: true
      }
    },
    inventory: {
      enabled: true,
      features: {
        stockManagement: true,
        warehouses: true,
        suppliers: true,
        reorderPoints: true
      }
    },
    sales: {
      enabled: true,
      features: {
        leads: true,
        opportunities: true,
        quotations: true,
        orders: true
      }
    },
    procurement: {
      enabled: true,
      features: {
        purchaseOrders: true,
        vendors: true,
        approvals: true,
        contracts: true
      }
    },
    projects: {
      enabled: true,
      features: {
        planning: true,
        tracking: true,
        collaboration: true,
        timeTracking: true
      }
    },
    files: {
      enabled: true,
      features: {
        storage: true,
        sharing: true,
        versioning: true,
        permissions: true
      }
    }
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettingsType>({
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    theme: 'light',
    backupFrequency: 'daily',
    autoLogout: true,
    maintenanceMode: false
  });

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    email: { enabled: false, provider: 'smtp' },
    payment: { enabled: false, gateways: {} },
    storage: { provider: 'local' },
    sms: { enabled: false, provider: 'twilio' },
    analytics: { enabled: false }
  });

  // Form states for security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Load all settings in parallel
      const [
        profileData,
        securityData,
        notificationData,
        appearanceData,
        companyData,
        systemData,
        moduleData,
        integrationData
      ] = await Promise.allSettled([
        settingsService.getUserProfile(user.id),
        settingsService.getSecuritySettings(user.id),
        settingsService.getNotificationSettings(user.id),
        settingsService.getAppearanceSettings(user.id),
        settingsService.getCompanySettings(),
        settingsService.getSystemSettings(),
        settingsService.getModuleSettings(),
        settingsService.getIntegrationSettings()
      ]);

      // Update states with loaded data
      if (profileData.status === 'fulfilled') {
        setUserProfile(profileData.value);
      }
      if (securityData.status === 'fulfilled') {
        setSecuritySettings(securityData.value);
      }
      if (notificationData.status === 'fulfilled') {
        setNotificationSettings(notificationData.value);
      }
      if (appearanceData.status === 'fulfilled') {
        setAppearanceSettings(appearanceData.value);
      }
      if (companyData.status === 'fulfilled') {
        setCompanySettings(companyData.value);
      }
      if (systemData.status === 'fulfilled') {
        setSystemSettings(systemData.value);
      }
      if (moduleData.status === 'fulfilled') {
        setModuleSettings(moduleData.value);
      }
      if (integrationData.status === 'fulfilled') {
        setIntegrationSettings(integrationData.value);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError('');
    setSaveMessage('');

    try {
      switch (section) {
        case 'Profile':
          await settingsService.updateUserProfile(user.id, userProfile);
          break;
        case 'Security':
          if (newPassword && currentPassword) {
            await settingsService.changePassword(user.id, currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }
          await settingsService.updateSecuritySettings(user.id, securitySettings);
          break;
        case 'Notifications':
          await settingsService.updateNotificationSettings(user.id, notificationSettings);
          break;
        case 'Appearance':
          await settingsService.updateAppearanceSettings(user.id, appearanceSettings);
          break;
        case 'Company':
          await settingsService.updateCompanySettings(companySettings);
          break;
        case 'System':
          await settingsService.updateSystemSettings(systemSettings);
          break;
        case 'Modules':
          await settingsService.updateModuleSettings(moduleSettings);
          break;
        case 'Integrations':
          await settingsService.updateIntegrationSettings(integrationSettings);
          break;
        case 'Currency':
          // Currency is handled by the context
          break;
      }

      setSaveMessage(`${section} settings saved successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      setError(`Failed to save ${section} settings`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'logo') => {
    try {
      setLoading(true);
      const result = await settingsService.uploadFile(file, type);
      
      if (type === 'avatar') {
        setUserProfile(prev => ({ ...prev, avatar: result.url }));
      } else if (type === 'logo') {
        setCompanySettings(prev => ({ ...prev, logo: result.url }));
      }
      
      setSaveMessage(`${type} uploaded successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Failed to upload ${type}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'currency', name: 'Currency', icon: DollarSign },
    { id: 'company', name: 'Company', icon: Building },
    { id: 'modules', name: 'Modules', icon: Package },
    { id: 'integrations', name: 'Integrations', icon: RefreshCw },
    { id: 'backup', name: 'Backup', icon: Archive },
    { id: 'system', name: 'System', icon: Settings }
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={userProfile.firstName}
              onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={userProfile.lastName}
              onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={userProfile.phone}
              onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              value={userProfile.position}
              onChange={(e) => setUserProfile({...userProfile, position: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={userProfile.department}
              onChange={(e) => setUserProfile({...userProfile, department: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              <option value="hr">Human Resources</option>
              <option value="finance">Finance</option>
              <option value="sales">Sales</option>
              <option value="it">Information Technology</option>
              <option value="operations">Operations</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Profile')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Security')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Shield className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Update Security'}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Push Notifications</span>
              <p className="text-sm text-gray-500">Receive push notifications in browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Module Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(notificationSettings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    notifications: {
                      ...notificationSettings.notifications,
                      [key]: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Notifications')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Bell className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );

  const renderCurrencySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency
            </label>
            <select
              value={currentCurrency.code}
              onChange={(e) => {
                const selectedCurrency = supportedCurrencies.find(curr => curr.code === e.target.value);
                if (selectedCurrency) {
                  setCurrency(selectedCurrency);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedCurrencies.map((curr: Currency) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name} ({curr.symbol})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              This will be used throughout the ERP system for displaying amounts
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Currency')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Currency'}
        </button>
      </div>
    </div>
  );

  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companySettings.companyName}
              onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={companySettings.address}
              onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={companySettings.city}
              onChange={(e) => setCompanySettings({...companySettings, city: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={companySettings.state}
              onChange={(e) => setCompanySettings({...companySettings, state: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={companySettings.zipCode}
              onChange={(e) => setCompanySettings({...companySettings, zipCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={companySettings.country}
              onChange={(e) => setCompanySettings({...companySettings, country: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={companySettings.phone}
              onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={companySettings.email}
              onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={companySettings.website}
              onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID
            </label>
            <input
              type="text"
              value={companySettings.taxId}
              onChange={(e) => setCompanySettings({...companySettings, taxId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Company')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Building className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Company Info'}
        </button>
      </div>
    </div>
  );

  const renderModuleSettings = () => {
    const modules = [
      { key: 'employees', name: 'Employee Management', icon: Users, description: 'Manage employee records and information' },
      { key: 'hr', name: 'Human Resources', icon: UserCheck, description: 'HR processes, payroll, and leave management' },
      { key: 'finance', name: 'Finance Management', icon: CreditCard, description: 'Financial transactions and accounting' },
      { key: 'inventory', name: 'Inventory Management', icon: Package, description: 'Stock management and warehouse operations' },
      { key: 'sales', name: 'Sales Management', icon: ShoppingCart, description: 'Sales orders, customers, and revenue tracking' },
      { key: 'procurement', name: 'Procurement', icon: Briefcase, description: 'Purchase orders and vendor management' },
      { key: 'projects', name: 'Project Management', icon: BarChart3, description: 'Project tracking and resource allocation' },
      { key: 'files', name: 'File Management', icon: FileText, description: 'Document storage and management' }
    ];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Module Configuration</h3>
          <p className="text-sm text-gray-600 mb-6">
            Enable or disable modules based on your business needs. Disabled modules will not be accessible to users.
          </p>
          
          <div className="space-y-4">
            {modules.map((module) => {
              const IconComponent = module.icon;
              const moduleKey = module.key as keyof typeof moduleSettings;
              const isEnabled = moduleSettings[moduleKey]?.enabled || false;
              
              return (
                <div key={module.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                      <p className="text-sm text-gray-500">{module.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => {
                        setModuleSettings(prev => ({
                          ...prev,
                          [moduleKey]: {
                            ...prev[moduleKey],
                            enabled: e.target.checked
                          }
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleSave('Modules')}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Package className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Module Settings'}
          </button>
        </div>
      </div>
    );
  };

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">ERP Version:</span>
            <span className="text-sm text-gray-600">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Database:</span>
            <span className="text-sm text-gray-600">PostgreSQL 14.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Last Backup:</span>
            <span className="text-sm text-gray-600">2025-09-08 10:30 AM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Storage Used:</span>
            <span className="text-sm text-gray-600">2.5 GB / 10 GB</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Export System Data
          </button>
          <button className="w-full flex items-center justify-center px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </button>
          <button className="w-full flex items-center justify-center px-4 py-2 border border-yellow-600 text-yellow-600 rounded-md hover:bg-yellow-50">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Integration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable Email Integration</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={integrationSettings.email.enabled}
                onChange={(e) => setIntegrationSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {integrationSettings.email.enabled && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Provider</label>
                <select
                  value={integrationSettings.email.provider}
                  onChange={(e) => setIntegrationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, provider: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={integrationSettings.email.host || ''}
                  onChange={(e) => setIntegrationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, host: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="smtp.example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={integrationSettings.email.port || ''}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, port: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                  <select
                    value={integrationSettings.email.encryption || 'tls'}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, encryption: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={async () => {
                  const result = await settingsService.testEmailIntegration(integrationSettings.email);
                  setSaveMessage(result.message);
                  setTimeout(() => setSaveMessage(''), 3000);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Test Email Configuration
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Gateways</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable Payment Integration</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={integrationSettings.payment.enabled}
                onChange={(e) => setIntegrationSettings(prev => ({
                  ...prev,
                  payment: { ...prev.payment, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Integration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable SMS Integration</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={integrationSettings.sms.enabled}
                onChange={(e) => setIntegrationSettings(prev => ({
                  ...prev,
                  sms: { ...prev.sms, enabled: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Integrations')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Integration Settings'}
        </button>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
            <select
              value={systemSettings.backupFrequency}
              onChange={(e) => setSystemSettings(prev => ({
                ...prev,
                backupFrequency: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <div className="space-y-3">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const result = await settingsService.createBackup();
                setSaveMessage('Backup created successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              } catch (error) {
                setError('Failed to create backup');
                setTimeout(() => setError(''), 5000);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Archive className="w-4 h-4 mr-2" />
            Create Full Backup
          </button>
          
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const result = await settingsService.exportData(['all']);
                setSaveMessage('Export completed successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              } catch (error) {
                setError('Failed to export data');
                setTimeout(() => setError(''), 5000);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export System Data
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Backup')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Backup Settings'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={appearanceSettings.theme}
              onChange={(e) => setAppearanceSettings(prev => ({
                ...prev,
                theme: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <input
              type="color"
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings(prev => ({
                ...prev,
                primaryColor: e.target.value
              }))}
              className="w-20 h-10 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={appearanceSettings.fontSize}
              onChange={(e) => setAppearanceSettings(prev => ({
                ...prev,
                fontSize: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Compact Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearanceSettings.compactMode}
                onChange={(e) => setAppearanceSettings(prev => ({
                  ...prev,
                  compactMode: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Appearance')}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Appearance Settings'}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'currency':
        return renderCurrencySettings();
      case 'company':
        return renderCompanySettings();
      case 'modules':
        return renderModuleSettings();
      case 'integrations':
        return renderIntegrationSettings();
      case 'backup':
        return renderBackupSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and system preferences</p>
        </div>

        {saveMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {saveMessage}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="lg:w-1/4">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:w-3/4">
            <div className="bg-white shadow rounded-lg p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
