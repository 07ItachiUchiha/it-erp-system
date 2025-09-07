import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import AdvancedTable, { Column } from '../common/AdvancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestService } from '../../services/hrService';
import employeeService, { Employee } from '../../services/employeeService';
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '../../services/exportService';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  leaveType: 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'EMERGENCY';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverComments?: string;
  approverId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateLeaveRequestData {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const EnhancedLeaveRequestsTab: React.FC = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [newRequest, setNewRequest] = useState<CreateLeaveRequestData>({
    employeeId: '',
    leaveType: 'VACATION',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Advanced table state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0
  });

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction
      };
      const response = await leaveRequestService.getAll(params);
      setLeaveRequests(response.data || []);
      setPagination(prev => ({ ...prev, total: response.total || response.data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters, sorting, or pagination changes
  useEffect(() => {
    fetchLeaveRequests();
  }, [filters, sortConfig, pagination.page, pagination.pageSize]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveRequestService.create(newRequest);
      setIsCreateModalOpen(false);
      setNewRequest({
        employeeId: '',
        leaveType: 'VACATION',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const handleApproveRequest = async (id: string, comments?: string) => {
    try {
      await leaveRequestService.approve(id, { approved: true, comments });
      fetchLeaveRequests();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  const handleRejectRequest = async (id: string, comments?: string) => {
    try {
      await leaveRequestService.approve(id, { approved: false, comments });
      fetchLeaveRequests();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'approve':
          await Promise.all(selectedIds.map(id => leaveRequestService.approve(id, { approved: true })));
          break;
        case 'reject':
          await Promise.all(selectedIds.map(id => leaveRequestService.approve(id, { approved: false })));
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedIds.length} leave requests?`)) {
            await Promise.all(selectedIds.map(id => leaveRequestService.delete(id)));
          }
          break;
      }
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = formatDataForExport(leaveRequests, format);
    const filename = `leave_requests_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        exportToCSV(exportData, filename);
        break;
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Leave Requests Report');
        break;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK':
        return 'bg-red-100 text-red-800';
      case 'PERSONAL':
        return 'bg-green-100 text-green-800';
      case 'MATERNITY':
        return 'bg-pink-100 text-pink-800';
      case 'PATERNITY':
        return 'bg-purple-100 text-purple-800';
      case 'EMERGENCY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define table columns
  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Employee',
      sortable: true,
      filterable: true,
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">
            {request.employee 
              ? `${request.employee.firstName} ${request.employee.lastName}`
              : 'Unknown Employee'
            }
          </div>
          <div className="text-sm text-gray-500">{request.employee?.email}</div>
        </div>
      )
    },
    {
      key: 'leaveType',
      header: 'Leave Type',
      sortable: true,
      filterable: true,
      render: (request) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
          {request.leaveType}
        </span>
      )
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (request) => new Date(request.startDate).toLocaleDateString()
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (request) => new Date(request.endDate).toLocaleDateString()
    },
    {
      key: 'reason',
      header: 'Reason',
      filterable: true,
      render: (request) => (
        <div className="max-w-xs truncate" title={request.reason}>
          {request.reason}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (request) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
          {request.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Requested Date',
      sortable: true,
      render: (request) => new Date(request.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (request) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedRequest(request);
              setIsDetailModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          {request.status === 'PENDING' && (user?.role === 'admin' || user?.role === 'hr') && (
            <>
              <button
                onClick={() => handleApproveRequest(request.id)}
                className="text-green-600 hover:text-green-900 text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => handleRejectRequest(request.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const bulkActions = [
    { key: 'approve', label: 'Approve Selected', variant: 'primary' as const },
    { key: 'reject', label: 'Reject Selected', variant: 'secondary' as const },
    { key: 'delete', label: 'Delete Selected', variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Leave Requests</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          ➕ Request Leave
        </button>
      </div>

      {/* Advanced Table */}
      <AdvancedTable
        data={leaveRequests}
        columns={columns}
        loading={loading}
        onSort={(key, direction) => setSortConfig({ key, direction })}
        onFilter={setFilters}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        bulkActions={bulkActions}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          onPageSizeChange: (pageSize) => setPagination(prev => ({ ...prev, pageSize, page: 1 }))
        }}
        exportFileName="leave_requests"
      />

      {/* Create Leave Request Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            {(user?.role === 'admin' || user?.role === 'hr') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.empId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                value={newRequest.leaveType}
                onChange={(e) => setNewRequest({ ...newRequest, leaveType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="VACATION">Vacation</option>
                <option value="SICK">Sick Leave</option>
                <option value="PERSONAL">Personal</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Leave Request Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
      >
        {selectedRequest && (
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Request Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.employee 
                      ? `${selectedRequest.employee.firstName} ${selectedRequest.employee.lastName}`
                      : 'Unknown Employee'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.employee?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(selectedRequest.leaveType)}`}>
                    {selectedRequest.leaveType}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.approverComments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approver Comments</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.approverComments}</p>
                </div>
              )}

              {selectedRequest.status === 'PENDING' && (user?.role === 'admin' || user?.role === 'hr') && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button 
                    onClick={() => handleRejectRequest(selectedRequest.id, 'Request rejected')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApproveRequest(selectedRequest.id, 'Request approved')}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedLeaveRequestsTab;
