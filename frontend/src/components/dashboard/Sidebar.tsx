import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  Factory,
  QrCode,
  Layers,
  Monitor,
  Hash,
  TrendingUp,
  Briefcase,
  ShoppingCart,
  Bell,
  UserCheck,
  PieChart,
  Calendar,
  Globe,
  Shield,
  Database,
  Zap,
  Award,
  Target,
  Truck,
  CreditCard,
  Clock,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  permission?: string;
  href?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  href: string;
  icon: any;
}

interface MenuSection {
  id: string;
  label: string;
  type: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const { canAccess } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['main']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems: MenuSection[] = [
    {
      id: 'main',
      label: 'Main',
      type: 'section',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/',
          icon: Home,
          description: 'Overview & Analytics'
        },
      ]
    },
    {
      id: 'core',
      label: 'Core Modules',
      type: 'section',
      items: [
        {
          id: 'employees',
          label: 'Employees',
          icon: Users,
          description: 'Staff Management',
          permission: 'employees',
          submenu: [
            { label: 'All Employees', href: '/employees', icon: Users },
            { label: 'Departments', href: '/employees?tab=departments', icon: Building },
            { label: 'Positions', href: '/employees?tab=positions', icon: Award },
          ]
        },
        {
          id: 'hr',
          label: 'Human Resources',
          icon: UserCheck,
          description: 'HR Operations',
          permission: 'hr',
          submenu: [
            { label: 'HR Dashboard', href: '/hr', icon: BarChart3 },
            { label: 'Attendance', href: '/hr?tab=attendance', icon: Clock },
            { label: 'Payroll', href: '/hr?tab=payroll', icon: DollarSign },
            { label: 'Leave Requests', href: '/hr?tab=leave', icon: Calendar },
            { label: 'Performance', href: '/hr?tab=performance', icon: Target },
          ]
        },
        {
          id: 'projects',
          label: 'Projects',
          icon: Briefcase,
          description: 'Project Management',
          permission: 'projects',
          submenu: [
            { label: 'All Projects', href: '/projects', icon: Briefcase },
            { label: 'Tasks', href: '/projects?tab=tasks', icon: FileText },
            { label: 'Timeline', href: '/projects?tab=timeline', icon: Calendar },
            { label: 'Resources', href: '/projects?tab=resources', icon: Users },
          ]
        },
      ]
    },
    {
      id: 'finance',
      label: 'Finance & Sales',
      type: 'section',
      items: [
        {
          id: 'finance',
          label: 'Finance',
          icon: DollarSign,
          description: 'Financial Management',
          permission: 'finance',
          submenu: [
            { label: 'Dashboard', href: '/finance', icon: BarChart3 },
            { label: 'Invoices', href: '/finance?tab=invoices', icon: FileText },
            { label: 'Expenses', href: '/finance?tab=expenses', icon: CreditCard },
            { label: 'Bills', href: '/finance?tab=bills', icon: FileText },
            { label: 'Reports', href: '/finance?tab=reports', icon: TrendingUp },
          ]
        },
        {
          id: 'sales',
          label: 'Sales',
          icon: ShoppingCart,
          description: 'Sales Operations',
          permission: 'sales',
          submenu: [
            { label: 'Sales Dashboard', href: '/sales', icon: BarChart3 },
            { label: 'Leads', href: '/sales?tab=leads', icon: Target },
            { label: 'Opportunities', href: '/sales?tab=opportunities', icon: TrendingUp },
            { label: 'Orders', href: '/sales?tab=orders', icon: ShoppingCart },
          ]
        },
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      type: 'section',
      items: [
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Package,
          description: 'Stock Management',
          permission: 'inventory',
          submenu: [
            { label: 'Products', href: '/inventory', icon: Package },
            { label: 'Categories', href: '/inventory?tab=categories', icon: Layers },
            { label: 'Stock Levels', href: '/inventory?tab=stock', icon: BarChart3 },
            { label: 'Barcode', href: '/inventory?tab=barcode', icon: QrCode },
            { label: 'Manufacturing', href: '/inventory?tab=manufacturing', icon: Factory },
          ]
        },
        {
          id: 'procurement',
          label: 'Procurement',
          icon: Truck,
          description: 'Purchase Management',
          permission: 'procurement',
          submenu: [
            { label: 'Purchase Orders', href: '/procurement', icon: FileText },
            { label: 'Suppliers', href: '/procurement?tab=suppliers', icon: Building },
            { label: 'Requests', href: '/procurement?tab=requests', icon: MessageSquare },
          ]
        },
      ]
    },
    {
      id: 'system',
      label: 'System',
      type: 'section',
      items: [
        {
          id: 'files',
          label: 'Files',
          href: '/files',
          icon: FileText,
          description: 'Document Management',
          permission: 'files'
        },
        {
          id: 'users',
          label: 'Users',
          href: '/users',
          icon: Shield,
          description: 'User Management',
          permission: 'users'
        },
        {
          id: 'reports',
          label: 'Reports',
          href: '/reports',
          icon: BarChart3,
          description: 'Analytics & Reports',
          permission: 'reports'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          href: '/notifications',
          icon: Bell,
          description: 'System Alerts'
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/settings',
          icon: Settings,
          description: 'System Configuration'
        },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return canAccess(permission, 'read');
  };

  return (
    <div className={`${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <span className="ml-3 text-lg font-bold text-white">IT ERP</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-md text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-6">
            {menuItems.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.label}
                  </h3>
                </div>

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (!hasAccess(item.permission)) return null;

                    const Icon = item.icon;
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenus.includes(item.id);

                    if (hasSubmenu) {
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => toggleMenu(item.id)}
                            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                          >
                            <Icon className="h-5 w-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          
                          {isExpanded && item.submenu && (
                            <div className="mt-1 ml-6 space-y-1">
                              {item.submenu.map((subitem: SubMenuItem) => {
                                const SubIcon = subitem.icon;
                                return (
                                  <Link
                                    key={subitem.href}
                                    href={subitem.href}
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                      isActive(subitem.href)
                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                  >
                                    <SubIcon className={`h-4 w-4 mr-3 ${
                                      isActive(subitem.href) ? 'text-blue-600' : 'text-gray-400'
                                    }`} />
                                    {subitem.label}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    } else if (item.href) {
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                            isActive(item.href)
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mr-3 ${
                            isActive(item.href) 
                              ? 'text-blue-600' 
                              : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>© 2025 IT ERP System</span>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
