import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  Bell
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['inventory']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/',
      icon: Home,
    },
    {
      id: 'employees',
      label: 'Employees',
      href: '/employees',
      icon: Users,
    },
    {
      id: 'users',
      label: 'Users',
      href: '/users',
      icon: Users,
    },
    {
      id: 'finance',
      label: 'Finance',
      href: '/finance',
      icon: DollarSign,
    },
    {
      id: 'sales',
      label: 'Sales',
      href: '/sales',
      icon: TrendingUp,
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase,
    },
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: Package,
      submenu: [
        {
          id: 'basic-inventory',
          label: 'Basic Inventory',
          href: '/inventory',
          icon: Package,
        },
        {
          id: 'advanced-inventory',
          label: 'Advanced Inventory',
          href: '/advanced-inventory',
          icon: Factory,
        },
        {
          id: 'barcodes',
          label: 'Barcodes',
          href: '/advanced-inventory#barcodes',
          icon: QrCode,
        },
        {
          id: 'variants',
          label: 'Product Variants',
          href: '/advanced-inventory#variants',
          icon: Layers,
        },
        {
          id: 'manufacturing',
          label: 'Manufacturing Orders',
          href: '/advanced-inventory#manufacturing',
          icon: Factory,
        },
        {
          id: 'workstations',
          label: 'Workstations',
          href: '/advanced-inventory#workstations',
          icon: Monitor,
        },
        {
          id: 'batches',
          label: 'Batches & Serials',
          href: '/advanced-inventory#batches',
          icon: Hash,
        },
      ],
    },
    {
      id: 'procurement',
      label: 'Procurement',
      href: '/procurement',
      icon: ShoppingCart,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
    {
      id: 'files',
      label: 'Files',
      href: '/files',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  const renderMenuItem = (item: any) => {
    const IconComponent = item.icon;
    const isExpanded = expandedMenus.includes(item.id);

    if (item.submenu) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <IconComponent className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.submenu.map((subItem: any) => {
                const SubIconComponent = subItem.icon;
                return (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActiveRoute(subItem.href)
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <SubIconComponent className="h-4 w-4 mr-3" />
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`flex items-center px-4 py-3 rounded-lg transition-colors mb-1 ${
          isActiveRoute(item.href)
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <IconComponent className="h-5 w-5 mr-3" />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">ERP System</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map(renderMenuItem)}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 text-center">
              IT ERP System v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
