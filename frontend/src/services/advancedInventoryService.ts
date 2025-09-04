import { apiClient } from './apiClient';

// Product Variant interfaces
export interface ProductVariant {
  id: string;
  variantCode: string;
  variantName: string;
  parentItemId: string;
  parentItem?: any;
  attributes: Record<string, any>;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  weight?: string;
  dimensions?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantDto {
  variantCode: string;
  variantName: string;
  parentItemId: string;
  attributes: Record<string, any>;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock?: number;
  maximumStock?: number;
  weight?: string;
  dimensions?: string;
  description?: string;
  imageUrl?: string;
}

// Barcode interfaces
export interface Barcode {
  id: string;
  barcodeValue: string;
  barcodeType: 'EAN13' | 'EAN8' | 'UPC_A' | 'UPC_E' | 'CODE128' | 'CODE39' | 'QR_CODE' | 'DATA_MATRIX';
  entityType: 'item' | 'variant' | 'batch' | 'serial';
  itemId?: string;
  variantId?: string;
  batchNumber?: string;
  serialNumber?: string;
  description?: string;
  isPrimary: boolean;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Workstation interfaces
export interface Workstation {
  id: string;
  workstationCode: string;
  name: string;
  description?: string;
  type: 'manual' | 'semi_automatic' | 'automatic' | 'cnc' | 'assembly' | 'quality_check' | 'packaging';
  location?: string;
  hourlyRate?: number;
  capacity: number;
  hoursPerDay: number;
  workingDaysPerWeek: number;
  efficiency: number;
  capabilities?: string[];
  equipment?: Record<string, any>;
  maintenanceSchedule?: Record<string, any>;
  status: 'operational' | 'maintenance' | 'breakdown' | 'idle';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// BOM interfaces
export interface BOMComponent {
  id: string;
  componentId: string;
  component?: any;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  wastagePercentage: number;
  notes?: string;
}

export interface BOMOperation {
  id: string;
  operationName: string;
  description?: string;
  sequence: number;
  setupTime: number;
  operationTime: number;
  hourlyRate: number;
  totalCost: number;
  workstation?: string;
  instructions?: string;
  qualityChecks?: Record<string, any>[];
}

export interface BillOfMaterial {
  id: string;
  bomCode: string;
  productId: string;
  product?: any;
  name: string;
  description?: string;
  productionQuantity: number;
  status: 'active' | 'inactive' | 'draft';
  validFrom?: string;
  validTo?: string;
  setupTime: number;
  operationTime: number;
  totalCost: number;
  notes?: string;
  components: BOMComponent[];
  operations: BOMOperation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Manufacturing Order interfaces
export interface ManufacturingOrder {
  id: string;
  moNumber: string;
  productId: string;
  product?: any;
  bomId?: string;
  billOfMaterial?: BillOfMaterial;
  workstationId?: string;
  workstation?: Workstation;
  quantityToProduce: number;
  quantityProduced: number;
  quantityConsumed: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  actualHours: number;
  estimatedCost?: number;
  actualCost: number;
  responsiblePerson?: string;
  notes?: string;
  operations?: Record<string, any>[];
  qualityChecks?: Record<string, any>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product Variant Service
export const productVariantService = {
  // Get all variants
  getAll: async (): Promise<ProductVariant[]> => {
    const response = await apiClient.get('/inventory/product-variants');
    return response.data;
  },

  // Get variants by parent item
  getByParentItem: async (parentItemId: string): Promise<ProductVariant[]> => {
    const response = await apiClient.get(`/inventory/product-variants?parentItemId=${parentItemId}`);
    return response.data;
  },

  // Get variant by ID
  getById: async (id: string): Promise<ProductVariant> => {
    const response = await apiClient.get(`/inventory/product-variants/${id}`);
    return response.data;
  },

  // Create variant
  create: async (data: CreateProductVariantDto): Promise<ProductVariant> => {
    const response = await apiClient.post('/inventory/product-variants', data);
    return response.data;
  },

  // Update variant
  update: async (id: string, data: Partial<CreateProductVariantDto>): Promise<ProductVariant> => {
    const response = await apiClient.patch(`/inventory/product-variants/${id}`, data);
    return response.data;
  },

  // Delete variant
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/product-variants/${id}`);
  },

  // Update stock
  updateStock: async (id: string, quantity: number, operation: 'add' | 'subtract'): Promise<ProductVariant> => {
    const response = await apiClient.patch(`/inventory/product-variants/${id}/stock`, { quantity, operation });
    return response.data;
  },

  // Search variants
  search: async (searchTerm: string): Promise<ProductVariant[]> => {
    const response = await apiClient.get(`/inventory/product-variants/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Get low stock variants
  getLowStock: async (): Promise<ProductVariant[]> => {
    const response = await apiClient.get('/inventory/product-variants/low-stock');
    return response.data;
  },
};

// Barcode Service
export const barcodeService = {
  // Get all barcodes
  getAll: async (): Promise<Barcode[]> => {
    const response = await apiClient.get('/inventory/barcodes');
    return response.data;
  },

  // Get barcode by ID
  getById: async (id: string): Promise<Barcode> => {
    const response = await apiClient.get(`/inventory/barcodes/${id}`);
    return response.data;
  },

  // Create barcode
  create: async (data: any): Promise<Barcode> => {
    const response = await apiClient.post('/inventory/barcodes', data);
    return response.data;
  },

  // Generate barcode
  generate: async (entityType: 'item' | 'variant', entityId: string, barcodeType?: string): Promise<Barcode> => {
    const response = await apiClient.post('/inventory/barcodes/generate', { entityType, entityId, barcodeType });
    return response.data;
  },

  // Bulk generate barcodes
  bulkGenerate: async (items: Array<{id: string, type: 'item' | 'variant'}>): Promise<Barcode[]> => {
    const response = await apiClient.post('/inventory/barcodes/bulk-generate', items);
    return response.data;
  },

  // Scan barcode
  scan: async (barcodeValue: string): Promise<any> => {
    const response = await apiClient.get(`/inventory/barcodes/scan/${encodeURIComponent(barcodeValue)}`);
    return response.data;
  },

  // Get barcodes by item
  getByItem: async (itemId: string): Promise<Barcode[]> => {
    const response = await apiClient.get(`/inventory/barcodes/item/${itemId}`);
    return response.data;
  },

  // Get barcodes by variant
  getByVariant: async (variantId: string): Promise<Barcode[]> => {
    const response = await apiClient.get(`/inventory/barcodes/variant/${variantId}`);
    return response.data;
  },

  // Update barcode
  update: async (id: string, data: any): Promise<Barcode> => {
    const response = await apiClient.patch(`/inventory/barcodes/${id}`, data);
    return response.data;
  },

  // Delete barcode
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/barcodes/${id}`);
  },
};

// Workstation Service
export const workstationService = {
  // Get all workstations
  getAll: async (): Promise<Workstation[]> => {
    const response = await apiClient.get('/inventory/workstations');
    return response.data;
  },

  // Get workstation by ID
  getById: async (id: string): Promise<Workstation> => {
    const response = await apiClient.get(`/inventory/workstations/${id}`);
    return response.data;
  },

  // Create workstation
  create: async (data: any): Promise<Workstation> => {
    const response = await apiClient.post('/inventory/workstations', data);
    return response.data;
  },

  // Update workstation
  update: async (id: string, data: any): Promise<Workstation> => {
    const response = await apiClient.patch(`/inventory/workstations/${id}`, data);
    return response.data;
  },

  // Update workstation status
  updateStatus: async (id: string, status: string): Promise<Workstation> => {
    const response = await apiClient.patch(`/inventory/workstations/${id}/status`, { status });
    return response.data;
  },

  // Delete workstation
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/workstations/${id}`);
  },

