import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import Sidebar from '../dashboard/Sidebar';
import CurrencySelector from '../common/CurrencySelector';
import { 
  Home, 
  Users, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  FileText, 
  BarChart3, 
  FolderOpen,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Bell,
  Briefcase,
  UserCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout, canAccess } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Define navigation items with icons and submenu structure
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Home,
      current: router.pathname === '/' 
    },
    { 
      name: 'Employees', 
      href: '/employees', 
      icon: Users,
      current: router.pathname === '/employees',
      resource: 'employees',
      action: 'read'
    },
    { 
      name: 'HR', 
      href: '/hr', 
      icon: UserCheck,
      current: router.pathname === '/hr',
      resource: 'hr',
      action: 'read'
    },
    { 
      name: 'Users', 
      href: '/users', 
      icon: Users,
      current: router.pathname === '/users',
      resource: 'users',
      action: 'read'
    },
    { 
      name: 'Finance', 
      href: '/finance', 
      icon: DollarSign,
      current: router.pathname === '/finance' || router.pathname.startsWith('/finance'),
      resource: 'finance',
      action: 'read'
    },
    { 
      name: 'Sales', 
      href: '/sales', 
      icon: TrendingUp,
      current: router.pathname === '/sales' || router.pathname.startsWith('/sales'),
      resource: 'sales',
      action: 'read'
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: Briefcase,
      current: router.pathname === '/projects' || router.pathname.startsWith('/projects'),
      resource: 'projects',
      action: 'read'
    },
    { 
      name: 'Inventory Management', 
      href: '/inventory', 
      icon: Package,
      current: router.pathname === '/inventory',
      resource: 'inventory',
      action: 'read'
    },
    { 
      name: 'Procurement', 
      href: '/procurement', 
      icon: ShoppingCart,
      current: router.pathname === '/procurement',
      resource: 'procurement',
      action: 'read'
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell,
      current: router.pathname === '/notifications' || router.pathname.startsWith('/notifications'),
      resource: 'notifications',
      action: 'read'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3,
      current: router.pathname === '/reports',
      resource: 'reports',
      action: 'read'
    },
    { 
      name: 'Files', 
      href: '/files', 
      icon: FolderOpen,
      current: router.pathname === '/files',
      resource: 'files',
      action: 'read'
    },
  ];

  // Don't show layout on login page
  if (router.pathname === '/login' || router.pathname === '/unauthorized') {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden lg:ml-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">IT ERP System</h1>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.firstName}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:block bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {router.pathname === '/' && 'Dashboard'}
                  {router.pathname === '/employees' && 'Employee Management'}
                  {router.pathname === '/hr' && 'Human Resources'}
                  {router.pathname === '/users' && 'User Management'}
                  {router.pathname === '/finance' && 'Finance Management'}
                  {router.pathname === '/sales' && 'Sales Management'}
                  {router.pathname === '/projects' && 'Project Management'}
                  {router.pathname === '/procurement' && 'Procurement Management'}
                  {router.pathname === '/notifications' && 'Notifications'}
                  {router.pathname === '/files' && 'File Management'}
                  {router.pathname === '/reports' && 'Reports & Analytics'}
                  {router.pathname === '/inventory' && 'Inventory Management'}
                </h1>
              </div>
              {user && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                      user.role === 'finance' ? 'bg-green-100 text-green-800' :
                      user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div className="w-48">
                    <CurrencySelector showLabel={false} className="text-sm" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
