import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package, 
  QrCode, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { productVariantService, ProductVariant, CreateProductVariantDto } from '../../services/advancedInventoryService';

interface ProductVariantManagerProps {
  parentItemId?: string;
}

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({ parentItemId }) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'low_stock'>('all');
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState<CreateProductVariantDto>({
    variantCode: '',
    variantName: '',
    parentItemId: parentItemId || '',
    attributes: {},
    costPrice: 0,
    sellingPrice: 0,
    minimumStock: 0,
    maximumStock: 1000,
  });

  useEffect(() => {
    loadVariants();
  }, [parentItemId, filterStatus]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      let data: ProductVariant[];
      
      if (parentItemId) {
        data = await productVariantService.getByParentItem(parentItemId);
      } else {
        data = await productVariantService.getAll();
      }

      // Apply filters
      switch (filterStatus) {
        case 'active':
          data = data.filter(v => v.isActive);
          break;
        case 'inactive':
          data = data.filter(v => !v.isActive);
          break;
        case 'low_stock':
          data = await productVariantService.getLowStock();
          break;
      }

      setVariants(data);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productVariantService.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadVariants();
    } catch (error) {
      console.error('Error creating variant:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    
    try {
      await productVariantService.update(editingVariant.id, formData);
      setShowEditModal(false);
      setEditingVariant(null);
      resetForm();
      loadVariants();
    } catch (error) {
      console.error('Error updating variant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        await productVariantService.delete(id);
        loadVariants();
      } catch (error) {
        console.error('Error deleting variant:', error);
      }
    }
  };

  const handleStockUpdate = async (id: string, quantity: number, operation: 'add' | 'subtract') => {
    try {
      await productVariantService.updateStock(id, quantity, operation);
      loadVariants();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      variantCode: '',
      variantName: '',
      parentItemId: parentItemId || '',
      attributes: {},
      costPrice: 0,
      sellingPrice: 0,
      minimumStock: 0,
      maximumStock: 1000,
    });
  };

  const openEditModal = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variantCode: variant.variantCode,
      variantName: variant.variantName,
      parentItemId: variant.parentItemId,
      attributes: variant.attributes,
      sku: variant.sku,
      barcode: variant.barcode,
      costPrice: variant.costPrice,
      sellingPrice: variant.sellingPrice,
      minimumStock: variant.minimumStock,
      maximumStock: variant.maximumStock,
      weight: variant.weight,
      dimensions: variant.dimensions,
      description: variant.description,
      imageUrl: variant.imageUrl,
    });
    setShowEditModal(true);
  };

  const filteredVariants = Array.isArray(variants) ? variants.filter(variant =>
    variant.variantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variant.variantCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variant.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.currentStock <= variant.minimumStock) {
      return { status: 'low', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (variant.currentStock >= variant.maximumStock * 0.8) {
      return { status: 'high', color: 'text-green-600', bg: 'bg-green-100' };
    }
    return { status: 'normal', color: 'text-blue-600', bg: 'bg-blue-100' };
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Product Variants</h2>
          <p className="text-gray-600">Manage product variations with different attributes and pricing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Variants</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low Stock</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVariants.map((variant) => {
          const stockStatus = getStockStatus(variant);
          return (
            <div key={variant.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Variant Image */}
              <div className="h-48 bg-gray-200 relative">
                {variant.imageUrl ? (
                  <img
                    src={variant.imageUrl}
                    alt={variant.variantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.status === 'low' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {variant.currentStock} units
                  </span>
                </div>
              </div>

              {/* Variant Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{variant.variantName}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(variant)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">Code: {variant.variantCode}</p>
                {variant.sku && <p className="text-sm text-gray-600 mb-2">SKU: {variant.sku}</p>}

                {/* Attributes */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Cost: ${variant.costPrice}</p>
                    <p className="text-lg font-semibold text-green-600">${variant.sellingPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Margin</p>
                    <p className="text-sm font-semibold">
                      {((variant.sellingPrice - variant.costPrice) / variant.sellingPrice * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Stock Management */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Stock Level</span>
                    <span className="text-sm font-medium">
                      {variant.currentStock} / {variant.maximumStock}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${
                        variant.currentStock <= variant.minimumStock
                          ? 'bg-red-500'
                          : variant.currentStock >= variant.maximumStock * 0.8
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min((variant.currentStock / variant.maximumStock) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStockUpdate(variant.id, 1, 'add')}
                      className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Add
                    </button>
                    <button
                      onClick={() => handleStockUpdate(variant.id, 1, 'subtract')}
                      className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      <TrendingDown className="h-3 w-3 inline mr-1" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Barcode */}
                {variant.barcode && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Barcode: {variant.barcode}</span>
                      <QrCode className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <form onSubmit={handleCreate} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Product Variant</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Code*</label>
                  <input
                    type="text"
                    required
                    value={formData.variantCode}
                    onChange={(e) => setFormData({ ...formData, variantCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumStock || 0}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maximumStock || 1000}
                    onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <form onSubmit={handleEdit} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Product Variant</h3>
              
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Code*</label>
                  <input
                    type="text"
                    required
                    value={formData.variantCode}
                    onChange={(e) => setFormData({ ...formData, variantCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVariant(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantManager;