  // Get available workstations
  getAvailable: async (): Promise<Workstation[]> => {
    const response = await apiClient.get('/inventory/workstations/available');
    return response.data;
  },

  // Get workstation utilization
  getUtilization: async (id: string, startDate: string, endDate: string): Promise<any> => {
    const response = await apiClient.get(`/inventory/workstations/${id}/utilization?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get workstation load
  getLoad: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/inventory/workstations/${id}/load`);
    return response.data;
  },

  // Search workstations
  search: async (searchTerm: string): Promise<Workstation[]> => {
    const response = await apiClient.get(`/inventory/workstations/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },
};

// BOM Service
export const bomService = {
  // Get all BOMs
  getAll: async (): Promise<BillOfMaterial[]> => {
    const response = await apiClient.get('/inventory/bom');
    return response.data;
  },

  // Get BOM by ID
  getById: async (id: string): Promise<BillOfMaterial> => {
    const response = await apiClient.get(`/inventory/bom/${id}`);
    return response.data;
  },

  // Create BOM
  create: async (data: any): Promise<BillOfMaterial> => {
    const response = await apiClient.post('/inventory/bom', data);
    return response.data;
  },

  // Update BOM
  update: async (id: string, data: any): Promise<BillOfMaterial> => {
    const response = await apiClient.patch(`/inventory/bom/${id}`, data);
    return response.data;
  },

  // Update BOM status
  updateStatus: async (id: string, status: string): Promise<BillOfMaterial> => {
    const response = await apiClient.patch(`/inventory/bom/${id}/status`, { status });
    return response.data;
  },

  // Delete BOM
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/bom/${id}`);
  },

