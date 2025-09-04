import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Warehouse, 
  QrCode, 
  Hash,
  Layers,
  FileText,
  Factory,
  Monitor,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Settings,
  Search,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react';
import { productVariantService, barcodeService, workstationService, bomService, manufacturingOrderService } from '../../services/advancedInventoryService';
import ProductVariantManager from './ProductVariantManager';
import BarcodeManager from './BarcodeManager';
import ManufacturingOrderManager from './ManufacturingOrderManager';

interface DashboardMetrics {
  totalProducts: number;
  totalVariants: number;
  lowStockVariants: number;
  totalWorkstations: number;
  activeOrders: number;
  completedOrders: number;
  averageEfficiency: number;
  totalBarcodes: number;
}

const AdvancedInventoryDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const modules = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BarChart3,
      color: 'bg-blue-500',
      description: 'Comprehensive inventory overview'
    },
    {
      id: 'products',
      name: 'Products & Services',
      icon: Package,
      color: 'bg-green-500',
      description: 'Product catalogue management'
    },
    {
      id: 'stock',
      name: 'Stock & Warehouse',
      icon: Warehouse,
      color: 'bg-purple-500',
      description: 'Inventory and warehouse operations'
    },
    {
      id: 'barcodes',
      name: 'Barcodes',
      icon: QrCode,
      color: 'bg-indigo-500',
      description: 'Barcode generation and scanning'
    },
    {
      id: 'batches',
      name: 'Batches/Lots/Serials',
      icon: Hash,
      color: 'bg-yellow-500',
      description: 'Batch and serial number tracking'
    },
    {
      id: 'variants',
      name: 'Product Variants',
      icon: Layers,
      color: 'bg-pink-500',
      description: 'Product variation management'
    },
    {
      id: 'bom',
      name: 'Bill of Materials',
      icon: FileText,
      color: 'bg-orange-500',
      description: 'BOM and material requirements'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing Orders',
      icon: Factory,
      color: 'bg-red-500',
      description: 'Production order management'
    },
    {
      id: 'workstations',
      name: 'Workstations',
      icon: Monitor,
      color: 'bg-teal-500',
      description: 'Workstation monitoring and control'
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load dashboard metrics from various services
      const [
        manufacturingMetrics,
        // You can add more parallel API calls here
      ] = await Promise.allSettled([
        manufacturingOrderService.getDashboardMetrics(),
      ]);

      // Combine metrics from different sources
      const dashboardMetrics: DashboardMetrics = {
        totalProducts: 0,
        totalVariants: 0,
        lowStockVariants: 0,
        totalWorkstations: 0,
        activeOrders: manufacturingMetrics.status === 'fulfilled' ? manufacturingMetrics.value?.activeOrders || 0 : 0,
        completedOrders: manufacturingMetrics.status === 'fulfilled' ? manufacturingMetrics.value?.completedOrders || 0 : 0,
        averageEfficiency: manufacturingMetrics.status === 'fulfilled' ? manufacturingMetrics.value?.averageEfficiency || 0 : 0,
        totalBarcodes: 0,
      };

      setMetrics(dashboardMetrics);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Layers className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
              <p className="text-2xl font-bold text-green-600">{metrics?.totalVariants || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
              <p className="text-2xl font-bold text-yellow-600">{metrics?.lowStockVariants || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Factory className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
              <p className="text-2xl font-bold text-purple-600">{metrics?.activeOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manufacturing Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manufacturing Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Orders</span>
              <span className="font-semibold text-blue-600">{metrics?.activeOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Orders</span>
              <span className="font-semibold text-green-600">{metrics?.completedOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Efficiency</span>
              <span className="font-semibold text-orange-600">{metrics?.averageEfficiency || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Workstations</span>
              <span className="font-semibold text-purple-600">{metrics?.totalWorkstations || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Barcodes</span>
              <span className="font-semibold text-indigo-600">{metrics?.totalBarcodes || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stock Coverage</span>
              <span className="font-semibold text-green-600">95%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Batch Tracking</span>
              <span className="font-semibold text-blue-600">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quality Score</span>
              <span className="font-semibold text-green-600">98.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Add Product</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <QrCode className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Generate Barcode</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Factory className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Create MO</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Create BOM</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return renderOverview();
      case 'products':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Products & Services Catalogue</h2>
            <p className="text-gray-600 mb-4">Manage your product and service catalogue with comprehensive details.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Add Product
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Add Service
                </button>
                <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
                  Import CSV
                </button>
              </div>
              <div className="text-sm text-gray-500">
                • Product categories and specifications<br/>
                • Service definitions and pricing<br/>
                • Product lifecycle management<br/>
                • Multi-unit configurations
              </div>
            </div>
          </div>
        );
      case 'stock':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock & Warehouse Management</h2>
            <p className="text-gray-600 mb-4">Monitor inventory levels, manage warehouses, and track stock movements.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Stock Adjustment
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Warehouse Transfer
                </button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                  Stock Take
                </button>
              </div>
              <div className="text-sm text-gray-500">
                • Real-time stock levels<br/>
                • Multi-warehouse support<br/>
                • Stock movement history<br/>
                • Automated reorder points
              </div>
            </div>
          </div>
        );
      case 'barcodes':
        return <BarcodeManager />;
      case 'batches':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Batches, Lots & Serial Numbers</h2>
            <p className="text-gray-600 mb-4">Track product batches, lots, and serial numbers for complete traceability.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Create Batch
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Track Serial
                </button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                  Quality Check
                </button>
              </div>
              <div className="text-sm text-gray-500">
                • Batch number generation<br/>
                • Serial number tracking<br/>
                • Expiry date management<br/>
                • Quality status tracking
              </div>
            </div>
          </div>
        );
      case 'variants':
        return <ProductVariantManager />;
      case 'bom':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill of Materials (BOM)</h2>
            <p className="text-gray-600 mb-4">Define product recipes, material requirements, and manufacturing operations.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Create BOM
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Copy BOM
                </button>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                  Cost Analysis
                </button>
              </div>
              <div className="text-sm text-gray-500">
                • Multi-level BOMs<br/>
                • Component requirements<br/>
                • Operation sequences<br/>
                • Cost calculations
              </div>
            </div>
          </div>
        );
      case 'manufacturing':
        return <ManufacturingOrderManager />;
      case 'workstations':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Workstations & Workplaces</h2>
            <p className="text-gray-600 mb-4">Monitor and manage manufacturing workstations, equipment, and capacity.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Add Workstation
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Capacity Planning
                </button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                  Maintenance
                </button>
              </div>
              <div className="text-sm text-gray-500">
                • Equipment monitoring<br/>
                • Capacity utilization<br/>
                • Maintenance scheduling<br/>
                • Efficiency tracking
              </div>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Inventory Management</h1>
              <p className="text-gray-600">Comprehensive inventory control and manufacturing management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              {modules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeModule === module.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1 rounded ${module.color} mr-3`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{module.name}</div>
                      <div className="text-xs text-gray-500">{module.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderModuleContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInventoryDashboard;
