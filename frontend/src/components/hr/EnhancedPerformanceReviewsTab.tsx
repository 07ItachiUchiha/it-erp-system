import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import AdvancedTable, { Column } from '../common/AdvancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { performanceReviewService } from '../../services/hrService';
import employeeService, { Employee } from '../../services/employeeService';
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '../../services/exportService';

interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewPeriod: string;
  reviewerId: string;
  reviewer?: {
    firstName: string;
    lastName: string;
  };
  goals: string;
  achievements: string;
  areasForImprovement: string;
  overallRating: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePerformanceReviewData {
  employeeId: string;
  reviewPeriod: string;
  goals: string;
  achievements: string;
  areasForImprovement: string;
  overallRating: number;
}

const EnhancedPerformanceReviewsTab: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [newReview, setNewReview] = useState<CreatePerformanceReviewData>({
    employeeId: '',
    reviewPeriod: '',
    goals: '',
    achievements: '',
    areasForImprovement: '',
    overallRating: 3,
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
    fetchReviews();
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

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction
      };
      const response = await performanceReviewService.getAll(params);
      setReviews(response.data || []);
      setPagination(prev => ({ ...prev, total: response.total || response.data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters, sorting, or pagination changes
  useEffect(() => {
    fetchReviews();
  }, [filters, sortConfig, pagination.page, pagination.pageSize]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceReviewService.create(newReview);
      setIsCreateModalOpen(false);
      setNewReview({
        employeeId: '',
        reviewPeriod: '',
        goals: '',
        achievements: '',
        areasForImprovement: '',
        overallRating: 3,
      });
      fetchReviews();
    } catch (error) {
      console.error('Error creating performance review:', error);
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'complete':
          await Promise.all(selectedIds.map(id => 
            performanceReviewService.update(id, { 
              status: 'COMPLETED', 
              completedAt: new Date().toISOString() 
            })
          ));
          break;
        case 'in_progress':
          await Promise.all(selectedIds.map(id => 
            performanceReviewService.update(id, { status: 'IN_PROGRESS' })
          ));
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedIds.length} performance reviews?`)) {
            await Promise.all(selectedIds.map(id => performanceReviewService.delete(id)));
          }
          break;
      }
      fetchReviews();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = formatDataForExport(reviews, format);
    const filename = `performance_reviews_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        exportToCSV(exportData, filename);
        break;
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Performance Reviews Report');
        break;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Define table columns
  const columns: Column<PerformanceReview>[] = [
    {
      key: 'employee',
      header: 'Employee',
      sortable: true,
      filterable: true,
      render: (review) => (
        <div>
          <div className="font-medium text-gray-900">
            {review.employee 
              ? `${review.employee.firstName} ${review.employee.lastName}`
              : 'Unknown Employee'
            }
          </div>
          <div className="text-sm text-gray-500">{review.employee?.email}</div>
        </div>
      )
    },
    {
      key: 'reviewPeriod',
      header: 'Review Period',
      sortable: true,
      filterable: true,
      render: (review) => review.reviewPeriod
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      sortable: true,
      render: (review) => (
        review.reviewer 
          ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
          : 'Not Assigned'
      )
    },
    {
      key: 'overallRating',
      header: 'Rating',
      sortable: true,
      render: (review) => (
        <div className="flex items-center space-x-2">
          <div className="flex">{renderStars(review.overallRating)}</div>
          <span className={`font-medium ${getRatingColor(review.overallRating)}`}>
            {review.overallRating.toFixed(1)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (review) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(review.status)}`}>
          {review.status.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'completedAt',
      header: 'Completed',
      sortable: true,
      render: (review) => review.completedAt ? new Date(review.completedAt).toLocaleDateString() : '-'
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (review) => new Date(review.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (review) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedReview(review);
              setIsDetailModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          {review.status !== 'COMPLETED' && (user?.role === 'admin' || user?.role === 'hr') && (
            <button
              onClick={() => performanceReviewService.update(review.id, { 
                status: 'COMPLETED', 
                completedAt: new Date().toISOString() 
              }).then(fetchReviews)}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Complete
            </button>
          )}
        </div>
      )
    }
  ];

  const bulkActions = [
    { key: 'in_progress', label: 'Mark In Progress', variant: 'primary' as const },
    { key: 'complete', label: 'Mark Completed', variant: 'secondary' as const },
    { key: 'delete', label: 'Delete Selected', variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Performance Reviews</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          ➕ Create Review
        </button>
      </div>

      {/* Advanced Table */}
      <AdvancedTable
        data={reviews}
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
        exportFileName="performance_reviews"
      />

      {/* Create Review Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="px-6 py-4 max-w-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Performance Review</h3>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={newReview.employeeId}
                onChange={(e) => setNewReview({ ...newReview, employeeId: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Review Period</label>
              <input
                type="month"
                value={newReview.reviewPeriod}
                onChange={(e) => setNewReview({ ...newReview, reviewPeriod: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Goals</label>
              <textarea
                value={newReview.goals}
                onChange={(e) => setNewReview({ ...newReview, goals: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter goals for this review period..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Achievements</label>
              <textarea
                value={newReview.achievements}
                onChange={(e) => setNewReview({ ...newReview, achievements: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Describe achievements and accomplishments..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
              <textarea
                value={newReview.areasForImprovement}
                onChange={(e) => setNewReview({ ...newReview, areasForImprovement: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Identify areas where improvement is needed..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Overall Rating (1-5)</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={newReview.overallRating}
                  onChange={(e) => setNewReview({ ...newReview, overallRating: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <div className="flex items-center space-x-2">
                  <div className="flex">{renderStars(newReview.overallRating)}</div>
                  <span className={`font-medium ${getRatingColor(newReview.overallRating)}`}>
                    {newReview.overallRating.toFixed(1)}
                  </span>
                </div>
              </div>
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
                Create Review
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Review Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
      >
        {selectedReview && (
          <div className="px-6 py-4 max-w-3xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Review Details</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedReview.employee 
                      ? `${selectedReview.employee.firstName} ${selectedReview.employee.lastName}`
                      : 'Unknown Employee'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReview.reviewPeriod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedReview.status)}`}>
                    {selectedReview.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">{renderStars(selectedReview.overallRating)}</div>
                    <span className={`font-medium ${getRatingColor(selectedReview.overallRating)}`}>
                      {selectedReview.overallRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Goals</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">{selectedReview.goals}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Achievements</label>
                <div className="mt-1 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-gray-900">{selectedReview.achievements}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
                <div className="mt-1 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-gray-900">{selectedReview.areasForImprovement}</p>
                </div>
              </div>

              {selectedReview.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedReview.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedPerformanceReviewsTab;
