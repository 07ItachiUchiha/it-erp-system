import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService, hrEmployeeService } from '../../services/hrService';
import { Employee } from '../../services/employeeService';

interface Attendance {
    id: string;
    employeeId: string;
    employee?: {
        firstName: string;
        lastName: string;
        email: string;
        department: string;
    };
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'SICK_LEAVE' | 'VACATION';
    notes?: string;
    totalHours?: number;
    createdAt: string;
    updatedAt: string;
}

interface CreateAttendanceData {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'SICK_LEAVE' | 'VACATION';
    notes?: string;
}

const AttendanceTab: React.FC = () => {
    const { user } = useAuth();
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    const [newAttendance, setNewAttendance] = useState<CreateAttendanceData>({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOutTime: '',
        status: 'PRESENT',
        notes: '',
    });
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAttendances();
        fetchEmployees();
    }, [filterDate]);

    const fetchEmployees = async () => {
        try {
            const response = await hrEmployeeService.getActiveEmployees();
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchAttendances = async () => {
        try {
            setLoading(true);
            const response = await attendanceService.getAll({ date: filterDate });
            setAttendances(response.data || []);
        } catch (error) {
            console.error('Error fetching attendance records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await attendanceService.create(newAttendance);
            setIsCreateModalOpen(false);
            setNewAttendance({
                employeeId: '',
                date: new Date().toISOString().split('T')[0],
                checkInTime: '',
                checkOutTime: '',
                status: 'PRESENT',
                notes: '',
            });
            fetchAttendances();
        } catch (error) {
            console.error('Error creating attendance record:', error);
        }
    };

    const handleCheckOut = async (id: string) => {
        try {
            const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            await attendanceService.update(id, { checkOutTime: currentTime });
            fetchAttendances();
        } catch (error) {
            console.error('Error checking out:', error);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'PRESENT':
                return 'bg-green-100 text-green-800';
            case 'ABSENT':
                return 'bg-red-100 text-red-800';
            case 'HALF_DAY':
                return 'bg-yellow-100 text-yellow-800';
            case 'SICK_LEAVE':
                return 'bg-purple-100 text-purple-800';
            case 'VACATION':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const calculateHours = (checkIn?: string, checkOut?: string) => {
        if (!checkIn || !checkOut) return null;
        
        const checkInTime = new Date(`1970-01-01T${checkIn}`);
        const checkOutTime = new Date(`1970-01-01T${checkOut}`);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        
        return hours > 0 ? hours.toFixed(2) : null;
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '-';
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
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
                <h2 className="text-xl font-semibold text-gray-900">Attendance Management</h2>
                <div className="flex items-center space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Filter by Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Mark Attendance
                        </button>
                    )}
                </div>
            </div>

            {/* Attendance List */}
            <div className="grid gap-4">
                {attendances.length === 0 ? (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No attendance records found for {new Date(filterDate).toLocaleDateString()}.</p>
                        </div>
                    </div>
                ) : (
                    attendances.map((attendance) => (
                        <div key={attendance.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                            <div 
                                className="p-6"
                                onClick={() => {
                                    setSelectedAttendance(attendance);
                                    setIsDetailModalOpen(true);
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {attendance.employee 
                                                    ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                                                    : 'Unknown Employee'
                                                }
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(attendance.status)}`}>
                                                {attendance.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Date</p>
                                                <p className="font-medium">{new Date(attendance.date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Check In</p>
                                                <p className="font-medium">{formatTime(attendance.checkInTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Check Out</p>
                                                <p className="font-medium">{formatTime(attendance.checkOutTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Total Hours</p>
                                                <p className="font-medium">
                                                    {attendance.totalHours || calculateHours(attendance.checkInTime, attendance.checkOutTime) || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        {attendance.employee?.department && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Department: {attendance.employee.department}
                                            </p>
                                        )}
                                        {attendance.notes && (
                                            <p className="text-xs text-gray-600 mt-1 italic">
                                                Note: {attendance.notes}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {attendance.status === 'PRESENT' && attendance.checkInTime && !attendance.checkOutTime && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCheckOut(attendance.id);
                                                }}
                                                className="px-3 py-1 bg-red-600 border border-transparent rounded text-xs font-medium text-white hover:bg-red-700"
                                            >
                                                Check Out
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Attendance Modal */}
            <Modal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
            >
                <div className="px-6 py-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Attendance</h3>
                    <form onSubmit={handleCreateAttendance} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Employee</label>
                            <select
                                value={newAttendance.employeeId}
                                onChange={(e) => setNewAttendance({ ...newAttendance, employeeId: e.target.value })}
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
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                value={newAttendance.date}
                                onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={newAttendance.status}
                                onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value as any })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="PRESENT">Present</option>
                                <option value="ABSENT">Absent</option>
                                <option value="HALF_DAY">Half Day</option>
                                <option value="SICK_LEAVE">Sick Leave</option>
                                <option value="VACATION">Vacation</option>
                            </select>
                        </div>

                        {newAttendance.status === 'PRESENT' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Check In Time</label>
                                    <input
                                        type="time"
                                        value={newAttendance.checkInTime}
                                        onChange={(e) => setNewAttendance({ ...newAttendance, checkInTime: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Check Out Time</label>
                                    <input
                                        type="time"
                                        value={newAttendance.checkOutTime}
                                        onChange={(e) => setNewAttendance({ ...newAttendance, checkOutTime: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                                value={newAttendance.notes}
                                onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                rows={3}
                                placeholder="Add any notes about this attendance record..."
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
                                Mark Attendance
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Attendance Detail Modal */}
            <Modal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)}
            >
                {selectedAttendance && (
                    <div className="px-6 py-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedAttendance.employee 
                                            ? `${selectedAttendance.employee.firstName} ${selectedAttendance.employee.lastName}`
                                            : 'Unknown Employee'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedAttendance.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedAttendance.status)}`}>
                                        {selectedAttendance.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {selectedAttendance.employee?.department && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Department</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedAttendance.employee.department}</p>
                                    </div>
                                )}
                            </div>

                            {selectedAttendance.status === 'PRESENT' && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Time Details</h4>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Check In</label>
                                            <p className="mt-1">{formatTime(selectedAttendance.checkInTime)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Check Out</label>
                                            <p className="mt-1">{formatTime(selectedAttendance.checkOutTime)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Total Hours</label>
                                            <p className="mt-1 font-medium">
                                                {selectedAttendance.totalHours || calculateHours(selectedAttendance.checkInTime, selectedAttendance.checkOutTime) || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedAttendance.notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                                        {selectedAttendance.notes}
                                    </p>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 pt-2 border-t">
                                <p>Created: {new Date(selectedAttendance.createdAt).toLocaleString()}</p>
                                <p>Updated: {new Date(selectedAttendance.updatedAt).toLocaleString()}</p>
                            </div>

                            {selectedAttendance.status === 'PRESENT' && selectedAttendance.checkInTime && !selectedAttendance.checkOutTime && (user?.role === 'admin' || user?.role === 'hr') && (
                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button 
                                        onClick={() => handleCheckOut(selectedAttendance.id)}
                                        className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                                    >
                                        Check Out Now
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

export default AttendanceTab;
