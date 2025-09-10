import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Download, FileSpreadsheet, FilePlus, 
  Calendar, Users, DollarSign, TrendingUp, Eye, Edit, 
  Trash2, CheckSquare, Square, MoreHorizontal, Upload,
  RefreshCw, AlertCircle, CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

// Types for advanced invoice management
interface AdvancedInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerGSTIN?: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdDate: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  paymentTerms: string;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; }>;
  action: (invoiceIds: string[]) => void;
  confirmMessage?: string;
}

interface SearchFilters {
  query: string;
  status: string[];
  dateRange: {
    from: string;
    to: string;
  };
  amountRange: {
    min: number;
    max: number;
  };
  customerType: string;
  priority: string[];
  tags: string[];
}

const AdvancedInvoiceManagement: React.FC = () => {
  const { formatAmount } = useCurrency();
  
  // State management
  const [invoices, setInvoices] = useState<AdvancedInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<AdvancedInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Advanced search and filter state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    dateRange: { from: '', to: '' },
    amountRange: { min: 0, max: 0 },
    customerType: '',
    priority: [],
    tags: []
  });

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    averageInvoiceValue: 0,
    gstCollected: 0
  });

  // Load invoices with advanced filtering
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would call our new enhanced invoice API
      const response = await fetch('/api/v1/finance/enhanced-invoices/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...filters,
          page: currentPage,
          limit: itemsPerPage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setFilteredInvoices(data.invoices || []);
      setStatistics(data.statistics || {});
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
      // For development, use mock data
      setInvoices(generateMockInvoices());
      setFilteredInvoices(generateMockInvoices());
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  // Generate mock data for development
  const generateMockInvoices = (): AdvancedInvoice[] => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `inv-${i + 1}`,
      invoiceNumber: `INV-2025-${String(i + 1).padStart(4, '0')}`,
      customerName: `Customer ${i + 1}`,
      customerGSTIN: i % 3 === 0 ? `22AAAAA0000A1Z${i}` : undefined,
      amount: Math.floor(Math.random() * 100000) + 10000,
      gstAmount: Math.floor(Math.random() * 18000) + 1800,
      totalAmount: Math.floor(Math.random() * 118000) + 11800,
      status: (['draft', 'pending', 'paid', 'overdue', 'cancelled'] as const)[Math.floor(Math.random() * 5)],
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['urgent', 'regular', 'vip'].slice(0, Math.floor(Math.random() * 3) + 1),
      priority: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
      paymentTerms: ['Net 30', 'Net 15', 'Due on Receipt'][Math.floor(Math.random() * 3)]
    }));
  };

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      id: 'mark-paid',
      label: 'Mark as Paid',
      icon: CheckCircle,
      action: handleBulkMarkPaid,
      confirmMessage: 'Are you sure you want to mark selected invoices as paid?'
    },
    {
      id: 'send-reminder',
      label: 'Send Reminder',
      icon: RefreshCw,
      action: handleBulkSendReminder
    },
    {
      id: 'export-selected',
      label: 'Export Selected',
      icon: Download,
      action: handleBulkExport
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: Trash2,
      action: handleBulkDelete,
      confirmMessage: 'Are you sure you want to delete selected invoices? This action cannot be undone.'
    }
  ];

  // Bulk action handlers
  async function handleBulkMarkPaid(invoiceIds: string[]) {
    try {
      const response = await fetch('/api/v1/finance/enhanced-invoices/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          operation: 'mark_paid',
          entityIds: invoiceIds,
          metadata: { paymentDate: new Date().toISOString() }
        })
      });

      if (response.ok) {
        await loadInvoices();
        setSelectedInvoices([]);
      }
    } catch (error) {
      console.error('Bulk mark paid failed:', error);
    }
  }

  async function handleBulkSendReminder(invoiceIds: string[]) {
    try {
      const response = await fetch('/api/v1/finance/enhanced-invoices/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          operation: 'send_reminder',
          entityIds: invoiceIds
        })
      });

      if (response.ok) {
        alert('Reminders sent successfully!');
      }
    } catch (error) {
      console.error('Bulk send reminder failed:', error);
    }
  }

  async function handleBulkExport(invoiceIds: string[]) {
    try {
      const response = await fetch('/api/v1/finance/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          exportType: 'invoices',
          format: 'excel',
          filters: { invoiceIds },
          includeDetails: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Export job created: ${data.jobId}`);
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
    }
  }

  async function handleBulkDelete(invoiceIds: string[]) {
    try {
      const response = await fetch('/api/v1/finance/enhanced-invoices/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          operation: 'delete',
          entityIds: invoiceIds
        })
      });

      if (response.ok) {
        await loadInvoices();
        setSelectedInvoices([]);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  }

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: AdvancedInvoice['status'] }> = ({ status }) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge: React.FC<{ priority: AdvancedInvoice['priority'] }> = ({ priority }) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Advanced Invoice Management</h2>
        <p className="text-gray-600">Enhanced invoice operations with bulk actions, advanced search, and analytics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Amount</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.pendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Overdue Amount</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.overdueAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices by number, customer, or amount..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Advanced Filters
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {/* Handle new invoice */}}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FilePlus className="w-5 h-5" />
              New Invoice
            </button>

            <button
              onClick={() => {/* Handle export all */}}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export All
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={filters.dateRange.from}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value }
                  }))}
                />
                <input
                  type="date"
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  value={filters.dateRange.to}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedInvoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedInvoices.length} invoice(s) selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.confirmMessage) {
                        if (confirm(action.confirmMessage)) {
                          action.action(selectedInvoices);
                        }
                      } else {
                        action.action(selectedInvoices);
                      }
                    }}
                    className="px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2 text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedInvoices.length === filteredInvoices.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelectInvoice(invoice.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedInvoices.includes(invoice.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-500">{invoice.createdDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                      {invoice.customerGSTIN && (
                        <div className="text-sm text-gray-500">{invoice.customerGSTIN}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatAmount(invoice.totalAmount)}</div>
                      <div className="text-sm text-gray-500">GST: {formatAmount(invoice.gstAmount)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={invoice.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * itemsPerPage >= filteredInvoices.length}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInvoiceManagement;
