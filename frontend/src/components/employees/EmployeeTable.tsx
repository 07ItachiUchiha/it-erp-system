import React, { useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Employee } from '../../services/employeeService';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface EmployeeTableProps {
  employees: Employee[];
  selectedEmployees: string[];
  onEmployeeSelect: (employeeId: string) => void;
  onSelectAll: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  onViewHR?: (employee: Employee) => void;
  loading?: boolean;
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    terminated: 'bg-red-100 text-red-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getEmploymentTypeColor = (type: string) => {
  const colors = {
    full_time: 'bg-blue-100 text-blue-800',
    part_time: 'bg-purple-100 text-purple-800',
    contract: 'bg-orange-100 text-orange-800',
    intern: 'bg-green-100 text-green-800',
    consultant: 'bg-indigo-100 text-indigo-800',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const formatEmploymentType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  selectedEmployees,
  onEmployeeSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  onViewHR,
  loading = false,
}) => {
  const { formatAmount } = useCurrency();
  const [sortField, setSortField] = useState<keyof Employee>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEmployees = Array.isArray(employees) ? [...employees].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const SortIcon = ({ field }: { field: keyof Employee }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
        <p className="text-gray-500">Try adjusting your search criteria or add a new employee.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={Array.isArray(employees) && selectedEmployees.length === employees.length && employees.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('empId')}
              >
                <div className="flex items-center gap-1">
                  Employee ID
                  <SortIcon field="empId" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('firstName')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="firstName" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center gap-1">
                  Department
                  <SortIcon field="department" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('designation')}
              >
                <div className="flex items-center gap-1">
                  Designation
                  <SortIcon field="designation" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('employmentType')}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="employmentType" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('salary')}
              >
                <div className="flex items-center gap-1">
                  Salary
                  <SortIcon field="salary" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedEmployees.includes(employee.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => onEmployeeSelect(employee.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {employee.empId}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        Joined {new Date(employee.joiningDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {employee.department}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{employee.designation}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeColor(employee.employmentType)}`}>
                    {formatEmploymentType(employee.employmentType)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {formatAmount(employee.salary || 0)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <EnvelopeIcon className="w-3 h-3 mr-1 text-gray-400" />
                      {employee.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <PhoneIcon className="w-3 h-3 mr-1 text-gray-400" />
                      {employee.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(employee)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Employee"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {onViewHR && (
                      <button
                        onClick={() => onViewHR(employee)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View HR Summary"
                      >
                        <ChartBarIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(employee)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Employee"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(employee)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Employee"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
