import React, { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
  Employee, 
  CreateEmployeeDto, 
  UpdateEmployeeDto, 
  EmployeeSearchFilters,
  EmployeeStatistics,
  PaginatedEmployees
} from '../../services/employeeService';
import employeeService from '../../services/employeeService';
import EmployeeTable from './EmployeeTable';
import EmployeeForm from './EmployeeForm';
import EmployeeFilters from './EmployeeFilters';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import EmployeeHRSummary from './EmployeeHRSummary';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import BulkActionsModal from '../common/BulkActionsModal';
import { 
  PlusIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const EmployeeManagement: React.FC = () => {
  const { formatAmount } = useCurrency();
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paginatedData, setPaginatedData] = useState<PaginatedEmployees | null>(null);
  const [statistics, setStatistics] = useState<EmployeeStatistics | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [isHRSummaryOpen, setIsHRSummaryOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [employeeForHR, setEmployeeForHR] = useState<Employee | null>(null);

  // Filters and pagination
  const [filters, setFilters] = useState<EmployeeSearchFilters>({
    search: '',
    department: '',
    designation: '',
    status: '',
    employmentType: '',
    page: 1,
    limit: 10,
    sortBy: 'firstName',
    sortOrder: 'ASC',
  });

  // Available options for filters
  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);

  // Fetch employees with current filters
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await employeeService.searchEmployees(filters);
      setPaginatedData(result);
      setEmployees(result.data);
      
      // Extract unique departments and designations for filters
      const uniqueDepartments = Array.from(new Set(result.data.map(emp => emp.department)));
      const uniqueDesignations = Array.from(new Set(result.data.map(emp => emp.designation)));
      setDepartments(uniqueDepartments);
      setDesignations(uniqueDesignations);
      
    } catch (err) {
      setError('Failed to fetch employees. Please try again.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await employeeService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchEmployees();
    fetchStatistics();
  }, [fetchEmployees, fetchStatistics]);

  // Employee CRUD operations
  const handleCreateEmployee = async (data: CreateEmployeeDto) => {
    try {
      await employeeService.create(data);
      await fetchEmployees();
      await fetchStatistics();
      setIsEmployeeFormOpen(false);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };

  const handleUpdateEmployee = async (data: UpdateEmployeeDto) => {
    if (!employeeToEdit) return;
    
    try {
      await employeeService.update(employeeToEdit.id, data);
      await fetchEmployees();
      await fetchStatistics();
      setIsEmployeeFormOpen(false);
      setEmployeeToEdit(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const handleCreateSubmit = async (data: CreateEmployeeDto | UpdateEmployeeDto) => {
    await handleCreateEmployee(data as CreateEmployeeDto);
  };

  const handleUpdateSubmit = async (data: CreateEmployeeDto | UpdateEmployeeDto) => {
    await handleUpdateEmployee(data as UpdateEmployeeDto);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    try {
      await employeeService.delete(employeeToDelete.id);
      await fetchEmployees();
      await fetchStatistics();
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedEmployees.map(id => employeeService.delete(id)));
      await fetchEmployees();
      await fetchStatistics();
      setSelectedEmployees([]);
      setIsBulkActionsOpen(false);
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await Promise.all(
        selectedEmployees.map(id => 
          employeeService.update(id, { status: status as Employee['status'] })
        )
      );
      await fetchEmployees();
      await fetchStatistics();
      setSelectedEmployees([]);
      setIsBulkActionsOpen(false);
    } catch (error) {
      console.error('Error in bulk status update:', error);
    }
  };

  // Selection handlers
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmployees(
      selectedEmployees.length === employees.length ? [] : employees.map(emp => emp.id)
    );
  };

  // Modal handlers
  const openCreateModal = () => {
    setEmployeeToEdit(null);
    setIsEmployeeFormOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEmployeeFormOpen(true);
  };

  const openViewModal = (employee: Employee) => {
    setEmployeeToView(employee);
    setIsDetailsModalOpen(true);
  };

  const openHRSummaryModal = (employee: Employee) => {
    setEmployeeForHR(employee);
    setIsHRSummaryOpen(true);
  };

  const openDeleteModal = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  // Filter handlers
  const handleFiltersChange = (newFilters: EmployeeSearchFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      department: '',
      designation: '',
      status: '',
      employmentType: '',
      page: 1,
      limit: 10,
      sortBy: 'firstName',
      sortOrder: 'ASC',
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's employees and their information
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          {selectedEmployees.length > 0 && (
            <button
              onClick={() => setIsBulkActionsOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Bulk Actions ({selectedEmployees.length})
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
                <p className="text-gray-600">Total Employees</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{statistics.active}</p>
                <p className="text-gray-600">Active Employees</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.departmentDistribution.length}
                </p>
                <p className="text-gray-600">Departments</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatAmount(statistics.averageSalary)}
                </p>
                <p className="text-gray-600">Avg. Salary</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        departments={departments}
        designations={designations}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        selectedEmployees={selectedEmployees}
        onEmployeeSelect={handleEmployeeSelect}
        onSelectAll={handleSelectAll}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onView={openViewModal}
        onViewHR={openHRSummaryModal}
        loading={loading}
      />

      {/* Pagination */}
      {paginatedData && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((paginatedData.page - 1) * paginatedData.limit) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(paginatedData.page * paginatedData.limit, paginatedData.total)}
              </span> of{' '}
              <span className="font-medium">{paginatedData.total}</span> results
            </p>
            <select
              value={filters.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(paginatedData.page - 1)}
              disabled={paginatedData.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === paginatedData.totalPages || 
                Math.abs(page - paginatedData.page) <= 2
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] < page - 1 && (
                    <span className="px-3 py-1 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      page === paginatedData.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            
            <button
              onClick={() => handlePageChange(paginatedData.page + 1)}
              disabled={paginatedData.page >= paginatedData.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmployeeForm
        isOpen={isEmployeeFormOpen}
        onClose={() => {
          setIsEmployeeFormOpen(false);
          setEmployeeToEdit(null);
        }}
        onSubmit={employeeToEdit ? handleUpdateSubmit : handleCreateSubmit}
        initialData={employeeToEdit || undefined}
        title={employeeToEdit ? 'Edit Employee' : 'Add New Employee'}
        isEdit={!!employeeToEdit}
      />

      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setEmployeeToView(null);
        }}
        employee={employeeToView}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message={
          employeeToDelete 
            ? `Are you sure you want to delete "${employeeToDelete.firstName} ${employeeToDelete.lastName}"? This action cannot be undone.`
            : ''
        }
      />

      <BulkActionsModal
        isOpen={isBulkActionsOpen}
        onClose={() => setIsBulkActionsOpen(false)}
        selectedCount={selectedEmployees.length}
        onBulkDelete={handleBulkDelete}
        onBulkStatusUpdate={handleBulkStatusUpdate}
      />

      {/* HR Summary Modal */}
      {employeeForHR && (
        <EmployeeHRSummary
          employee={employeeForHR}
          isOpen={isHRSummaryOpen}
          onClose={() => {
            setIsHRSummaryOpen(false);
            setEmployeeForHR(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;
