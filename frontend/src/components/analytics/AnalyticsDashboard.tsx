import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  expensesByCategory: Array<{ category: string; amount: number; color: string }>;
  employeeGrowth: Array<{ month: string; employees: number }>;
  departmentDistribution: Array<{ department: string; count: number; color: string }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  const { formatAmount } = useCurrency();
  
  // Wrapper functions for chart components that expect different signatures
  const formatCurrencyForChart = (value: number) => formatAmount(value);
  const formatCurrencyForTooltip = (value: number) => formatAmount(value);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Monthly Revenue vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrencyForChart} />
            <Tooltip formatter={formatCurrencyForTooltip} />
            <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expenses by Category Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Expenses by Category
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.expensesByCategory}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) =>
                `${category} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {data.expensesByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatCurrencyForTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Trend Area Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Profit Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrencyForChart} />
            <Tooltip formatter={formatCurrencyForTooltip} />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Employee Growth Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Employee Growth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.employeeGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="employees"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Department Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Employee Distribution by Department
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.departmentDistribution}
            layout="horizontal"
            margin={{ left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="department" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366F1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
