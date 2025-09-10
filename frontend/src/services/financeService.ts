import { apiClient } from './apiClient';

// Enhanced Invoice interface with new fields
export interface Invoice {
  id?: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  dueDate: string;
  status: string;
  items?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Enhanced fields
  billToName?: string;
  billToAddress?: string;
  billToGSTIN?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToGSTIN?: string;
  subtotal?: number;
  shippingCharges?: number;
  taxRate?: number;
  isTaxOptional?: boolean;
  gstBreakup?: {
    cgst: number;
    sgst: number;
    igst: number;
    utgst?: number;
  };
  calculatedTotal?: number;
  generatedInvoiceNumber?: string;
}

// Address interfaces
export interface BillToAddress {
  name: string;
  address: string;
  gstin?: string;
}

export interface ShipToAddress {
  name: string;
  address: string;
  gstin?: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressType: 'billing' | 'shipping' | 'both';
  contactName?: string;
  companyName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  gstin?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// GST Calculation interfaces
export interface GSTCalculationRequest {
  billToState: string;
  shipToState: string;
  subtotal: number;
  shippingCharges: number;
  taxRate: number;
}

export interface GSTCalculationResult {
  transactionType: 'intra-state' | 'inter-state';
  gstBreakup: {
    cgst: number;
    sgst: number;
    igst: number;
    utgst?: number;
  };
  totalTax: number;
  grandTotal: number;
}

export interface Expense {
  id?: string;
  description: string;
  category: string;
  vendor?: string;
  amount: number;
  date: string;
  status?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  paidRevenue: number;
  netProfit: number;
  gstSummary?: {
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    taxableInvoices: number;
    overriddenInvoices: number;
  };
}

class FinanceService {
  private baseUrl = '/finance';

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/invoices`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/invoices`, invoice);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/invoices/${id}`, invoice);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/invoices/${id}`);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Expense methods
  async getAllExpenses(): Promise<Expense[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/expenses`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/expenses`, expense);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/expenses/${id}`, expense);
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/expenses/${id}`);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Dashboard/Summary methods
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      // Fallback to local calculation if backend endpoint fails
      const [invoices, expenses] = await Promise.all([
        this.getAllInvoices(),
        this.getAllExpenses()
      ]);

      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.calculatedTotal || invoice.amount), 0);
      const paidRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + (invoice.calculatedTotal || invoice.amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = paidRevenue - totalExpenses;

      return {
        totalRevenue,
        totalExpenses,
        paidRevenue,
        netProfit
      };
    }
  }

  // Enhanced GST Calculation methods
  async calculateGST(request: GSTCalculationRequest): Promise<GSTCalculationResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/gst/calculate`, request);
      return response.data;
    } catch (error) {
      console.error('Error calculating GST:', error);
      throw error;
    }
  }

  // Customer Address methods
  async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customer-addresses/${customerId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      return [];
    }
  }

  async getDefaultAddress(customerId: string, addressType: 'billing' | 'shipping'): Promise<CustomerAddress | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customer-addresses/${customerId}/default/${addressType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }

  async createCustomerAddress(address: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customer-addresses`, address);
      return response.data;
    } catch (error) {
      console.error('Error creating customer address:', error);
      throw error;
    }
  }

  // Export methods
  async exportInvoicesToExcel(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    customerName?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerName) params.append('customerName', filters.customerName);

      const response = await apiClient.get(`${this.baseUrl}/invoices/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting invoices to Excel:', error);
      throw error;
    }
  }

  async exportInvoicesToCSV(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    customerName?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerName) params.append('customerName', filters.customerName);

      const response = await apiClient.get(`${this.baseUrl}/invoices/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting invoices to CSV:', error);
      throw error;
    }
  }
}

export const financeService = new FinanceService();
