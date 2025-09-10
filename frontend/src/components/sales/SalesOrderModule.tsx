import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SalesOrderStorageService } from '../../services/localStorageService';
import { exportSalesOrdersToCSV } from '../../utils/csvExport';
import { ShoppingCart, Plus, Search, Edit, Trash2, Download, Filter, Calendar, User, Building, IndianRupee, Package, Truck, Clock, Mail, Phone } from 'lucide-react';

const SalesOrderModule: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    processingOrders: 0,
    readyToShipOrders: 0,
    totalValue: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [newSalesOrder, setNewSalesOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    orderNumber: '',
    quotationRef: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    shippingAddress: '',
    billingAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    notes: '',
    paymentTerms: '',
    shippingMethod: ''
  });

  useEffect(() => {
    loadSalesOrders();
    loadStats();
  }, [pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    if (newSalesOrder.orderNumber === '') {
      setNewSalesOrder(prev => ({
        ...prev,
        orderNumber: 'SO' + Date.now()
      }));
    }
  }, []);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const result = SalesOrderStorageService.searchSalesOrders(searchTerm, statusFilter, pagination.page);
      
      setSalesOrders(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.meta.total,
        totalPages: result.meta.totalPages
      }));
    } catch (error) {
      console.error('Error loading sales orders:', error);
      setSalesOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    const allOrders = SalesOrderStorageService.getAllSalesOrders();
    const totalOrders = Array.isArray(allOrders) ? allOrders.length : 0;
    const processingOrders = Array.isArray(allOrders) ? allOrders.filter((order: any) => order.status === 'processing').length : 0;
    const readyToShipOrders = Array.isArray(allOrders) ? allOrders.filter((order: any) => order.status === 'ready-to-ship').length : 0;
    const totalValue = Array.isArray(allOrders) ? allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) : 0;

    setStats({
      totalOrders,
      processingOrders,
      readyToShipOrders,
      totalValue
    });
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newSalesOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    const subtotal = calculateTotals(updatedItems);
    const total = subtotal + newSalesOrder.tax - newSalesOrder.discount;
    
    setNewSalesOrder({
      ...newSalesOrder,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const addItem = () => {
    setNewSalesOrder({
      ...newSalesOrder,
      items: [...newSalesOrder.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (newSalesOrder.items.length > 1) {
      const updatedItems = newSalesOrder.items.filter((_, i) => i !== index);
      const subtotal = calculateTotals(updatedItems);
      const total = subtotal + newSalesOrder.tax - newSalesOrder.discount;
      
      setNewSalesOrder({
        ...newSalesOrder,
        items: updatedItems,
        subtotal,
        total
      });
    }
  };

  const handleCreateSalesOrder = async () => {
    try {
      setLoading(true);
      const salesOrderData = {
        ...newSalesOrder,
        id: 'SO' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      SalesOrderStorageService.addSalesOrder(salesOrderData);
      loadSalesOrders();
      loadStats();
      setShowCreateModal(false);
      setNewSalesOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        company: '',
        orderNumber: 'SO' + Date.now(),
        quotationRef: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        shippingAddress: '',
        billingAddress: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        notes: '',
        paymentTerms: '',
        shippingMethod: ''
      });
      alert('Sales order created successfully!');
    } catch (error) {
      console.error('Error creating sales order:', error);
      alert('Failed to create sales order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalesOrder = async () => {
    try {
      setLoading(true);
      if (selectedSalesOrder) {
        selectedSalesOrder.updatedAt = new Date().toISOString();
        SalesOrderStorageService.updateSalesOrder(selectedSalesOrder.id, selectedSalesOrder);
        loadSalesOrders();
        loadStats();
        setShowEditModal(false);
        setSelectedSalesOrder(null);
        alert('Sales order updated successfully!');
      }
    } catch (error) {
      console.error('Error updating sales order:', error);
      alert('Failed to update sales order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalesOrder = async (salesOrderId: string) => {
    if (!confirm('Are you sure you want to delete this sales order?')) {
      return;
    }

    try {
      setLoading(true);
      SalesOrderStorageService.deleteSalesOrder(salesOrderId);
      loadSalesOrders();
      loadStats();
      alert('Sales order deleted successfully!');
    } catch (error) {
      console.error('Error deleting sales order:', error);
      alert('Failed to delete sales order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (salesOrders.length === 0) {
      alert('No data to export');
      return;
    }
    exportSalesOrdersToCSV(salesOrders);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'ready-to-ship': 'bg-green-100 text-green-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-200 text-green-900',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const statusOptions = ['pending', 'confirmed', 'processing', 'ready-to-ship', 'shipped', 'delivered', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="mr-3 h-6 w-6 text-orange-600" />
            Sales Order Management
          </h2>
          <p className="text-gray-600 mt-1">Manage and track sales orders</p>
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
            Add Sales Order
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.processingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Truck className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ready to Ship</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.readyToShipOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <IndianRupee className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatAmount(stats.totalValue)}</p>
            </div>
          </div>
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
                placeholder="Search orders by customer, order number, or reference..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready-to-ship">Ready to Ship</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sales Order Records</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">Loading sales orders...</div>
          </div>
        ) : salesOrders.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500">No sales orders found matching your criteria.</div>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search terms or filters, or add a new sales order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(salesOrders) ? salesOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.quotationRef && `Ref: ${order.quotationRef}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.company}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {order.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                        {order.total ? order.total.toFixed(2) : '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <br />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSalesOrder(order);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSalesOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : null}
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

      {/* Create Sales Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Sales Order</h3>
              
              {/* Customer Information */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newSalesOrder.customerName}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, customerName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={newSalesOrder.customerEmail}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, customerEmail: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="tel"
                    placeholder="Customer Phone"
                    value={newSalesOrder.customerPhone}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, customerPhone: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={newSalesOrder.company}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, company: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Order Details */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Order Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Order Number"
                    value={newSalesOrder.orderNumber}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, orderNumber: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Quotation Reference (Optional)"
                    value={newSalesOrder.quotationRef}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, quotationRef: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="date"
                    placeholder="Order Date"
                    value={newSalesOrder.orderDate}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, orderDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="date"
                    placeholder="Expected Delivery Date"
                    value={newSalesOrder.expectedDeliveryDate}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, expectedDeliveryDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <select
                    value={newSalesOrder.priority}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, priority: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Shipping Method"
                    value={newSalesOrder.shippingMethod}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, shippingMethod: e.target.value})}
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
                  {newSalesOrder.items.map((item, index) => (
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
                        {formatAmount(item.total)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="col-span-1 text-red-600 hover:text-red-800"
                        disabled={newSalesOrder.items.length === 1}
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
                        <span>{formatAmount(newSalesOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tax:</span>
                        <input
                          type="number"
                          value={newSalesOrder.tax}
                          onChange={(e) => {
                            const tax = parseFloat(e.target.value) || 0;
                            const total = newSalesOrder.subtotal + tax - newSalesOrder.discount;
                            setNewSalesOrder({...newSalesOrder, tax, total});
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Discount:</span>
                        <input
                          type="number"
                          value={newSalesOrder.discount}
                          onChange={(e) => {
                            const discount = parseFloat(e.target.value) || 0;
                            const total = newSalesOrder.subtotal + newSalesOrder.tax - discount;
                            setNewSalesOrder({...newSalesOrder, discount, total});
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatAmount(newSalesOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses and Additional Info */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Additional Information</h4>
                <div className="space-y-4">
                  <textarea
                    placeholder="Shipping Address"
                    value={newSalesOrder.shippingAddress}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, shippingAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={2}
                  />
                  <textarea
                    placeholder="Billing Address"
                    value={newSalesOrder.billingAddress}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, billingAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="Payment Terms"
                    value={newSalesOrder.paymentTerms}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, paymentTerms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Assigned To"
                    value={newSalesOrder.assignedTo}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <textarea
                    placeholder="Notes"
                    value={newSalesOrder.notes}
                    onChange={(e) => setNewSalesOrder({...newSalesOrder, notes: e.target.value})}
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
                  onClick={handleCreateSalesOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Sales Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar structure but with selectedSalesOrder */}
      {showEditModal && selectedSalesOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Sales Order</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={selectedSalesOrder.customerName}
                  onChange={(e) => setSelectedSalesOrder({...selectedSalesOrder, customerName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <select
                  value={selectedSalesOrder.status}
                  onChange={(e) => setSelectedSalesOrder({...selectedSalesOrder, status: e.target.value})}
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
                    setSelectedSalesOrder(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSalesOrder}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Sales Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderModule;
