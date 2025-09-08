import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { InvoiceStorageService } from '../../services/localStorageService';
import { exportInvoicesToCSV } from '../../utils/csvExport';
import { FileText, Plus, Search, Edit, Trash2, Download, Filter, Calendar, User, Building, IndianRupee, Mail, Phone, Printer, Eye, Send } from 'lucide-react';

// Print Invoice Component
const PrintInvoice: React.FC<{ invoice: any; onClose: () => void; onPrint: () => void }> = ({ invoice, onClose, onPrint }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .invoice-table th { background-color: #f2f2f2; }
                .totals { float: right; width: 300px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .final-total { font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
    onPrint();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 no-print">
          <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

        <div ref={printRef} className="bg-white p-8">
          {/* Invoice Header */}
          <div className="invoice-header text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <div className="text-lg text-gray-600">
              <p>Your Company Name</p>
              <p>123 Business Street, City, State, ZIP</p>
              <p>Phone: (555) 123-4567 | Email: info@company.com</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="invoice-details grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
              <div className="text-gray-700">
                <p className="font-medium">{invoice.customerName}</p>
                <p>{invoice.company}</p>
                <p>{invoice.customerEmail}</p>
                <p>{invoice.customerPhone}</p>
                {invoice.billingAddress && (
                  <div className="mt-2">
                    <p className="font-medium">Billing Address:</p>
                    <p className="whitespace-pre-line">{invoice.billingAddress}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-right">
                <div className="mb-4">
                  <p className="text-lg font-semibold">Invoice #: {invoice.invoiceNumber}</p>
                  <p className="text-gray-600">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  <p className="text-gray-600">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                {invoice.salesOrderRef && (
                  <p className="text-gray-600">Sales Order: {invoice.salesOrderRef}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-table w-full mb-8">
            <thead>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="total-row">
                <span>Tax:</span>
                <span>₹{invoice.tax.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>-₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Total Amount:</span>
              <span>₹{invoice.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Payment Terms and Notes */}
          <div className="mt-8">
            {invoice.paymentTerms && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900">Payment Terms:</h4>
                <p className="text-gray-700">{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900">Notes:</h4>
                <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceModule: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    invoiceNumber: '',
    salesOrderRef: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    billingAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'draft',
    paymentTerms: '',
    assignedTo: '',
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
  }, [pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    if (newInvoice.invoiceNumber === '') {
      setNewInvoice(prev => ({
        ...prev,
        invoiceNumber: 'INV' + Date.now()
      }));
    }
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = InvoiceStorageService.searchInvoices(searchTerm, statusFilter, pagination.page);
      
      setInvoices(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.meta.total,
        totalPages: result.meta.totalPages
      }));
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    const subtotal = calculateTotals(updatedItems);
    const total = subtotal + newInvoice.tax - newInvoice.discount;
    
    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      const updatedItems = newInvoice.items.filter((_, i) => i !== index);
      const subtotal = calculateTotals(updatedItems);
      const total = subtotal + newInvoice.tax - newInvoice.discount;
      
      setNewInvoice({
        ...newInvoice,
        items: updatedItems,
        subtotal,
        total
      });
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = {
        ...newInvoice,
        id: 'INV' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      InvoiceStorageService.addInvoice(invoiceData);
      loadInvoices();
      setShowCreateModal(false);
      setNewInvoice({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        company: '',
        invoiceNumber: 'INV' + Date.now(),
        salesOrderRef: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        billingAddress: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'draft',
        paymentTerms: '',
        assignedTo: '',
        notes: ''
      });
      alert('Invoice created successfully!');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async () => {
    try {
      setLoading(true);
      if (selectedInvoice) {
        selectedInvoice.updatedAt = new Date().toISOString();
        InvoiceStorageService.updateInvoice(selectedInvoice.id, selectedInvoice);
        loadInvoices();
        setShowEditModal(false);
        setSelectedInvoice(null);
        alert('Invoice updated successfully!');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      setLoading(true);
      InvoiceStorageService.deleteInvoice(invoiceId);
      loadInvoices();
      alert('Invoice deleted successfully!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert('No data to export');
      return;
    }
    exportInvoicesToCSV(invoices);
  };

  const handlePrintInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPrintModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statusOptions = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-orange-600" />
            Invoice Management
          </h2>
          <p className="text-gray-600 mt-1">Create, manage and print invoices</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Invoice
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices by customer, invoice number, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Invoice Records</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">Loading invoices...</div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No invoices found matching your criteria.</div>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search terms or filters, or add a new invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.salesOrderRef && `SO: ${invoice.salesOrderRef}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.company}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {invoice.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                        {invoice.total ? invoice.total.toFixed(2) : '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Invoice</h3>
              
              {/* Customer Information */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={newInvoice.customerEmail}
                    onChange={(e) => setNewInvoice({...newInvoice, customerEmail: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder="Customer Phone"
                    value={newInvoice.customerPhone}
                    onChange={(e) => setNewInvoice({...newInvoice, customerPhone: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={newInvoice.company}
                    onChange={(e) => setNewInvoice({...newInvoice, company: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Invoice Details */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Invoice Number"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Sales Order Reference (Optional)"
                    value={newInvoice.salesOrderRef}
                    onChange={(e) => setNewInvoice({...newInvoice, salesOrderRef: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="date"
                    placeholder="Invoice Date"
                    value={newInvoice.invoiceDate}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="date"
                    placeholder="Due Date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-700">Items</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-orange-600 hover:text-orange-800 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="col-span-5 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                      />
                      <div className="col-span-2 px-2 py-1 text-sm text-gray-700">
                        ₹{item.total.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="col-span-1 text-red-600 hover:text-red-800"
                        disabled={newInvoice.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div></div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{newInvoice.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tax:</span>
                        <input
                          type="number"
                          value={newInvoice.tax}
                          onChange={(e) => {
                            const tax = parseFloat(e.target.value) || 0;
                            const total = newInvoice.subtotal + tax - newInvoice.discount;
                            setNewInvoice({...newInvoice, tax, total});
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Discount:</span>
                        <input
                          type="number"
                          value={newInvoice.discount}
                          onChange={(e) => {
                            const discount = parseFloat(e.target.value) || 0;
                            const total = newInvoice.subtotal + newInvoice.tax - discount;
                            setNewInvoice({...newInvoice, discount, total});
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₹{newInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Additional Information</h4>
                <div className="space-y-4">
                  <textarea
                    placeholder="Billing Address"
                    value={newInvoice.billingAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, billingAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Payment Terms"
                    value={newInvoice.paymentTerms}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentTerms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Assigned To"
                    value={newInvoice.assignedTo}
                    onChange={(e) => setNewInvoice({...newInvoice, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <textarea
                    placeholder="Notes"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar structure but with selectedInvoice */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Invoice</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={selectedInvoice.customerName}
                  onChange={(e) => setSelectedInvoice({...selectedInvoice, customerName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <select
                  value={selectedInvoice.status}
                  onChange={(e) => setSelectedInvoice({...selectedInvoice, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInvoice}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Invoice Modal */}
      {showPrintModal && selectedInvoice && (
        <PrintInvoice
          invoice={selectedInvoice}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedInvoice(null);
          }}
          onPrint={() => {
            setShowPrintModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceModule;
