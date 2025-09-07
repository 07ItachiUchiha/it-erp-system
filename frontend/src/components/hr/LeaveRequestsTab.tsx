import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import AdvancedTable, { Column } from '../common/AdvancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestService, hrEmployeeService } from '../../services/hrService';
import { Employee } from '../../services/employeeService';
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

const LeaveRequestsTab: React.FC = () => {
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
      const response = await hrEmployeeService.getActiveEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestService.getAll({});
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRejectRequest = async (id: string, comments: string) => {
    try {
      await leaveRequestService.approve(id, { approved: false, comments });
      fetchLeaveRequests();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK':
        return 'bg-red-100 text-red-800';
      case 'PERSONAL':
        return 'bg-purple-100 text-purple-800';
      case 'MATERNITY':
      case 'PATERNITY':
        return 'bg-pink-100 text-pink-800';
      case 'EMERGENCY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      {/* Leave Requests List */}
      <div className="grid gap-4">
        {leaveRequests.length === 0 ? (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-8 text-center">
              <p className="text-gray-500">No leave requests found.</p>
            </div>
          </div>
        ) : (
          leaveRequests.map((request) => (
            <div key={request.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="p-6"
                onClick={() => {
                  setSelectedRequest(request);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {request.employee 
                          ? `${request.employee.firstName} ${request.employee.lastName}`
                          : 'Unknown Employee'
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                        {request.leaveType}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-800">{request.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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

              {selectedRequest.status === 'PENDING' && user?.role === 'admin' && (
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

export default LeaveRequestsTab;
