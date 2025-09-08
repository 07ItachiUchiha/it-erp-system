import React, { useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  IndianRupee
} from 'lucide-react';
import SalesPerformance from './SalesPerformance';

interface SalesDashboardProps {
  stats: {
    totalCustomers: number;
    totalEnquiries: number;
    totalQuotations: number;
    totalOrders: number;
    totalRevenue: number;
    pendingDispatches: number;
    overdueInvoices: number;
    activeReturns: number;
  };
  onTabChange: (tab: string) => void;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ stats, onTabChange }) => {
  const { formatAmount } = useCurrency();
  const [showPerformance, setShowPerformance] = useState(false);
  const quickActions = [
    {
      name: 'Add Customer',
      description: 'Register a new customer',
      icon: Users,
      color: 'bg-blue-500',
      action: () => onTabChange('customers')
    },
    {
      name: 'New Enquiry',
      description: 'Create a sales enquiry',
      icon: MessageSquare,
      color: 'bg-green-500',
      action: () => onTabChange('enquiry')
    },
    {
      name: 'Create Quotation',
      description: 'Generate a quotation',
      icon: FileText,
      color: 'bg-purple-500',
      action: () => onTabChange('quotation')
    },
    {
      name: 'Sales Order',
      description: 'Manage sales orders',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      action: () => onTabChange('sales-order')
    }
  ];

  const moduleStats = [
    {
      name: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => onTabChange('customers')
    },
    {
      name: 'Enquiries',
      value: stats.totalEnquiries,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => onTabChange('enquiry')
    },
    {
      name: 'Quotations',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => onTabChange('quotation')
    },
    {
      name: 'Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      action: () => onTabChange('sales-order')
    },
    {
      name: 'Pending Dispatches',
      value: stats.pendingDispatches,
      icon: Truck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      action: () => onTabChange('dispatch')
    },
    {
      name: 'Overdue Invoices',
      value: stats.overdueInvoices,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      action: () => onTabChange('invoice')
    },
    {
      name: 'Active Returns',
      value: stats.activeReturns,
      icon: RotateCcw,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      action: () => onTabChange('returns')
    },
    {
      name: 'Total Revenue',
      value: formatAmount(stats.totalRevenue || 0),
      icon: IndianRupee,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      action: () => onTabChange('invoice')
    }
  ];

  const recentActivities = [
    {
      action: 'New customer registered',
      customer: 'Acme Corp',
      time: '2 hours ago',
      type: 'customer'
    },
    {
      action: 'Quotation sent',
      customer: 'TechStart Inc',
      time: '4 hours ago',
      type: 'quotation'
    },
    {
      action: 'Order confirmed',
      customer: 'Global Systems',
      time: '6 hours ago',
      type: 'order'
    },
    {
      action: 'Invoice overdue',
      customer: 'Local Business',
      time: '1 day ago',
      type: 'invoice'
    },
    {
      action: 'Dispatch completed',
      customer: 'Regional Corp',
      time: '2 days ago',
      type: 'dispatch'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer': return Users;
      case 'quotation': return FileText;
      case 'order': return ShoppingCart;
      case 'invoice': return Receipt;
      case 'dispatch': return Truck;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer': return 'text-blue-500';
      case 'quotation': return 'text-purple-500';
      case 'order': return 'text-green-500';
      case 'invoice': return 'text-red-500';
      case 'dispatch': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="mr-3 h-6 w-6 text-blue-600" />
            Sales Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Overview of your sales operations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`${action.color} p-2 rounded-md group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.name}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Module Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {moduleStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                onClick={stat.action}
                className="cursor-pointer p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-md group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gray-100`}>
                    <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.customer}</p>
                  </div>
                  <div className="text-sm text-gray-400">{activity.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts and Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-4">
            {stats.overdueInvoices > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {stats.overdueInvoices} overdue invoice(s)
                  </p>
                  <p className="text-sm text-red-600">Requires immediate attention</p>
                </div>
              </div>
            )}
            
            {stats.pendingDispatches > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Truck className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.pendingDispatches} pending dispatch(es)
                  </p>
                  <p className="text-sm text-yellow-600">Ready for shipment</p>
                </div>
              </div>
            )}
            
            {stats.activeReturns > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <RotateCcw className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {stats.activeReturns} active return(s)
                  </p>
                  <p className="text-sm text-blue-600">Needs processing</p>
                </div>
              </div>
            )}
            
            {stats.overdueInvoices === 0 && stats.pendingDispatches === 0 && stats.activeReturns === 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">All systems running smoothly</p>
                  <p className="text-sm text-green-600">No urgent actions required</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      {showPerformance ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Sales Performance Analytics</h3>
              <button
                onClick={() => setShowPerformance(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            <SalesPerformance />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Performance</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">Interactive Performance Analytics</p>
              <p className="text-gray-500 mb-4">Revenue trends, conversion rates, pipeline analysis, and more</p>
              <button
                onClick={() => setShowPerformance(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                View Performance Charts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
