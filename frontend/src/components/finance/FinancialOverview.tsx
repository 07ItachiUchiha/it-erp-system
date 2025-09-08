import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { financeService, FinancialSummary } from '../../services/financeService';

interface FinancialOverviewProps {
  onNavigateToTab: (tab: 'invoices' | 'expenses' | 'bills') => void;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({ onNavigateToTab }) => {
  const { formatAmount } = useCurrency();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await financeService.getFinancialSummary();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching financial summary:', err);
        setError('Failed to load financial summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Financial Data</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            {summary ? formatAmount(summary.totalRevenue) : formatAmount(0)}
          </p>
          <p className="text-sm text-gray-600">From all invoices</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Paid Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">
            {summary ? formatAmount(summary.paidRevenue) : formatAmount(0)}
          </p>
          <p className="text-sm text-gray-600">From paid invoices</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">
            {summary ? formatAmount(summary.totalExpenses) : formatAmount(0)}
          </p>
          <p className="text-sm text-gray-600">Business expenses</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Profit</h3>
          <p className={`text-3xl font-bold ${
            summary && summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summary ? formatAmount(summary.netProfit) : formatAmount(0)}
          </p>
          <p className="text-sm text-gray-600">Paid revenue - Expenses</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigateToTab('invoices')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl"></span>
              <div>
                <h4 className="font-medium text-gray-900">Manage Invoices</h4>
                <p className="text-sm text-gray-600">Create and track invoices</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => onNavigateToTab('expenses')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl"></span>
              <div>
                <h4 className="font-medium text-gray-900">Track Expenses</h4>
                <p className="text-sm text-gray-600">Record business expenses</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => onNavigateToTab('bills')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl"></span>
              <div>
                <h4 className="font-medium text-gray-900">Manage Bills</h4>
                <p className="text-sm text-gray-600">Handle bill payments</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Revenue Collection</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${summary.totalRevenue > 0 ? (summary.paidRevenue / summary.totalRevenue) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {summary.totalRevenue > 0 
                    ? `${Math.round((summary.paidRevenue / summary.totalRevenue) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatAmount(summary.paidRevenue)} of {formatAmount(summary.totalRevenue)} collected
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Profit Margin</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      summary.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(summary.netProfit / Math.max(summary.paidRevenue, 1)) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {summary.paidRevenue > 0
                    ? `${Math.round((summary.netProfit / summary.paidRevenue) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {summary.netProfit >= 0 ? 'Profitable' : 'Loss'}: {formatAmount(Math.abs(summary.netProfit))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
