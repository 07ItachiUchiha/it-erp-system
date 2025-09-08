import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleBasedComponent from '../components/auth/RoleBasedComponent';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { procurementService, ProcurementRequest, ProcurementStats } from '../services/procurementService';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface SearchFilters {
  search: string;
  status: string;
  category: string;
  priority: string;
  department: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

const ProcurementPage: React.FC = () => {
  return (
    <ProtectedRoute resource="procurement" action="read">
      <Layout>
        <ProcurementContent />
      </Layout>
    </ProtectedRoute>
  );
};

const ProcurementContent: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<{
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    estimatedAmount?: string;
    vendor?: string;
    vendorContact?: string;
    requiredBy?: string;
    department?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    category: '',
    priority: '',
    department: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'other' as ProcurementRequest['category'],
    priority: 'medium' as ProcurementRequest['priority'],
    estimatedAmount: '',
    vendor: '',
    vendorContact: '',
    requiredBy: '',
    department: '',
  });

  // API Functions using real backend service
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await procurementService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching procurement stats:', err);
      setStats(null);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all requests from backend
      const allRequests = await procurementService.getAllRequests();
      let filteredData = [...allRequests];

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = filteredData.filter(request => 
          request.title.toLowerCase().includes(searchTerm) ||
          request.description.toLowerCase().includes(searchTerm) ||
          request.requestId.toLowerCase().includes(searchTerm) ||
          request.department.toLowerCase().includes(searchTerm) ||
          request.vendor?.toLowerCase().includes(searchTerm) ||
          request.requester.firstName.toLowerCase().includes(searchTerm) ||
          request.requester.lastName.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.status) {
        filteredData = filteredData.filter(request => request.status === filters.status);
      }

      if (filters.category) {
        filteredData = filteredData.filter(request => request.category === filters.category);
      }

      if (filters.priority) {
        filteredData = filteredData.filter(request => request.priority === filters.priority);
      }

      if (filters.department) {
        filteredData = filteredData.filter(request => request.department === filters.department);
      }

      // Apply role-based filtering
      if (user?.role === 'employee') {
        // Employees can only see their own requests
        filteredData = filteredData.filter(request => 
          request.requester.email === user.email
        );
      } else if (user?.role === 'manager') {
        // Managers can see requests from their department
        filteredData = filteredData.filter(request => 
          request.department === user.department || request.requester.email === user.email
        );
      }
      // Admin, HR, and Finance roles can see all requests (no additional filtering)

      // Apply sorting
      filteredData.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof ProcurementRequest];
        const bValue = b[filters.sortBy as keyof ProcurementRequest];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filters.sortOrder === 'ASC' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });

      setRequests(filteredData);
      setPagination({
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / filters.limit),
        currentPage: filters.page,
      });

      // Also fetch stats
      await fetchStats();
    } catch (err) {
      setError('Failed to fetch procurement requests');
      console.error('Error fetching requests:', err);
      // Fallback to empty state
      setRequests([]);
      setPagination({
        total: 0,
        totalPages: 0,
        currentPage: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, user, fetchStats]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requestData: ProcurementRequest = {
        requestId: `PR-${Date.now()}`,
        ...newRequest,
        estimatedAmount: parseFloat(newRequest.estimatedAmount) || 0,
        status: 'draft',
        requester: {
          firstName: user?.firstName || 'Current',
          lastName: user?.lastName || 'User',
          email: user?.email || 'current.user@company.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdRequest = await procurementService.createRequest(requestData);
      
      // Refresh the requests list
      await fetchRequests();
      
      setShowCreateForm(false);
      setNewRequest({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        estimatedAmount: '',
        vendor: '',
        vendorContact: '',
        requiredBy: '',
        department: '',
      });
    } catch (err) {
      setError('Failed to create request');
      console.error('Error creating request:', err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await procurementService.approveRequest(id);
      await fetchRequests(); // Refresh the list
    } catch (err) {
      setError('Failed to approve request');
      console.error('Error approving request:', err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await procurementService.rejectRequest(id);
        await fetchRequests(); // Refresh the list
      } catch (err) {
        setError('Failed to reject request');
        console.error('Error rejecting request:', err);
      }
    }
  };

  const handleEditRequest = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setEditingRequest({
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      estimatedAmount: request.estimatedAmount.toString(),
      vendor: request.vendor,
      vendorContact: request.vendorContact,
      requiredBy: request.requiredBy,
      department: request.department,
    });
    setShowEditForm(true);
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedRequest: ProcurementRequest = {
        ...selectedRequest,
        title: editingRequest.title || selectedRequest.title,
        description: editingRequest.description || selectedRequest.description,
        category: (editingRequest.category as ProcurementRequest['category']) || selectedRequest.category,
        priority: (editingRequest.priority as ProcurementRequest['priority']) || selectedRequest.priority,
        estimatedAmount: parseFloat(editingRequest.estimatedAmount || '0') || selectedRequest.estimatedAmount,
        vendor: editingRequest.vendor || selectedRequest.vendor,
        vendorContact: editingRequest.vendorContact || selectedRequest.vendorContact,
        requiredBy: editingRequest.requiredBy || selectedRequest.requiredBy,
        department: editingRequest.department || selectedRequest.department,
        updatedAt: new Date().toISOString(),
      };

      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id ? updatedRequest : req
      ));
      
      setShowEditForm(false);
      setSelectedRequest(null);
      setEditingRequest({});
    } catch (err) {
      setError('Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        setLoading(true);
        await procurementService.deleteRequest(id);
        await fetchRequests(); // Refresh the list
      } catch (err) {
        setError('Failed to delete request');
        console.error('Error deleting request:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'number' ? value : parseInt(value) || 1),
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'it_equipment': return 'bg-blue-100 text-blue-800';
      case 'software_licenses': return 'bg-indigo-100 text-indigo-800';
      case 'office_supplies': return 'bg-green-100 text-green-800';
      case 'furniture': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      case 'travel': return 'bg-cyan-100 text-cyan-800';
      case 'training': return 'bg-amber-100 text-amber-800';
      case 'services': return 'bg-teal-100 text-teal-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Procurement Management</h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'employee' 
                  ? 'Create and manage your procurement requests' 
                  : user?.role === 'manager'
                  ? 'Manage procurement requests for your department'
                  : user?.role === 'finance'
                  ? 'Review and approve procurement requests for financial approval'
                  : 'Manage all procurement requests, approvals, and vendor relationships'
                }
              </p>
            </div>
            <RoleBasedComponent requiredResource="procurement" requiredAction="create">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                New Request
              </button>
            </RoleBasedComponent>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-900">{requests.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-900">{requests.filter(r => r.status === 'pending_approval').length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{requests.filter(r => r.status === 'approved').length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Budget</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatAmount(requests.reduce((sum, req) => sum + req.estimatedAmount, 0))}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, description, vendor, request ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="it_equipment">IT Equipment</option>
                  <option value="software_licenses">Software Licenses</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="furniture">Furniture</option>
                  <option value="marketing">Marketing</option>
                  <option value="travel">Travel</option>
                  <option value="training">Training</option>
                  <option value="services">Services</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <input
                  type="text"
                  placeholder="Department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                        <div className="text-sm text-gray-500">{request.requestId}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(request.category)}`}>
                        {request.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatAmount(request.estimatedAmount)}
                      {request.actualAmount && (
                        <div className="text-xs text-gray-500">
                          Actual: {formatAmount(request.actualAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.requester.firstName} {request.requester.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{request.department}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewRequest(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Request"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <RoleBasedComponent requiredResource="procurement" requiredAction="approve">
                          {request.status === 'pending_approval' && (
                            <>
                              <button 
                                onClick={() => request.id && handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve Request"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => request.id && handleReject(request.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject Request"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </RoleBasedComponent>
                        
                        {request.status === 'draft' && (
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Submit Request"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <RoleBasedComponent requiredResource="procurement" requiredAction="update">
                          <button 
                            onClick={() => handleEditRequest(request)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Request"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </RoleBasedComponent>
                        
                        <RoleBasedComponent requiredResource="procurement" requiredAction="delete">
                          <button 
                            onClick={() => request.id && handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Request"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </RoleBasedComponent>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Request Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">New Procurement Request</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Title *</label>
                      <input
                        type="text"
                        required
                        value={newRequest.title}
                        onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={newRequest.category}
                        onChange={(e) => setNewRequest({...newRequest, category: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="other">Other</option>
                        <option value="it_equipment">IT Equipment</option>
                        <option value="software_licenses">Software Licenses</option>
                        <option value="office_supplies">Office Supplies</option>
                        <option value="furniture">Furniture</option>
                        <option value="marketing">Marketing</option>
                        <option value="travel">Travel</option>
                        <option value="training">Training</option>
                        <option value="services">Services</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={newRequest.priority}
                        onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Amount (INR) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={newRequest.estimatedAmount}
                        onChange={(e) => setNewRequest({...newRequest, estimatedAmount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department *</label>
                      <input
                        type="text"
                        required
                        value={newRequest.department}
                        onChange={(e) => setNewRequest({...newRequest, department: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor</label>
                      <input
                        type="text"
                        value={newRequest.vendor}
                        onChange={(e) => setNewRequest({...newRequest, vendor: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor Contact</label>
                      <input
                        type="text"
                        value={newRequest.vendorContact}
                        onChange={(e) => setNewRequest({...newRequest, vendorContact: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Required By</label>
                      <input
                        type="date"
                        value={newRequest.requiredBy}
                        onChange={(e) => setNewRequest({...newRequest, requiredBy: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Create Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Request Modal */}
        {showEditForm && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Procurement Request</h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleUpdateRequest} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Title
                      </label>
                      <input
                        type="text"
                        value={editingRequest.title || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={editingRequest.category || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="office_supplies">Office Supplies</option>
                        <option value="it_equipment">IT Equipment</option>
                        <option value="software_licenses">Software Licenses</option>
                        <option value="furniture">Furniture</option>
                        <option value="marketing">Marketing</option>
                        <option value="travel">Travel</option>
                        <option value="training">Training</option>
                        <option value="services">Services</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={editingRequest.priority || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={editingRequest.estimatedAmount || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, estimatedAmount: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor
                      </label>
                      <input
                        type="text"
                        value={editingRequest.vendor || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, vendor: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Contact
                      </label>
                      <input
                        type="text"
                        value={editingRequest.vendorContact || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, vendorContact: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required By Date
                      </label>
                      <input
                        type="date"
                        value={editingRequest.requiredBy || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, requiredBy: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editingRequest.department || ''}
                        onChange={(e) => setEditingRequest(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingRequest.description || ''}
                      onChange={(e) => setEditingRequest(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Request Modal */}
        {showViewModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request ID</label>
                      <p className="text-sm text-gray-900">{selectedRequest.requestId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <p className="text-sm text-gray-900">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(selectedRequest.category)}`}>
                        {selectedRequest.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
                      <p className="text-sm text-gray-900 font-semibold">{formatAmount(selectedRequest.estimatedAmount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                      <p className="text-sm text-gray-900">{selectedRequest.vendor || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
                      <p className="text-sm text-gray-900">{selectedRequest.vendorContact || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                      <p className="text-sm text-gray-900">{selectedRequest.requiredBy ? new Date(selectedRequest.requiredBy).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <p className="text-sm text-gray-900">{selectedRequest.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.requester.firstName} {selectedRequest.requester.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{selectedRequest.requester.email}</p>
                    </div>
                    {selectedRequest.approver && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Approver</label>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.approver.firstName} {selectedRequest.approver.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedRequest.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                      <p className="text-sm text-gray-900">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-sm text-gray-900">{selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ProcurementPage;
