import { apiClient } from './apiClient';

export interface EmployeeStats {
  total: number;
  active: number;
  departments: { [key: string]: number };
  totalSalary: number;
  averageSalary: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  hireDate: string;
  createdAt?: string;
  updatedAt?: string;
}

class EmployeeStatsService {
  private baseUrl = '/employees';

  async getStats(): Promise<EmployeeStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      // Return fallback stats
      return {
        total: 0,
        active: 0,
        departments: {},
        totalSalary: 0,
        averageSalary: 0,
      };
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await apiClient.get(this.baseUrl);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async calculateStatsFromEmployees(): Promise<EmployeeStats> {
    try {
      const employees = await this.getAllEmployees();
      const activeEmployees = Array.isArray(employees) ? employees.filter(emp => emp.status === 'active') : [];
      
      const departments: { [key: string]: number } = {};
      let totalSalary = 0;

      activeEmployees.forEach(employee => {
        departments[employee.department] = (departments[employee.department] || 0) + 1;
        totalSalary += employee.salary || 0;
      });

      return {
        total: employees.length,
        active: activeEmployees.length,
        departments,
        totalSalary,
        averageSalary: activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0,
      };
    } catch (error) {
      console.error('Error calculating employee stats:', error);
      return {
        total: 0,
        active: 0,
        departments: {},
        totalSalary: 0,
        averageSalary: 0,
      };
    }
  }
}

export const employeeStatsService = new EmployeeStatsService();
