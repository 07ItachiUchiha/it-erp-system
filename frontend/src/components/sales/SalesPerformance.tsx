import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { SalesPerformanceService } from '../../services/salesPerformanceService';

interface SalesPerformanceProps {
  onClose?: () => void;
}

const SalesPerformance: React.FC<SalesPerformanceProps> = ({ onClose }) => {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState('revenue');
  const [timeRange, setTimeRange] = useState('12months');
  const [loading, setLoading] = useState(false);

  // Data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [pipelineData, setPipelineData] = useState<any>({});

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      const revenue = SalesPerformanceService.getMonthlyRevenueData();
      const conversion = SalesPerformanceService.getConversionFunnelData();
      const trends = SalesPerformanceService.getWeeklyTrendData();
      const products = SalesPerformanceService.getProductPerformanceData();
      const kpiData = SalesPerformanceService.getKPIs();
      const pipeline = SalesPerformanceService.getSalesPipelineData();

      setRevenueData(revenue);
      setConversionData(conversion);
      setTrendData(trends);
      setProductData(products);
      setKpis(kpiData);
      setPipelineData(pipeline);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'revenue', name: 'Revenue Trends', icon: TrendingUp },
    { id: 'conversion', name: 'Conversion Funnel', icon: Target },
    { id: 'pipeline', name: 'Sales Pipeline', icon: BarChart3 },
    { id: 'products', name: 'Product Performance', icon: PieChartIcon }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const KPICard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const renderRevenueChart = () => (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatAmount(kpis.totalRevenue || 0)}
          change={12}
          icon={IndianRupee}
          color="bg-blue-500"
        />
        <KPICard
          title="Average Order Value"
          value={formatAmount(kpis.averageOrderValue || 0)}
          change={8}
          icon={DollarSign}
          color="bg-green-500"
        />
        <KPICard
          title="Total Customers"
          value={kpis.totalCustomers || 0}
          change={15}
          icon={Users}
          color="bg-purple-500"
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders || 0}
          change={22}
          icon={Activity}
          color="bg-orange-500"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value: number) => formatAmount(value)} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'revenue' ? formatAmount(value) : value,
                name === 'revenue' ? 'Revenue' : name === 'target' ? 'Target' : 'Orders'
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#EF4444"
              strokeDasharray="5 5"
              name="Target"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Activity Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="customers" stroke="#3B82F6" name="New Customers" />
            <Line type="monotone" dataKey="enquiries" stroke="#10B981" name="Enquiries" />
            <Line type="monotone" dataKey="quotations" stroke="#F59E0B" name="Quotations" />
            <Line type="monotone" dataKey="orders" stroke="#EF4444" name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderConversionChart = () => (
    <div className="space-y-6">
      {/* Conversion KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Overall Conversion Rate"
          value={`${kpis.conversionRate || 0}%`}
          change={5}
          icon={Target}
          color="bg-blue-500"
        />
        <KPICard
          title="Quotation Win Rate"
          value={`${kpis.quotationWinRate || 0}%`}
          change={-2}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <KPICard
          title="Pipeline Value"
          value={formatAmount(conversionData.reduce((sum, item) => sum + item.value, 0))}
          change={18}
          icon={Zap}
          color="bg-purple-500"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Conversion Funnel</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={conversionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={80} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'value' ? formatAmount(value) : value,
                  name === 'value' ? 'Value' : 'Count'
                ]}
              />
              <Bar dataKey="count" fill="#3B82F6" name="Count" />
            </BarChart>
          </ResponsiveContainer>

          {/* Funnel Details */}
          <div className="space-y-4">
            {conversionData.map((item, index) => (
              <div key={item.stage} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{item.stage}</h4>
                  <span className="text-sm font-medium text-blue-600">{item.percentage}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Count:</span>
                    <span className="ml-2 font-medium">{item.count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>
                    <span className="ml-2 font-medium">{formatAmount(item.value)}</span>
                  </div>
                </div>
                {index < conversionData.length - 1 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPipelineChart = () => (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{pipelineData.newEnquiries || 0}</div>
          <div className="text-sm text-blue-800">New Enquiries</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{pipelineData.inProgressEnquiries || 0}</div>
          <div className="text-sm text-green-800">In Progress</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pipelineData.sentQuotations || 0}</div>
          <div className="text-sm text-yellow-800">Sent Quotations</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{pipelineData.acceptedQuotations || 0}</div>
          <div className="text-sm text-purple-800">Accepted</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{pipelineData.pendingOrders || 0}</div>
          <div className="text-sm text-orange-800">Pending Orders</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{pipelineData.processingOrders || 0}</div>
          <div className="text-sm text-indigo-800">Processing</div>
        </div>
      </div>

      {/* Pipeline Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Pipeline Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { stage: 'New Enquiries', count: pipelineData.newEnquiries || 0 },
            { stage: 'In Progress', count: pipelineData.inProgressEnquiries || 0 },
            { stage: 'Quotations Sent', count: pipelineData.sentQuotations || 0 },
            { stage: 'Accepted', count: pipelineData.acceptedQuotations || 0 },
            { stage: 'Orders Pending', count: pipelineData.pendingOrders || 0 },
            { stage: 'Processing', count: pipelineData.processingOrders || 0 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderProductChart = () => (
    <div className="space-y-6">
      {/* Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatAmount(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          <div className="space-y-3">
            {productData.map((product, index) => (
              <div key={product.category} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900">{product.category}</div>
                    <div className="text-sm text-gray-600">{product.orders} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatAmount(product.revenue)}</div>
                  <div className={`text-sm flex items-center ${
                    product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(product.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Orders Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading performance data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'revenue':
        return renderRevenueChart();
      case 'conversion':
        return renderConversionChart();
      case 'pipeline':
        return renderPipelineChart();
      case 'products':
        return renderProductChart();
      default:
        return renderRevenueChart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Performance Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into your sales performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="12months">Last 12 months</option>
            <option value="year">This year</option>
          </select>
          <button
            onClick={loadPerformanceData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default SalesPerformance;
