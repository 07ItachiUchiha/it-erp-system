import { apiClient } from './apiClient';
import { Employee } from './employeeService';

// Employee Service for HR Module
export const hrEmployeeService = {
  async getAll(filters?: any) {
    if (filters && Object.keys(filters).length > 0) {
      // Use search endpoint for filtered requests
      const response = await apiClient.get('/employees/search', { params: filters });
      return response.data;
    } else {
      // Use simple endpoint for all employees
      const response = await apiClient.get('/employees');
      return { data: response.data }; // Wrap in data property for consistency
    }
  },

  async getById(id: string) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async getActiveEmployees() {
    const response = await apiClient.get('/employees/search', { 
      params: { status: 'active', limit: 1000 } 
    });
    return response.data;
  }
};

// Leave Request Service
export const leaveRequestService = {
  async getAll(filters: any) {
    const response = await apiClient.get('/hr/leave-requests', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/hr/leave-requests/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/hr/leave-requests', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/hr/leave-requests/${id}`, data);
    return response.data;
  },

  async approve(id: string, data: { approved: boolean; comments?: string }) {
    const response = await apiClient.put(`/hr/leave-requests/${id}/approve`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/hr/leave-requests/${id}`);
    return response.data;
  }
};

// Payroll Service
export const payrollService = {
  async getAll(filters: any) {
    const response = await apiClient.get('/hr/payrolls', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/hr/payrolls/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/hr/payrolls', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/hr/payrolls/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/hr/payrolls/${id}`);
    return response.data;
  }
};

// Performance Review Service
export const performanceReviewService = {
  async getAll(filters: any) {
    const response = await apiClient.get('/hr/performance-reviews', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/hr/performance-reviews/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/hr/performance-reviews', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/hr/performance-reviews/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/hr/performance-reviews/${id}`);
    return response.data;
  }
};

// Attendance Service
export const attendanceService = {
  async getAll(filters: any) {
    const response = await apiClient.get('/hr/attendance', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/hr/attendance/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/hr/attendance', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/hr/attendance/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/hr/attendance/${id}`);
    return response.data;
  }
};

// Compliance Tracking Service
export const complianceTrackingService = {
  async getAll(filters: any) {
    const response = await apiClient.get('/hr/compliance-tracking', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/hr/compliance-tracking/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/hr/compliance-tracking', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/hr/compliance-tracking/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/hr/compliance-tracking/${id}`);
    return response.data;
  }
};

// HR Stats Service
export const hrStatsService = {
  async getStats() {
    const response = await apiClient.get('/hr/stats');
    return response.data;
  },

  async getEmployeeStats(employeeId: string) {
    const response = await apiClient.get(`/hr/stats/employee/${employeeId}`);
    return response.data;
  }
};
