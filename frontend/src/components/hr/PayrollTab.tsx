import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService, hrEmployeeService } from '../../services/hrService';
import { Employee } from '../../services/employeeService';

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

const PayrollTab: React.FC = () => {
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

  useEffect(() => {
    fetchPayrolls();
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

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAll({});
      setPayrolls(response.data || []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.create(newPayroll);
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

  const handleProcessPayroll = async (id: string) => {
    try {
      await payrollService.update(id, { status: 'PROCESSED' });
      fetchPayrolls();
    } catch (error) {
      console.error('Error processing payroll:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
        <h2 className="text-xl font-semibold text-gray-900">Payroll Management</h2>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Payroll
          </button>
        )}
      </div>

      {/* Payroll List */}
      <div className="grid gap-4">
        {payrolls.length === 0 ? (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-8 text-center">
              <p className="text-gray-500">No payroll records found.</p>
            </div>
          </div>
        ) : (
          payrolls.map((payroll) => (
            <div key={payroll.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="p-6"
                onClick={() => {
                  setSelectedPayroll(payroll);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {payroll.employee 
                          ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                          : 'Unknown Employee'
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payroll.status)}`}>
                        {payroll.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Pay Period</p>
                        <p className="font-medium">{payroll.payPeriod}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gross Pay</p>
                        <p className="font-medium text-green-600">{formatCurrency(payroll.grossPay)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Net Pay</p>
                        <p className="font-medium text-blue-600">{formatCurrency(payroll.netPay)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(payroll.createdAt).toLocaleDateString()}
                    </p>
                    {payroll.payDate && (
                      <p className="text-xs text-gray-500">
                        Paid: {new Date(payroll.payDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
                type="text"
                value={newPayroll.payPeriod}
                onChange={(e) => setNewPayroll({ ...newPayroll, payPeriod: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="e.g., 2024-01"
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
                  <label className="block text-sm font-medium text-gray-700">Pay Period</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayroll.payPeriod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPayroll.status)}`}>
                    {selectedPayroll.status}
                  </span>
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

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span>{formatCurrency(selectedPayroll.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances:</span>
                      <span>{formatCurrency(selectedPayroll.allowances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overtime:</span>
                      <span>{formatCurrency(selectedPayroll.overtime)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deductions:</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayroll.deductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Deductions:</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayroll.taxDeductions)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between font-medium">
                    <span>Gross Pay:</span>
                    <span className="text-green-600">{formatCurrency(selectedPayroll.grossPay)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Pay:</span>
                    <span className="text-blue-600">{formatCurrency(selectedPayroll.netPay)}</span>
                  </div>
                </div>
              </div>

              {selectedPayroll.status === 'DRAFT' && user?.role === 'admin' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button 
                    onClick={() => handleProcessPayroll(selectedPayroll.id)}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Process Payroll
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

export default PayrollTab;