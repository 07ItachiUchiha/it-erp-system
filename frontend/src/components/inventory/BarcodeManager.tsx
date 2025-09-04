import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Search, 
  Plus, 
  Scan,
  Download,
  Upload,
  Filter,
  Edit,
  Trash2,
  Eye,
  PrinterIcon,
  Camera,
  CheckCircle,
  XCircle,
  Package,
  Layers
} from 'lucide-react';
import { barcodeService, Barcode } from '../../services/advancedInventoryService';

const BarcodeManager: React.FC = () => {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'item' | 'variant' | 'batch' | 'serial'>('all');
  const [filterBarcodeType, setFilterBarcodeType] = useState<'all' | 'EAN13' | 'CODE128' | 'QR_CODE'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [generateForm, setGenerateForm] = useState({
    entityType: 'item' as 'item' | 'variant',
    entityId: '',
    barcodeType: 'EAN13' as string,
  });
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);

  useEffect(() => {
    loadBarcodes();
  }, []);

  const loadBarcodes = async () => {
    try {
      setLoading(true);
      const data = await barcodeService.getAll();
      setBarcodes(data);
    } catch (error) {
      console.error('Error loading barcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBarcode = await barcodeService.generate(
        generateForm.entityType,
        generateForm.entityId,
        generateForm.barcodeType
      );
      setShowGenerateModal(false);
      loadBarcodes();
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      // This would typically take selected items
      const items = [
        { id: '1', type: 'item' as const },
        { id: '2', type: 'variant' as const },
      ];
      await barcodeService.bulkGenerate(items);
      loadBarcodes();
    } catch (error) {
      console.error('Error bulk generating barcodes:', error);
    }
  };

  const handleScan = async (barcodeValue: string) => {
    try {
      const result = await barcodeService.scan(barcodeValue);
      setScanResult(result);
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setScanResult({ error: 'Barcode not found' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this barcode?')) {
      try {
        await barcodeService.delete(id);
        loadBarcodes();
      } catch (error) {
        console.error('Error deleting barcode:', error);
      }
    }
  };

  const filteredBarcodes = barcodes.filter(barcode => {
    const matchesSearch = 
      barcode.barcodeValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barcode.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || barcode.entityType === filterType;
    const matchesBarcodeType = filterBarcodeType === 'all' || barcode.barcodeType === filterBarcodeType;
    
    return matchesSearch && matchesType && matchesBarcodeType;
  });

  const getBarcodeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'EAN13': 'bg-blue-100 text-blue-800',
      'EAN8': 'bg-green-100 text-green-800',
      'UPC_A': 'bg-purple-100 text-purple-800',
      'CODE128': 'bg-orange-100 text-orange-800',
      'QR_CODE': 'bg-pink-100 text-pink-800',
      'DATA_MATRIX': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'item':
        return <Package className="h-4 w-4" />;
      case 'variant':
        return <Layers className="h-4 w-4" />;
      case 'batch':
        return <QrCode className="h-4 w-4" />;
      case 'serial':
        return <QrCode className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Barcode Management</h2>
          <p className="text-gray-600">Generate, scan, and manage barcodes for inventory items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Barcode
          </button>
          <button
            onClick={() => setShowScanModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Scan className="h-4 w-4" />
            Scan Barcode
          </button>
          <button
            onClick={handleBulkGenerate}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Bulk Generate
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
                placeholder="Search barcodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Entities</option>
            <option value="item">Items</option>
            <option value="variant">Variants</option>
            <option value="batch">Batches</option>
            <option value="serial">Serials</option>
          </select>
          <select
            value={filterBarcodeType}
            onChange={(e) => setFilterBarcodeType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="EAN13">EAN13</option>
            <option value="CODE128">CODE128</option>
            <option value="QR_CODE">QR Code</option>
          </select>
        </div>
      </div>

      {/* Barcodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBarcodes.map((barcode) => (
          <div key={barcode.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Barcode Image/Visual */}
            <div className="h-32 bg-gray-100 flex items-center justify-center relative">
              {barcode.imageUrl ? (
                <img
                  src={barcode.imageUrl}
                  alt="Barcode"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-mono">{barcode.barcodeValue}</p>
                </div>
              )}
              
              {/* Status indicators */}
              <div className="absolute top-2 right-2 flex gap-1">
                {barcode.isPrimary && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Primary
                  </span>
                )}
                {barcode.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            {/* Barcode Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getEntityIcon(barcode.entityType)}
                  <span className="text-sm font-medium capitalize">{barcode.entityType}</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 text-gray-400 hover:text-blue-500">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-500">
                    <PrinterIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(barcode.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getBarcodeTypeColor(barcode.barcodeType)}`}>
                  {barcode.barcodeType}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Value:</span>
                  <p className="font-mono text-xs break-all">{barcode.barcodeValue}</p>
                </div>
                
                {barcode.description && (
                  <div>
                    <span className="text-gray-600">Description:</span>
                    <p className="text-xs">{barcode.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span>Created:</span>
                    <p>{new Date(barcode.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span>Updated:</span>
                    <p>{new Date(barcode.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {(barcode.validFrom || barcode.validTo) && (
                  <div className="border-t pt-2 mt-2">
                    <span className="text-gray-600 text-xs">Validity:</span>
                    <p className="text-xs">
                      {barcode.validFrom && new Date(barcode.validFrom).toLocaleDateString()} - 
                      {barcode.validTo ? new Date(barcode.validTo).toLocaleDateString() : 'No expiry'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <form onSubmit={handleGenerate} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Barcode</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select
                    value={generateForm.entityType}
                    onChange={(e) => setGenerateForm({ ...generateForm, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="item">Item</option>
                    <option value="variant">Variant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
                  <input
                    type="text"
                    required
                    value={generateForm.entityId}
                    onChange={(e) => setGenerateForm({ ...generateForm, entityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item or variant ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Type</label>
                  <select
                    value={generateForm.barcodeType}
                    onChange={(e) => setGenerateForm({ ...generateForm, barcodeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EAN13">EAN13</option>
                    <option value="EAN8">EAN8</option>
                    <option value="UPC_A">UPC-A</option>
                    <option value="CODE128">CODE128</option>
                    <option value="QR_CODE">QR Code</option>
                    <option value="DATA_MATRIX">Data Matrix</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Barcode</h3>
              
              <div className="space-y-4">
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Camera view would be here</p>
                    <p className="text-sm text-gray-500">Point camera at barcode to scan</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or enter manually:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter barcode value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleScan((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter barcode value"]') as HTMLInputElement;
                        if (input.value) {
                          handleScan(input.value);
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                {scanResult && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Scan Result:</h4>
                    {scanResult.error ? (
                      <p className="text-red-600">{scanResult.error}</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Type:</span> {scanResult.entityType}</p>
                        <p><span className="font-medium">Value:</span> {scanResult.barcodeValue}</p>
                        {scanResult.description && (
                          <p><span className="font-medium">Description:</span> {scanResult.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowScanModal(false);
                    setScanResult(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeManager;
