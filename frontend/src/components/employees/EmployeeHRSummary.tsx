import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Employee } from '../../services/employeeService';
import { 
  leaveRequestService, 
  payrollService, 
  attendanceService, 
  performanceReviewService 
} from '../../services/hrService';

interface EmployeeHRSummaryProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

interface HRSummary {
  totalLeaveRequests: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  totalPayrolls: number;
  latestPayroll?: any;
  totalAttendance: number;
  presentDays: number;
  totalReviews: number;
  averageRating: number;
}

const EmployeeHRSummary: React.FC<EmployeeHRSummaryProps> = ({ employee, isOpen, onClose }) => {
  const [hrSummary, setHrSummary] = useState<HRSummary>({
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    approvedLeaveRequests: 0,
    totalPayrolls: 0,
    totalAttendance: 0,
    presentDays: 0,
    totalReviews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && employee) {
      fetchHRSummary();
    }
  }, [isOpen, employee]);

  const fetchHRSummary = async () => {
    try {
      setLoading(true);
      
      // Fetch leave requests
      const leaveResponse = await leaveRequestService.getAll({ employeeId: employee.id });
      const leaveRequests = leaveResponse.data || [];
      const pendingLeaves = leaveRequests.filter((leave: any) => leave.status === 'PENDING');
      const approvedLeaves = leaveRequests.filter((leave: any) => leave.status === 'APPROVED');

      // Fetch payrolls
      const payrollResponse = await payrollService.getAll({ employeeId: employee.id });
      const payrolls = payrollResponse.data || [];
      const latestPayroll = payrolls[0];

      // Fetch attendance
      const attendanceResponse = await attendanceService.getAll({ employeeId: employee.id });
      const attendanceRecords = attendanceResponse.data || [];
      const presentDays = attendanceRecords.filter((att: any) => att.status === 'PRESENT');

      // Fetch performance reviews
      const reviewResponse = await performanceReviewService.getAll({ employeeId: employee.id });
      const reviews = reviewResponse.data || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.overallRating, 0) / reviews.length 
        : 0;

      setHrSummary({
        totalLeaveRequests: leaveRequests.length,
        pendingLeaveRequests: pendingLeaves.length,
        approvedLeaveRequests: approvedLeaves.length,
        totalPayrolls: payrolls.length,
        latestPayroll,
        totalAttendance: attendanceRecords.length,
        presentDays: presentDays.length,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching HR summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAttendancePercentage = () => {
    if (hrSummary.totalAttendance === 0) return 0;
    return Math.round((hrSummary.presentDays / hrSummary.totalAttendance) * 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            HR Summary - {employee.firstName} {employee.lastName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Employee Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Employee Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Employee ID:</span>
                <span className="ml-2 font-medium">{employee.empId}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium">{employee.department}</span>
              </div>
              <div>
                <span className="text-gray-600">Designation:</span>
                <span className="ml-2 font-medium">{employee.designation}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{employee.status}</span>
              </div>
            </div>
          </div>

          {/* HR Statistics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Leave Requests */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Leave Requests</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total:</span>
                  <span className="font-medium">{hrSummary.totalLeaveRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Pending:</span>
                  <span className="font-medium text-orange-600">{hrSummary.pendingLeaveRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Approved:</span>
                  <span className="font-medium text-green-600">{hrSummary.approvedLeaveRequests}</span>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Attendance</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Records:</span>
                  <span className="font-medium">{hrSummary.totalAttendance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Present Days:</span>
                  <span className="font-medium">{hrSummary.presentDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Attendance Rate:</span>
                  <span className="font-medium">{getAttendancePercentage()}%</span>
                </div>
              </div>
            </div>

            {/* Payroll */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">Payroll</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Total Payrolls:</span>
                  <span className="font-medium">{hrSummary.totalPayrolls}</span>
                </div>
                {hrSummary.latestPayroll && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Latest Period:</span>
                      <span className="font-medium">{hrSummary.latestPayroll.payPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Net Pay:</span>
                      <span className="font-medium">{formatCurrency(hrSummary.latestPayroll.netPay || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-2">Performance</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Total Reviews:</span>
                  <span className="font-medium">{hrSummary.totalReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Average Rating:</span>
                  <span className="font-medium">{hrSummary.averageRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Performance Level:</span>
                  <span className="font-medium">
                    {hrSummary.averageRating >= 4 ? 'Excellent' : 
                     hrSummary.averageRating >= 3 ? 'Good' : 
                     hrSummary.averageRating >= 2 ? 'Average' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Quick Actions</h5>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => window.open(`/hr?tab=leave-requests&employee=${employee.id}`, '_blank')}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                View Leave Requests
              </button>
              <button 
                onClick={() => window.open(`/hr?tab=payroll&employee=${employee.id}`, '_blank')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
              >
                View Payroll
              </button>
              <button 
                onClick={() => window.open(`/hr?tab=attendance&employee=${employee.id}`, '_blank')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                View Attendance
              </button>
              <button 
                onClick={() => window.open(`/hr?tab=performance-reviews&employee=${employee.id}`, '_blank')}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
              >
                View Performance
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </Modal>
  );
};

export default EmployeeHRSummary;
