import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Calendar,
  BarChart3,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  TrendingUp,
  Package,
  Wrench
} from 'lucide-react';
import { manufacturingOrderService, ManufacturingOrder } from '../../services/advancedInventoryService';

const ManufacturingOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'confirmed' | 'in_progress' | 'paused' | 'completed' | 'cancelled'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'list' | 'kanban' | 'calendar'>('list');

  useEffect(() => {
    loadOrders();
    loadDashboardMetrics();
  }, [filterStatus, filterPriority]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let data: ManufacturingOrder[];
      
      if (filterStatus === 'all') {
        data = await manufacturingOrderService.getAll();
      } else {
        data = await manufacturingOrderService.getByStatus(filterStatus);
      }
      
      setOrders(data);
    } catch (error) {
      console.error('Error loading manufacturing orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardMetrics = async () => {
    try {
      const metrics = await manufacturingOrderService.getDashboardMetrics();
      setDashboardMetrics(metrics);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      switch (newStatus) {
        case 'in_progress':
          await manufacturingOrderService.startProduction(orderId);
          break;
        case 'paused':
          await manufacturingOrderService.pauseProduction(orderId);
          break;
        case 'completed':
          // This would typically require quantity input
          await manufacturingOrderService.completeProduction(orderId, 0);
          break;
        case 'cancelled':
          await manufacturingOrderService.cancelOrder(orderId);
          break;
        default:
          await manufacturingOrderService.updateStatus(orderId, newStatus);
      }
      loadOrders();
      loadDashboardMetrics();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'text-green-600',
      'normal': 'text-blue-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const matchesSearch = 
      order.moNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.responsiblePerson?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  }) : [];

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Factory className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboardMetrics?.totalOrders || orders.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Play className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
            <p className="text-2xl font-bold text-green-600">
              {Array.isArray(orders) ? orders.filter(o => o.status === 'in_progress').length : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Array.isArray(orders) ? orders.filter(o => o.status === 'completed').length : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Efficiency</h3>
            <p className="text-2xl font-bold text-orange-600">
              {dashboardMetrics?.averageEfficiency || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrderCard = (order: ManufacturingOrder) => (
    <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.moNumber}</h3>
            <p className="text-gray-600">{order.product?.name || 'Product not available'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </span>
            <span className={`font-medium ${getPriorityColor(order.priority)}`}>
              {order.priority}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{order.quantityProduced} / {order.quantityToProduce}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${Math.min((order.quantityProduced / order.quantityToProduce) * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Planned Start:</span>
            <p className="font-medium">
              {order.plannedStartDate ? new Date(order.plannedStartDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Planned End:</span>
            <p className="font-medium">
              {order.plannedEndDate ? new Date(order.plannedEndDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Estimated Hours:</span>
            <p className="font-medium">{order.estimatedHours || 0}h</p>
          </div>
          <div>
            <span className="text-gray-600">Actual Hours:</span>
            <p className="font-medium">{order.actualHours}h</p>
          </div>
        </div>

        {/* Workstation & Responsible Person */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-400" />
              <span>{order.workstation?.name || 'No workstation'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{order.responsiblePerson || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t flex gap-2">
          {order.status === 'confirmed' && (
            <button
              onClick={() => handleStatusUpdate(order.id, 'in_progress')}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
            >
              <Play className="h-3 w-3" />
              Start
            </button>
          )}
          
          {order.status === 'in_progress' && (
            <>
              <button
                onClick={() => handleStatusUpdate(order.id, 'paused')}
                className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 flex items-center justify-center gap-1"
              >
                <Pause className="h-3 w-3" />
                Pause
              </button>
              <button
                onClick={() => handleStatusUpdate(order.id, 'completed')}
                className="flex-1 bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 flex items-center justify-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Complete
              </button>
            </>
          )}
          
          {order.status === 'paused' && (
            <button
              onClick={() => handleStatusUpdate(order.id, 'in_progress')}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
            >
              <Play className="h-3 w-3" />
              Resume
            </button>
          )}

          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
            <Eye className="h-3 w-3" />
          </button>
          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
            <Edit className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manufacturing Orders</h2>
          <p className="text-gray-600">Plan, schedule, and track production orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Dashboard Metrics */}
      {renderDashboard()}

      {/* Filters and View Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('list')}
              className={`px-3 py-2 rounded-lg ${
                selectedView === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setSelectedView('kanban')}
              className={`px-3 py-2 rounded-lg ${
                selectedView === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setSelectedView('calendar')}
              className={`px-3 py-2 rounded-lg ${
                selectedView === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Orders Display */}
      {selectedView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(renderOrderCard)}
        </div>
      )}

      {selectedView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {['draft', 'confirmed', 'in_progress', 'paused', 'completed'].map(status => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 capitalize">
                {status.replace('_', ' ')} ({filteredOrders.filter(o => o.status === status).length})
              </h3>
              <div className="space-y-3">
                {filteredOrders
                  .filter(order => order.status === status)
                  .map(order => (
                    <div key={order.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="font-medium text-sm">{order.moNumber}</h4>
                      <p className="text-xs text-gray-600 mt-1">{order.product?.name}</p>
                      <div className="mt-2 text-xs">
                        <span className={`font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedView === 'calendar' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
            <p className="text-gray-600 mt-2">Calendar integration would be implemented here</p>
          </div>
        </div>
      )}

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Manufacturing Order</h3>
              <p className="text-gray-600 mb-4">Manufacturing order creation form would be implemented here</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingOrderManager;
