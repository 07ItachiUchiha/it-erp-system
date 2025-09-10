import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import InvoiceManagement from '../components/invoices/InvoiceManagement';
import ExpenseManagement from '../components/expenses/ExpenseManagement';
import BillManagement from '../components/bills/BillManagement';
import FinancialOverview from '../components/finance/FinancialOverview';
import AdvancedInvoiceManagement from '../components/finance/AdvancedInvoiceManagement';
import GSTManagement from '../components/finance/GSTManagement';
import ExportManagement from '../components/finance/ExportManagement';
import PrintManagement from '../components/finance/PrintManagement';

type FinanceTab = 'overview' | 'invoices' | 'advanced-invoices' | 'gst' | 'exports' | 'prints' | 'expenses' | 'bills';

const FinancePage: React.FC = () => {
  return (
    <ProtectedRoute resource="finance" action="read">
      <Layout>
        <FinanceContent />
      </Layout>
    </ProtectedRoute>
  );
};

const FinanceContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');

  const tabs = [
    { id: 'overview' as FinanceTab, label: 'Overview' },
    { id: 'invoices' as FinanceTab, label: 'Basic Invoices' },
    { id: 'advanced-invoices' as FinanceTab, label: 'Advanced Invoices' },
    { id: 'gst' as FinanceTab, label: 'GST Management' },
    { id: 'exports' as FinanceTab, label: 'Export System' },
    { id: 'prints' as FinanceTab, label: 'Print Templates' },
    { id: 'expenses' as FinanceTab, label: 'Expenses' },
    { id: 'bills' as FinanceTab, label: 'Bills' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <FinancialOverview onNavigateToTab={setActiveTab} />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'advanced-invoices':
        return <AdvancedInvoiceManagement />;
      case 'gst':
        return <GSTManagement />;
      case 'exports':
        return <ExportManagement />;
      case 'prints':
        return <PrintManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'bills':
        return <BillManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
        <p className="text-gray-600">Manage invoices, expenses, bills, and financial reports</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FinancePage;
