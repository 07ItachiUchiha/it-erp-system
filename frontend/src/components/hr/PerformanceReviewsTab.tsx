import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { performanceReviewService, hrEmployeeService } from '../../services/hrService';
import { Employee } from '../../services/employeeService';

interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  reviewerId: string;
  reviewer?: {
    firstName: string;
    lastName: string;
  };
  reviewPeriod: string;
  goals: string;
  achievements: string;
  areasForImprovement: string;
  overallRating: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePerformanceReviewData {
  employeeId: string;
  reviewerId: string;
  reviewPeriod: string;
  goals: string;
  achievements: string;
  areasForImprovement: string;
  overallRating: number;
}

const PerformanceReviewsTab: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [newReview, setNewReview] = useState<CreatePerformanceReviewData>({
    employeeId: '',
    reviewerId: '',
    reviewPeriod: '',
    goals: '',
    achievements: '',
    areasForImprovement: '',
    overallRating: 1,
  });

  useEffect(() => {
    fetchReviews();
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

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await performanceReviewService.getAll({});
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceReviewService.create(newReview);
      setIsCreateModalOpen(false);
      setNewReview({
        employeeId: '',
        reviewerId: '',
        reviewPeriod: '',
        goals: '',
        achievements: '',
        areasForImprovement: '',
        overallRating: 1,
      });
      fetchReviews();
    } catch (error) {
      console.error('Error creating performance review:', error);
    }
  };

  const handleCompleteReview = async (id: string) => {
    try {
      await performanceReviewService.update(id, { status: 'COMPLETED', reviewDate: new Date().toISOString() });
      fetchReviews();
    } catch (error) {
      console.error('Error completing performance review:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    if (rating >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-sm ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
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
        <h2 className="text-xl font-semibold text-gray-900">Performance Reviews</h2>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Review
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-8 text-center">
              <p className="text-gray-500">No performance reviews found.</p>
            </div>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="p-6"
                onClick={() => {
                  setSelectedReview(review);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {review.employee 
                          ? `${review.employee.firstName} ${review.employee.lastName}`
                          : 'Unknown Employee'
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(review.status)}`}>
                        {review.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Review Period</p>
                        <p className="font-medium">{review.reviewPeriod}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reviewer</p>
                        <p className="font-medium">
                          {review.reviewer 
                            ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                            : 'Unknown Reviewer'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Overall Rating</p>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.overallRating)}
                          <span className={`font-medium ${getRatingColor(review.overallRating)}`}>
                            {review.overallRating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.employee?.department && (
                      <p className="text-xs text-gray-500 mt-2">
                        Department: {review.employee.department}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {review.reviewDate && (
                      <p className="text-xs text-gray-500">
                        Completed: {new Date(review.reviewDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Review Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Performance Review</h3>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700">Reviewer</label>
                <select
                  value={newReview.reviewerId}
                  onChange={(e) => setNewReview({ ...newReview, reviewerId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Reviewer</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.empId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Review Period</label>
              <input
                type="text"
                value={newReview.reviewPeriod}
                onChange={(e) => setNewReview({ ...newReview, reviewPeriod: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="e.g., Q1 2024, Annual 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Goals</label>
              <textarea
                value={newReview.goals}
                onChange={(e) => setNewReview({ ...newReview, goals: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required
                placeholder="Describe performance goals..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Achievements</label>
              <textarea
                value={newReview.achievements}
                onChange={(e) => setNewReview({ ...newReview, achievements: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required
                placeholder="Describe key achievements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
              <textarea
                value={newReview.areasForImprovement}
                onChange={(e) => setNewReview({ ...newReview, areasForImprovement: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required
                placeholder="Describe areas that need improvement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Overall Rating (1-5)</label>
              <select
                value={newReview.overallRating}
                onChange={(e) => setNewReview({ ...newReview, overallRating: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value={1}>1 - Poor</option>
                <option value={2}>2 - Below Average</option>
                <option value={3}>3 - Average</option>
                <option value={4}>4 - Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
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
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Review Details</h3>
            <div className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700">Reviewer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedReview.reviewer 
                      ? `${selectedReview.reviewer.firstName} ${selectedReview.reviewer.lastName}`
                      : 'Unknown Reviewer'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReview.reviewPeriod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedReview.status)}`}>
                    {selectedReview.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
                <div className="flex items-center space-x-2 mt-1">
                  {renderStars(selectedReview.overallRating)}
                  <span className={`font-medium ${getRatingColor(selectedReview.overallRating)}`}>
                    {selectedReview.overallRating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Goals</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedReview.goals}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Achievements</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedReview.achievements}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedReview.areasForImprovement}
                </p>
              </div>

              {selectedReview.reviewDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedReview.reviewDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedReview.status !== 'COMPLETED' && (user?.role === 'admin' || user?.role === 'hr') && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button 
                    onClick={() => handleCompleteReview(selectedReview.id)}
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

export default PerformanceReviewsTab;
