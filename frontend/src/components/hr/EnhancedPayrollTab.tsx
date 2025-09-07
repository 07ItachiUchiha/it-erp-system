import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import AdvancedTable, { Column } from '../common/AdvancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/hrService';
import employeeService, { Employee } from '../../services/employeeService';
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '../../services/exportService';
import { formatCurrency } from '../../utils/currency';

interface Payroll {
  id: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payPeriod: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  grossPay: number;
  netPay: number;
  taxDeductions: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  payDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePayrollData {
  employeeId: string;
  payPeriod: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  taxDeductions: number;
}

const EnhancedPayrollTab: React.FC = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [newPayroll, setNewPayroll] = useState<CreatePayrollData>({
    employeeId: '',
    payPeriod: '',
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    overtime: 0,
    taxDeductions: 0,
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
    fetchPayrolls();
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

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction
      };
      const response = await payrollService.getAll(params);
      setPayrolls(response.data || []);
      setPagination(prev => ({ ...prev, total: response.total || response.data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters, sorting, or pagination changes
  useEffect(() => {
    fetchPayrolls();
  }, [filters, sortConfig, pagination.page, pagination.pageSize]);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate gross and net pay
      const grossPay = newPayroll.basicSalary + newPayroll.allowances + newPayroll.overtime;
      const netPay = grossPay - newPayroll.deductions - newPayroll.taxDeductions;
      
      const payrollData = {
        ...newPayroll,
        grossPay,
        netPay
      };

      await payrollService.create(payrollData);
      setIsCreateModalOpen(false);
      setNewPayroll({
        employeeId: '',
        payPeriod: '',
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        overtime: 0,
        taxDeductions: 0,
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error creating payroll:', error);
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'process':
          await Promise.all(selectedIds.map(id => 
            payrollService.update(id, { status: 'PROCESSED' })
          ));
          break;
        case 'pay':
          await Promise.all(selectedIds.map(id => 
            payrollService.update(id, { status: 'PAID', payDate: new Date().toISOString() })
          ));
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedIds.length} payroll records?`)) {
            await Promise.all(selectedIds.map(id => payrollService.delete(id)));
          }
          break;
      }
      fetchPayrolls();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = formatDataForExport(payrolls, format);
    const filename = `payroll_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        exportToCSV(exportData, filename);
        break;
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Payroll Report');
        break;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define table columns
  const columns: Column<Payroll>[] = [
    {
      key: 'employee',
      header: 'Employee',
      sortable: true,
      filterable: true,
      render: (payroll) => (
        <div>
          <div className="font-medium text-gray-900">
            {payroll.employee 
              ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
              : 'Unknown Employee'
            }
          </div>
          <div className="text-sm text-gray-500">{payroll.employee?.email}</div>
        </div>
      )
    },
    {
      key: 'payPeriod',
      header: 'Pay Period',
      sortable: true,
      filterable: true,
      render: (payroll) => payroll.payPeriod
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm">{formatCurrency(payroll.basicSalary)}</span>
      )
    },
    {
      key: 'allowances',
      header: 'Allowances',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm text-green-600">{formatCurrency(payroll.allowances)}</span>
      )
    },
    {
      key: 'deductions',
      header: 'Deductions',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm text-red-600">{formatCurrency(payroll.deductions)}</span>
      )
    },
    {
      key: 'overtime',
      header: 'Overtime',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm text-blue-600">{formatCurrency(payroll.overtime)}</span>
      )
    },
    {
      key: 'grossPay',
      header: 'Gross Pay',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm font-medium">{formatCurrency(payroll.grossPay)}</span>
      )
    },
    {
      key: 'netPay',
      header: 'Net Pay',
      sortable: true,
      render: (payroll) => (
        <span className="font-mono text-sm font-bold text-green-700">{formatCurrency(payroll.netPay)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (payroll) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payroll.status)}`}>
          {payroll.status}
        </span>
      )
    },
    {
      key: 'payDate',
      header: 'Pay Date',
      sortable: true,
      render: (payroll) => payroll.payDate ? new Date(payroll.payDate).toLocaleDateString() : '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payroll) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedPayroll(payroll);
              setIsDetailModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            View
          </button>
          {payroll.status === 'DRAFT' && (user?.role === 'admin' || user?.role === 'hr') && (
            <button
              onClick={() => payrollService.update(payroll.id, { status: 'PROCESSED' }).then(fetchPayrolls)}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Process
            </button>
          )}
          {payroll.status === 'PROCESSED' && (user?.role === 'admin' || user?.role === 'hr') && (
            <button
              onClick={() => payrollService.update(payroll.id, { status: 'PAID', payDate: new Date().toISOString() }).then(fetchPayrolls)}
              className="text-purple-600 hover:text-purple-900 text-sm"
            >
              Mark Paid
            </button>
          )}
        </div>
      )
    }
  ];

  const bulkActions = [
    { key: 'process', label: 'Process Selected', variant: 'primary' as const },
    { key: 'pay', label: 'Mark as Paid', variant: 'secondary' as const },
    { key: 'delete', label: 'Delete Selected', variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Payroll</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          ➕ Create Payroll
        </button>
      </div>

      {/* Advanced Table */}
      <AdvancedTable
        data={payrolls}
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
        exportFileName="payroll"
      />

      {/* Create Payroll Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Payroll</h3>
          <form onSubmit={handleCreatePayroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={newPayroll.employeeId}
                onChange={(e) => setNewPayroll({ ...newPayroll, employeeId: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Pay Period</label>
              <input
                type="month"
                value={newPayroll.payPeriod}
                onChange={(e) => setNewPayroll({ ...newPayroll, payPeriod: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayroll.basicSalary}
                  onChange={(e) => setNewPayroll({ ...newPayroll, basicSalary: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allowances</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayroll.allowances}
                  onChange={(e) => setNewPayroll({ ...newPayroll, allowances: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Deductions</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayroll.deductions}
                  onChange={(e) => setNewPayroll({ ...newPayroll, deductions: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Overtime</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayroll.overtime}
                  onChange={(e) => setNewPayroll({ ...newPayroll, overtime: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tax Deductions</label>
              <input
                type="number"
                step="0.01"
                value={newPayroll.taxDeductions}
                onChange={(e) => setNewPayroll({ ...newPayroll, taxDeductions: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Calculate and show totals */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Gross Pay:</span>
                  <span className="ml-2 font-mono">
                    {formatCurrency(newPayroll.basicSalary + newPayroll.allowances + newPayroll.overtime)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Net Pay:</span>
                  <span className="ml-2 font-mono font-bold text-green-700">
                    {formatCurrency(
                      newPayroll.basicSalary + newPayroll.allowances + newPayroll.overtime - 
                      newPayroll.deductions - newPayroll.taxDeductions
                    )}
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
                Create Payroll
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Payroll Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
      >
        {selectedPayroll && (
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPayroll.employee 
                      ? `${selectedPayroll.employee.firstName} ${selectedPayroll.employee.lastName}`
                      : 'Unknown Employee'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPayroll.employee?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pay Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayroll.payPeriod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPayroll.status)}`}>
                    {selectedPayroll.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Salary Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Basic Salary:</span>
                    <span className="text-sm font-mono">{formatCurrency(selectedPayroll.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Allowances:</span>
                    <span className="text-sm font-mono text-green-600">+ {formatCurrency(selectedPayroll.allowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overtime:</span>
                    <span className="text-sm font-mono text-blue-600">+ {formatCurrency(selectedPayroll.overtime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deductions:</span>
                    <span className="text-sm font-mono text-red-600">- {formatCurrency(selectedPayroll.deductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax Deductions:</span>
                    <span className="text-sm font-mono text-red-600">- {formatCurrency(selectedPayroll.taxDeductions)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Gross Pay:</span>
                      <span className="text-sm font-mono font-medium">{formatCurrency(selectedPayroll.grossPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-gray-900">Net Pay:</span>
                      <span className="text-sm font-mono font-bold text-green-700">{formatCurrency(selectedPayroll.netPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayroll.payDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pay Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPayroll.payDate).toLocaleDateString()}
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

export default EnhancedPayrollTab;