  // Get BOMs by product
  getByProduct: async (productId: string): Promise<BillOfMaterial[]> => {
    const response = await apiClient.get(`/inventory/bom?productId=${productId}`);
    return response.data;
  },

  // Get active BOM by product
  getActiveByProduct: async (productId: string): Promise<BillOfMaterial | null> => {
    const response = await apiClient.get(`/inventory/bom/product/${productId}/active`);
    return response.data;
  },

  // Calculate material requirements
  calculateMaterialRequirements: async (bomId: string, quantity: number): Promise<any> => {
    const response = await apiClient.get(`/inventory/bom/${bomId}/material-requirements?quantity=${quantity}`);
    return response.data;
  },

  // Search BOMs
  search: async (searchTerm: string): Promise<BillOfMaterial[]> => {
    const response = await apiClient.get(`/inventory/bom/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Component management
  addComponent: async (bomId: string, componentData: any): Promise<BOMComponent> => {
    const response = await apiClient.post(`/inventory/bom/${bomId}/components`, componentData);
    return response.data;
  },

  updateComponent: async (componentId: string, data: any): Promise<BOMComponent> => {
    const response = await apiClient.patch(`/inventory/bom/components/${componentId}`, data);
    return response.data;
  },

  removeComponent: async (componentId: string): Promise<void> => {
    await apiClient.delete(`/inventory/bom/components/${componentId}`);
  },

  // Operation management
  addOperation: async (bomId: string, operationData: any): Promise<BOMOperation> => {
    const response = await apiClient.post(`/inventory/bom/${bomId}/operations`, operationData);
    return response.data;
  },

  updateOperation: async (operationId: string, data: any): Promise<BOMOperation> => {
    const response = await apiClient.patch(`/inventory/bom/operations/${operationId}`, data);
    return response.data;
  },

  removeOperation: async (operationId: string): Promise<void> => {
    await apiClient.delete(`/inventory/bom/operations/${operationId}`);
  },
};

// Manufacturing Order Service
export const manufacturingOrderService = {
  // Get all manufacturing orders
  getAll: async (): Promise<ManufacturingOrder[]> => {
    const response = await apiClient.get('/inventory/manufacturing-orders');
    return response.data;
  },

  // Get manufacturing order by ID
  getById: async (id: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders/${id}`);
    return response.data;
  },

  // Create manufacturing order
  create: async (data: any): Promise<ManufacturingOrder> => {
    const response = await apiClient.post('/inventory/manufacturing-orders', data);
    return response.data;
  },

  // Update manufacturing order
  update: async (id: string, data: any): Promise<ManufacturingOrder> => {
    const response = await apiClient.patch(`/inventory/manufacturing-orders/${id}`, data);
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.patch(`/inventory/manufacturing-orders/${id}/status`, { status });
    return response.data;
  },

  // Delete manufacturing order
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/manufacturing-orders/${id}`);
  },

  // Get orders by status
  getByStatus: async (status: string): Promise<ManufacturingOrder[]> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders?status=${status}`);
    return response.data;
  },

  // Get orders by product
  getByProduct: async (productId: string): Promise<ManufacturingOrder[]> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders?productId=${productId}`);
    return response.data;
  },

  // Get orders by workstation
  getByWorkstation: async (workstationId: string): Promise<ManufacturingOrder[]> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders?workstationId=${workstationId}`);
    return response.data;
  },

  // Production operations
  startProduction: async (id: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.post(`/inventory/manufacturing-orders/${id}/start`);
    return response.data;
  },

  completeProduction: async (id: string, quantityProduced: number): Promise<ManufacturingOrder> => {
    const response = await apiClient.post(`/inventory/manufacturing-orders/${id}/complete`, { quantityProduced });
    return response.data;
  },

  pauseProduction: async (id: string, reason?: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.post(`/inventory/manufacturing-orders/${id}/pause`, { reason });
    return response.data;
  },

  resumeProduction: async (id: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.post(`/inventory/manufacturing-orders/${id}/resume`);
    return response.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<ManufacturingOrder> => {
    const response = await apiClient.post(`/inventory/manufacturing-orders/${id}/cancel`, { reason });
    return response.data;
  },

  updateProgress: async (id: string, data: any): Promise<ManufacturingOrder> => {
    const response = await apiClient.patch(`/inventory/manufacturing-orders/${id}/progress`, data);
    return response.data;
  },

  // Dashboard and analytics
  getDashboardMetrics: async (): Promise<any> => {
    const response = await apiClient.get('/inventory/manufacturing-orders/dashboard');
    return response.data;
  },

  getProductionSchedule: async (startDate: string, endDate: string): Promise<any> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders/schedule?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Search orders
  search: async (searchTerm: string): Promise<ManufacturingOrder[]> => {
    const response = await apiClient.get(`/inventory/manufacturing-orders/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },
};
