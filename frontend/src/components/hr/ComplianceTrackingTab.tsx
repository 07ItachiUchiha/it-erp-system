import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { complianceTrackingService } from '../../services/hrService';

interface ComplianceTracking {
  id: string;
  complianceType: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  assignedTo?: string;
  assignedUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  completedDate?: string;
  notes?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

interface CreateComplianceTrackingData {
  complianceType: string;
  description: string;
  dueDate: string;
  assignedTo?: string;
  notes?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const ComplianceTrackingTab: React.FC = () => {
  const { user } = useAuth();
  const [complianceItems, setComplianceItems] = useState<ComplianceTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceTracking | null>(null);
  const [newCompliance, setNewCompliance] = useState<CreateComplianceTrackingData>({
    complianceType: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    notes: '',
    priority: 'MEDIUM',
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');

  useEffect(() => {
    fetchComplianceItems();
  }, []);

  const fetchComplianceItems = async () => {
    try {
      setLoading(true);
      const response = await complianceTrackingService.getAll({});
      setComplianceItems(response.data || []);
    } catch (error) {
      console.error('Error fetching compliance items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await complianceTrackingService.create(newCompliance);
      setIsCreateModalOpen(false);
      setNewCompliance({
        complianceType: '',
        description: '',
        dueDate: '',
        assignedTo: '',
        notes: '',
        priority: 'MEDIUM',
      });
      fetchComplianceItems();
    } catch (error) {
      console.error('Error creating compliance item:', error);
    }
  };

  const handleCompleteCompliance = async (id: string) => {
    try {
      await complianceTrackingService.update(id, { 
        status: 'COMPLETED', 
        completedDate: new Date().toISOString() 
      });
      fetchComplianceItems();
    } catch (error) {
      console.error('Error completing compliance item:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'COMPLETED') return false;
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  const filteredItems = Array.isArray(complianceItems) ? complianceItems.filter(item => {
    switch (filter) {
      case 'pending':
        return item.status === 'PENDING' || item.status === 'IN_PROGRESS';
      case 'overdue':
        return isOverdue(item.dueDate, item.status);
      case 'completed':
        return item.status === 'COMPLETED';
      default:
        return true;
    }
  }) : [];

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
        <h2 className="text-xl font-semibold text-gray-900">Compliance Tracking</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
               Add Compliance Item
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{complianceItems.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {complianceItems.filter(item => item.status === 'PENDING' || item.status === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">
            {complianceItems.filter(item => isOverdue(item.dueDate, item.status)).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {complianceItems.filter(item => item.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Compliance List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-8 text-center">
              <p className="text-gray-500">No compliance items found for the selected filter.</p>
            </div>
          </div>
        ) : (
          filteredItems.map((compliance) => (
            <div 
              key={compliance.id} 
              className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                isOverdue(compliance.dueDate, compliance.status) ? 'border-red-500' :
                isDueSoon(compliance.dueDate) ? 'border-yellow-500' :
                compliance.status === 'COMPLETED' ? 'border-green-500' : 'border-blue-500'
              }`}
            >
              <div 
                className="p-6"
                onClick={() => {
                  setSelectedCompliance(compliance);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{compliance.complianceType}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        isOverdue(compliance.dueDate, compliance.status) ? 'OVERDUE' : compliance.status
                      )}`}>
                        {isOverdue(compliance.dueDate, compliance.status) ? 'OVERDUE' : compliance.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(compliance.priority)}`}>
                        {compliance.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{compliance.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className={`font-medium ${isOverdue(compliance.dueDate, compliance.status) ? 'text-red-600' : 
                          isDueSoon(compliance.dueDate) ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {new Date(compliance.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Assigned To</p>
                        <p className="font-medium">
                          {compliance.assignedUser 
                            ? `${compliance.assignedUser.firstName} ${compliance.assignedUser.lastName}`
                            : 'Unassigned'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-medium">{new Date(compliance.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {compliance.completedDate && (
                      <p className="text-xs text-green-600 mt-2">
                        Completed: {new Date(compliance.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {compliance.status !== 'COMPLETED' && (user?.role === 'admin' || user?.role === 'hr') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteCompliance(compliance.id);
                        }}
                        className="px-3 py-1 bg-green-600 border border-transparent rounded text-xs font-medium text-white hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Compliance Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Compliance Item</h3>
          <form onSubmit={handleCreateCompliance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Compliance Type</label>
              <input
                type="text"
                value={newCompliance.complianceType}
                onChange={(e) => setNewCompliance({ ...newCompliance, complianceType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="e.g., Annual Safety Training, GDPR Compliance Review"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newCompliance.description}
                onChange={(e) => setNewCompliance({ ...newCompliance, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required
                placeholder="Describe the compliance requirement..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={newCompliance.dueDate}
                  onChange={(e) => setNewCompliance({ ...newCompliance, dueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={newCompliance.priority}
                  onChange={(e) => setNewCompliance({ ...newCompliance, priority: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To (User ID)</label>
              <input
                type="text"
                value={newCompliance.assignedTo}
                onChange={(e) => setNewCompliance({ ...newCompliance, assignedTo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter user ID (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                value={newCompliance.notes}
                onChange={(e) => setNewCompliance({ ...newCompliance, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional notes..."
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
                Add Compliance Item
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Compliance Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
      >
        {selectedCompliance && (
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Compliance Type</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{selectedCompliance.complianceType}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedCompliance.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <p className={`mt-1 text-sm font-medium ${isOverdue(selectedCompliance.dueDate, selectedCompliance.status) ? 'text-red-600' : 
                    isDueSoon(selectedCompliance.dueDate) ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {new Date(selectedCompliance.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(selectedCompliance.priority)}`}>
                    {selectedCompliance.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    isOverdue(selectedCompliance.dueDate, selectedCompliance.status) ? 'OVERDUE' : selectedCompliance.status
                  )}`}>
                    {isOverdue(selectedCompliance.dueDate, selectedCompliance.status) ? 'OVERDUE' : selectedCompliance.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCompliance.assignedUser 
                      ? `${selectedCompliance.assignedUser.firstName} ${selectedCompliance.assignedUser.lastName}`
                      : 'Unassigned'
                    }
                  </p>
                </div>
              </div>

              {selectedCompliance.completedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    {new Date(selectedCompliance.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedCompliance.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedCompliance.notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Created: {new Date(selectedCompliance.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedCompliance.updatedAt).toLocaleString()}</p>
              </div>

              {selectedCompliance.status !== 'COMPLETED' && (user?.role === 'admin' || user?.role === 'hr') && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button 
                    onClick={() => handleCompleteCompliance(selectedCompliance.id)}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
                  >
                    Mark as Completed
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

export default ComplianceTrackingTab;
