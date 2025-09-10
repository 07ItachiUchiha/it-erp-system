import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText, 
  Calendar,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus
} from 'lucide-react';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, canAccess } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for dashboard metrics
  const metrics = [
    {
      title: 'Total Employees',
      value: '247',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'blue',
      accessible: canAccess('employees', 'read')
    },
    {
      title: 'Monthly Revenue',
      value: '$142,890',
      change: '+8.2%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'green',
      accessible: canAccess('finance', 'read')
    },
    {
      title: 'Active Projects',
      value: '18',
      change: '+3',
      changeType: 'increase',
      icon: FileText,
      color: 'purple',
      accessible: canAccess('projects', 'read')
    },
    {
      title: 'Pending Tasks',
      value: '47',
      change: '-5%',
      changeType: 'decrease',
      icon: Clock,
      color: 'orange',
      accessible: canAccess('projects', 'read')
    }
  ];

  const recentActivities = [
    { action: 'New employee John Doe added', time: '2 hours ago', type: 'employee', icon: Users },
    { action: 'Invoice #INV-001 generated', time: '4 hours ago', type: 'finance', icon: DollarSign },
    { action: 'Project Alpha completed', time: '1 day ago', type: 'project', icon: CheckCircle },
    { action: 'System backup completed', time: '2 days ago', type: 'system', icon: Activity },
  ];

  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Register new team member',
      href: '/employees?action=add',
      icon: Plus,
      color: 'blue',
      accessible: canAccess('employees', 'create')
    },
    {
      title: 'Create Invoice',
      description: 'Generate new invoice',
      href: '/finance?tab=invoices&action=create',
      icon: FileText,
      color: 'green',
      accessible: canAccess('finance', 'create')
    },
    {
      title: 'View Reports',
      description: 'Access analytics dashboard',
      href: '/reports',
      icon: BarChart3,
      color: 'purple',
      accessible: canAccess('reports', 'read')
    },
    {
      title: 'Manage Files',
      description: 'Upload and organize documents',
      href: '/files',
      icon: FileText,
      color: 'orange',
      accessible: canAccess('files', 'read')
    }
  ];

  const accessibleMetrics = metrics.filter(metric => metric.accessible);
  const accessibleActions = quickActions.filter(action => action.accessible);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
                {user ? `, ${user.firstName || user.email.split('@')[0]}` : ''}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Welcome back to your ERP dashboard. Here's what's happening today.
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            {user && (
              <div className="mt-6 lg:mt-0 lg:ml-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email.split('@')[0]}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                          user.role === 'finance' ? 'bg-green-100 text-green-800' :
                          user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                        {user.department && (
                          <span className="ml-2 text-xs text-gray-500">
                            {user.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Metrics Cards */}
          {accessibleMetrics.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {accessibleMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                            <div className="flex items-center mt-2">
                              {metric.changeType === 'increase' ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ml-1 ${
                                metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {metric.change}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">vs last month</span>
                            </div>
                          </div>
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            metric.color === 'blue' ? 'bg-blue-50' :
                            metric.color === 'green' ? 'bg-green-50' :
                            metric.color === 'purple' ? 'bg-purple-50' :
                            'bg-orange-50'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              metric.color === 'blue' ? 'text-blue-600' :
                              metric.color === 'green' ? 'text-green-600' :
                              metric.color === 'purple' ? 'text-purple-600' :
                              'text-orange-600'
                            }`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  <p className="text-sm text-gray-600">Common tasks and shortcuts</p>
                </div>
                <div className="p-6">
                  {accessibleActions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accessibleActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={index}
                            href={action.href}
                            className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-start">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                action.color === 'blue' ? 'bg-blue-50 group-hover:bg-blue-100' :
                                action.color === 'green' ? 'bg-green-50 group-hover:bg-green-100' :
                                action.color === 'purple' ? 'bg-purple-50 group-hover:bg-purple-100' :
                                'bg-orange-50 group-hover:bg-orange-100'
                              }`}>
                                <Icon className={`h-5 w-5 ${
                                  action.color === 'blue' ? 'text-blue-600' :
                                  action.color === 'green' ? 'text-green-600' :
                                  action.color === 'purple' ? 'text-purple-600' :
                                  'text-orange-600'
                                }`} />
                              </div>
                              <div className="ml-4 flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No quick actions available</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Your current role has limited access. Contact your administrator for additional permissions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600">Latest system updates</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      View all activities
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="ml-3 text-sm font-medium text-green-900">Database</span>
                    </div>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="ml-3 text-sm font-medium text-green-900">API Services</span>
                    </div>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="ml-3 text-sm font-medium text-green-900">File Storage</span>
                    </div>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
