//do not use emoji in code
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import EnhancedLeaveRequestsTab from './EnhancedLeaveRequestsTab';
import EnhancedPayrollTab from './EnhancedPayrollTab';
import EnhancedPerformanceReviewsTab from './EnhancedPerformanceReviewsTab';
import AttendanceTab from './AttendanceTab';
import ComplianceTrackingTab from './ComplianceTrackingTab';
import { hrEmployeeService, leaveRequestService, payrollService, performanceReviewService } from '../../services/hrService';
import employeeService from '../../services/employeeService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/exportService';
import { useCurrency } from '../../contexts/CurrencyContext';

type TabType = 'leave-requests' | 'payroll' | 'performance-reviews' | 'attendance' | 'compliance';

interface HRStats {
    totalEmployees: number;
    pendingLeaveRequests: number;
    upcomingReviews: number;
    complianceIssues: number;
    activePayrolls: number;
}

const HRDashboard: React.FC = () => {
    const { formatAmount } = useCurrency();
    const [activeTab, setActiveTab] = useState<TabType>('leave-requests');
    const [stats, setStats] = useState<HRStats>({
        totalEmployees: 0,
        pendingLeaveRequests: 0,
        upcomingReviews: 0,
        complianceIssues: 0,
        activePayrolls: 0,
    });

    useEffect(() => {
        fetchHRStats();
    }, []);

    const fetchHRStats = async () => {
        try {
            // Fetch employees count using the proper employee service
            const employeesResponse = await employeeService.getAll();
            const totalEmployees = employeesResponse?.length || 0;

            // Fetch pending leave requests
            const leaveResponse = await leaveRequestService.getAll({ status: 'PENDING' });
            const pendingLeaveRequests = leaveResponse?.data?.length || 0;

            // Fetch active payrolls
            const payrollResponse = await payrollService.getAll({ status: 'PROCESSED' });
            const activePayrolls = payrollResponse?.data?.length || 0;

            setStats({
                totalEmployees,
                pendingLeaveRequests,
                upcomingReviews: 0, // placeholder
                complianceIssues: 0, // placeholder
                activePayrolls,
            });
        } catch (error) {
            console.error('Error fetching HR stats:', error);
        }
    };

    const handleGlobalExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            // Fetch all HR data for export
            const [leaveRequests, payrolls, reviews, employees] = await Promise.all([
                leaveRequestService.getAll({}),
                payrollService.getAll({}),
                performanceReviewService.getAll({}),
                employeeService.getAll()
            ]);

            const filename = `hr_summary_${new Date().toISOString().split('T')[0]}`;

            if (format === 'pdf') {
                // Create summary report for PDF
                const summaryData = [
                    { metric: 'Total Employees', value: employees?.length || 0 },
                    { metric: 'Total Leave Requests', value: leaveRequests?.data?.length || 0 },
                    { metric: 'Pending Leave Requests', value: leaveRequests?.data?.filter((l: any) => l.status === 'PENDING').length || 0 },
                    { metric: 'Total Payroll Records', value: payrolls?.data?.length || 0 },
                    { metric: 'Processed Payrolls', value: payrolls?.data?.filter((p: any) => p.status === 'PROCESSED').length || 0 },
                    { metric: 'Total Performance Reviews', value: reviews?.data?.length || 0 },
                    { metric: 'Completed Reviews', value: reviews?.data?.filter((r: any) => r.status === 'COMPLETED').length || 0 },
                    { 
                        metric: 'Total Payroll Amount', 
                        value: formatAmount(
                            payrolls?.data?.reduce((sum: number, p: any) => sum + (p.netPay || 0), 0) || 0
                        )
                    }
                ];
                exportToPDF(summaryData, filename, 'HR Summary Report');
            } else {
                // Export all data for CSV/Excel
                const allData = [
                    ...((leaveRequests?.data || []).map((item: any) => ({ ...item, type: 'Leave Request' }))),
                    ...((payrolls?.data || []).map((item: any) => ({ ...item, type: 'Payroll' }))),
                    ...((reviews?.data || []).map((item: any) => ({ ...item, type: 'Performance Review' }))),
                ];

                if (format === 'csv') {
                    exportToCSV(allData, filename);
                } else {
                    exportToExcel(allData, filename);
                }
            }
        } catch (error) {
            console.error('Error exporting HR data:', error);
        }
    };

    const tabs = [
        { id: 'leave-requests' as TabType, label: 'Leave Requests' },
        { id: 'payroll' as TabType, label: 'Payroll' },
        { id: 'performance-reviews' as TabType, label: 'Performance Reviews' },
        { id: 'attendance' as TabType, label: 'Attendance' },
        { id: 'compliance' as TabType, label: 'Compliance' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'leave-requests':
                return <EnhancedLeaveRequestsTab />;
            case 'payroll':
                return <EnhancedPayrollTab />;
            case 'performance-reviews':
                return <EnhancedPerformanceReviewsTab />;
            case 'attendance':
                return <AttendanceTab />;
            case 'compliance':
                return <ComplianceTrackingTab />;
            default:
                return <EnhancedLeaveRequestsTab />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Human Resources</h1>
                <div className="flex space-x-2">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                handleGlobalExport(e.target.value as 'csv' | 'excel' | 'pdf');
                                e.target.value = '';
                            }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        defaultValue=""
                    >
                        <option value=""> Generate Report</option>
                        <option value="csv">Export All Data (CSV)</option>
                        <option value="excel">Export All Data (Excel)</option>
                        <option value="pdf">Generate Summary Report (PDF)</option>
                    </select>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                    >
                         Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center space-x-2">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center space-x-2">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.pendingLeaveRequests}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center space-x-2">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Payrolls</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activePayrolls}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center space-x-2">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming Reviews</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.upcomingReviews}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center space-x-2">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Compliance Issues</p>
                                <p className="text-2xl font-bold text-red-600">{stats.complianceIssues}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default HRDashboard;
