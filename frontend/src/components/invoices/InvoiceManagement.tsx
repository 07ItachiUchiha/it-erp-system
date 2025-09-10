import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Plus, Calendar, Filter, Search } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { financeService, Invoice } from '../../services/financeService';
import EnhancedInvoiceForm from '../finance/EnhancedInvoiceForm';

interface FilterOptions {
  status: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

const InvoiceManagement: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'overdue', label: 'Overdue', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.dueDate) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.dueDate) <= new Date(filters.dateTo)
      );
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.billToName?.toLowerCase().includes(query) ||
        invoice.notes?.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleSubmit = async (invoiceData: Omit<Invoice, 'id'>) => {
    try {
      setError(null);
      
      if (editingInvoice) {
        const updated = await financeService.updateInvoice(editingInvoice.id!, invoiceData);
        setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv));
      } else {
        const newInvoice = await financeService.createInvoice(invoiceData);
        setInvoices([...invoices, newInvoice]);
      }
      
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setError(null);
        await financeService.deleteInvoice(id.toString());
        setInvoices(invoices.filter(inv => inv.id !== id.toString()));
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setError('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      setError(null);
      
      if (filteredInvoices.length === 0) {
        setError('No invoices to export.');
        return;
      }

      // Prepare filters for export based on current filter state
      const exportFilters = {
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined,
        status: filters.status || undefined,
        customerName: filters.searchQuery || undefined,
      };

      const blob = await financeService.exportInvoicesToExcel(exportFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting invoices:', error);
      setError('Failed to export invoices. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: ''
    });
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Invoice Management</h2>
          <p className="text-gray-600">Create, manage, and export invoices with GST calculation</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={exporting || filteredInvoices.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </>
            )}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search invoices..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Invoice Form */}
      <EnhancedInvoiceForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleSubmit}
        invoice={editingInvoice}
      />

      {/* Invoices List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Invoices ({filteredInvoices.length} of {invoices.length})
          </h3>
          <div className="text-sm text-gray-500">
            {filters.status || filters.searchQuery || filters.dateFrom || filters.dateTo ? 
              'Filtered results' : 'All invoices'}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            {invoices.length === 0 ? (
              <p>No invoices found. Create your first invoice to get started.</p>
            ) : (
              <p>No invoices match the current filters. Try adjusting your search criteria.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {invoice.generatedInvoiceNumber || invoice.invoiceNumber || 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.clientName}
                        </div>
                        {invoice.clientEmail && (
                          <div className="text-sm text-gray-500">
                            {invoice.clientEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.billToName || 'Not specified'}
                        </div>
                        {invoice.billToGSTIN && (
                          <div className="text-sm text-gray-500 font-mono">
                            GST: {invoice.billToGSTIN}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.subtotal || invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.gstBreakup ? (
                        <div className="text-sm">
                          <div className="text-green-600 font-medium">
                            +{formatCurrency(
                              (invoice.gstBreakup.cgst || 0) + 
                              (invoice.gstBreakup.sgst || 0) + 
                              (invoice.gstBreakup.igst || 0) + 
                              (invoice.gstBreakup.utgst || 0)
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {invoice.gstBreakup.igst > 0 ? 'IGST' : 'CGST+SGST'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No Tax</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(invoice.calculatedTotal || invoice.amount)}
                      </div>
                      {invoice.shippingCharges && invoice.shippingCharges > 0 && (
                        <div className="text-xs text-gray-500">
                          +{formatCurrency(invoice.shippingCharges)} shipping
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${getStatusColor(invoice.status) === 'green' ? 'bg-green-100 text-green-800' :
                          getStatusColor(invoice.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          getStatusColor(invoice.status) === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {statusOptions.find(opt => opt.value === invoice.status)?.label || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id!)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default InvoiceManagement;
