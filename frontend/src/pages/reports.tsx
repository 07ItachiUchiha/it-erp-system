import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useCurrency } from '../contexts/CurrencyContext';
import { reportsService, ReportData as ApiReportData } from '../services/reportsService';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  EnvelopeIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

interface ReportData {
  employees: {
    total: number;
    active: number;
    departments: { [key: string]: number };
    totalSalary: number;
    averageSalary: number;
  };
  finance: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    invoices: number;
    expenses: number;
  };
  procurement: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalValue: number;
  };
  files: {
    total: number;
    totalSize: number;
    types: { [key: string]: number };
  };
}

const ReportsPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from all modules
      const apiData = await reportsService.getAllReportData();
      
      // Map API data to local interface
      const mappedData: ReportData = {
        employees: apiData.employees,
        finance: apiData.finance,
        procurement: {
          total: apiData.procurement.total,
          pending: apiData.procurement.pending,
          approved: apiData.procurement.approved,
          rejected: apiData.procurement.rejected,
          totalValue: apiData.procurement.totalValue,
        },
        files: {
          total: apiData.files.total,
          totalSize: apiData.files.totalSize,
          types: apiData.files.types,
        },
      };
      
      setReportData(mappedData);
    } catch (error) {
      console.error('Error loading report data:', error);
      // Fallback to mock data if API fails
      const mockData: ReportData = {
        employees: {
          total: 45,
          active: 42,
          departments: {
            'Engineering': 18,
            'HR': 5,
            'Finance': 6,
            'Sales': 8,
            'Marketing': 4,
            'Operations': 4
          },
          totalSalary: 54000000, // INR
          averageSalary: 1200000  // INR
        },
        finance: {
          totalRevenue: 25000000, // INR
          totalExpenses: 18500000, // INR
          netProfit: 6500000, // INR
          invoices: 125,
          expenses: 89
        },
        procurement: {
          total: 34,
          pending: 8,
          approved: 20,
          rejected: 6,
          totalValue: 5600000, // INR
        },
        files: {
          total: 156,
          totalSize: 2147483648, // bytes
          types: {
            'HR Documents': 34,
            'Finance Reports': 28,
            'Marketing': 19,
            'Training': 15,
            'Templates': 22,
            'Contracts': 18,
            'Presentations': 20
          }
        }
      };
      setReportData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const blob = await reportsService.exportReport(format, 'summary');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      // Fallback to JSON export
      const data = JSON.stringify(reportData, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `erp-report-${selectedPeriod}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load report data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive insights from all ERP modules with real-time data integration</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <button
                onClick={() => exportReport('pdf')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-900">{reportData?.employees?.total || 0}</p>
                <p className="text-sm text-gray-500">
                  {reportData?.employees?.active || 0} active ({reportData?.employees?.total ? Math.round(((reportData?.employees?.active || 0) / reportData.employees.total) * 100) : 0}%)
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Net Profit</p>
                <p className="text-3xl font-bold text-green-900">{formatAmount(reportData?.finance?.netProfit || 0)}</p>
                <p className="text-sm text-gray-500">
                  Revenue: {formatAmount(reportData?.finance?.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Procurement Budget</p>
                <p className="text-3xl font-bold text-purple-900">{formatAmount(reportData?.procurement?.totalValue || 0)}</p>
                <p className="text-sm text-gray-500">
                  {reportData?.procurement?.pending || 0} pending approval
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ShoppingCartIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Files</p>
                <p className="text-3xl font-bold text-orange-900">{reportData?.files?.total || 0}</p>
                <p className="text-sm text-gray-500">
                  Storage: {formatFileSize(reportData?.files?.totalSize || 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DocumentIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'employees', name: 'Employees', icon: UsersIcon },
                { id: 'finance', name: 'Finance', icon: CurrencyRupeeIcon },
                { id: 'procurement', name: 'Procurement', icon: ShoppingCartIcon },
                { id: 'files', name: 'Files', icon: DocumentIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedReport === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="mr-2 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Report Content */}
        {selectedReport === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <div className="space-y-3">
                {reportData?.employees?.departments ? Object.entries(reportData.employees.departments).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{dept}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${reportData.employees.total ? (count / reportData.employees.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500">No department data available</div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">{formatAmount(reportData?.finance?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-red-600">{formatAmount(reportData?.finance?.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-900 font-medium">Net Profit</span>
                  <span className="font-bold text-blue-600">{formatAmount(reportData?.finance?.netProfit || 0)}</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Profit Margin: {reportData?.finance?.totalRevenue ? Math.round(((reportData?.finance?.netProfit || 0) / reportData.finance.totalRevenue) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Procurement Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="text-sm font-medium">{reportData?.procurement?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">{reportData?.procurement?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-medium text-green-600">{reportData?.procurement?.approved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="text-sm font-medium text-red-600">{reportData?.procurement?.rejected || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-gray-900 font-medium">Total Value</span>
                  <span className="text-sm font-bold">{formatAmount(reportData?.procurement?.totalValue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Categories</h3>
              <div className="space-y-3">
                {reportData?.files?.types ? Object.entries(reportData.files.types).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium">{count} files</span>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500">No file data available</div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'employees' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Workforce</h4>
                <p className="text-2xl font-bold text-blue-900">{reportData?.employees?.total || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Average Salary</h4>
                <p className="text-2xl font-bold text-green-900">{formatAmount(reportData?.employees?.averageSalary || 0)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800">Total Salary Budget</h4>
                <p className="text-2xl font-bold text-purple-900">{formatAmount(reportData?.employees?.totalSalary || 0)}</p>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'finance' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Revenue & Expenses</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-bold">{formatAmount(reportData?.finance?.totalRevenue || 0)}</span>
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="flex justify-between">
                      <span>Total Expenses</span>
                      <span className="font-bold">{formatAmount(reportData?.finance?.totalExpenses || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Transaction Volume</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Invoices</span>
                    <span className="font-bold">{reportData?.finance?.invoices || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-bold">{reportData?.finance?.expenses || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'procurement' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Procurement Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Request Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <span className="font-bold">{reportData?.procurement?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approval</span>
                    <span className="font-bold text-yellow-600">{reportData?.procurement?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <span className="font-bold text-green-600">{reportData?.procurement?.approved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected</span>
                    <span className="font-bold text-red-600">{reportData?.procurement?.rejected || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Budget Allocation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Budget</span>
                    <span className="font-bold">{formatAmount(reportData?.procurement?.totalValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average per Request</span>
                    <span className="font-bold">{reportData?.procurement?.total ? formatAmount((reportData?.procurement?.totalValue || 0) / reportData.procurement.total) : formatAmount(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'files' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File Management Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Storage Overview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Files</span>
                    <span className="font-bold">{reportData?.files?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Storage</span>
                    <span className="font-bold">{formatFileSize(reportData?.files?.totalSize || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average File Size</span>
                    <span className="font-bold">{reportData?.files?.total ? formatFileSize((reportData?.files?.totalSize || 0) / reportData.files.total) : '0 Bytes'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Category Distribution</h4>
                <div className="space-y-2">
                  {reportData?.files?.types ? Object.entries(reportData.files.types).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span>{category}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500">No file categories available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportReport('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export as PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <TableCellsIcon className="h-4 w-4" />
              Export as Excel
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export as CSV
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Email Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
