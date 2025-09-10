import React, { useState, useEffect } from 'react';
import { 
  Calculator, FileCheck, DollarSign, TrendingUp, 
  Download, Upload, RefreshCw, AlertTriangle, 
  CheckCircle, Search, Filter, Calendar
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

// Types for GST Management
interface GSTCalculation {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerGSTIN: string;
  customerState: string;
  items: GSTItem[];
  totals: {
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    grandTotal: number;
  };
  transactionType: 'intra-state' | 'inter-state';
  calculatedAt: string;
}

interface GSTItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

interface GSTValidation {
  gstin: string;
  isValid: boolean;
  companyName?: string;
  address?: string;
  state?: string;
  registrationDate?: string;
  validationDate: string;
  errors?: string[];
}

interface GSTReport {
  period: string;
  totalSales: number;
  totalPurchases: number;
  totalGSTCollected: number;
  totalGSTPaid: number;
  netGSTLiability: number;
  returns: {
    gstr1: { status: string; filedDate?: string };
    gstr3b: { status: string; filedDate?: string };
  };
}

const GSTManagement: React.FC = () => {
  const { formatAmount } = useCurrency();
  
  // State management
  const [activeTab, setActiveTab] = useState<'calculator' | 'validation' | 'reconciliation' | 'reports'>('calculator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculator state
  const [calculatorData, setCalculatorData] = useState({
    customerGSTIN: '',
    customerState: '',
    companyState: 'Karnataka', // Your company's state
    items: [
      {
        description: '',
        hsnCode: '',
        quantity: 1,
        rate: 0,
        gstRate: 18
      }
    ]
  });

  // Validation state
  const [gstinToValidate, setGstinToValidate] = useState('');
  const [validationResults, setValidationResults] = useState<GSTValidation[]>([]);

  // Reports state
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [gstReports, setGstReports] = useState<GSTReport | null>(null);

  // Mock data for development
  const mockGSTRates = [
    { rate: 0, description: 'Exempt/Nil rated' },
    { rate: 5, description: 'Essential items' },
    { rate: 12, description: 'Standard items' },
    { rate: 18, description: 'Most goods/services' },
    { rate: 28, description: 'Luxury items' }
  ];

  // Calculate GST for items
  const calculateGST = () => {
    const isInterState = calculatorData.customerState !== calculatorData.companyState;
    
    const calculations = calculatorData.items.map(item => {
      const amount = item.quantity * item.rate;
      const taxAmount = (amount * item.gstRate) / 100;
      
      if (isInterState) {
        return {
          ...item,
          amount,
          cgst: 0,
          sgst: 0,
          igst: taxAmount,
          cess: 0
        };
      } else {
        return {
          ...item,
          amount,
          cgst: taxAmount / 2,
          sgst: taxAmount / 2,
          igst: 0,
          cess: 0
        };
      }
    });

    const totals = calculations.reduce((acc, item) => ({
      subtotal: acc.subtotal + item.amount,
      cgst: acc.cgst + item.cgst,
      sgst: acc.sgst + item.sgst,
      igst: acc.igst + item.igst,
      cess: acc.cess + item.cess,
      totalTax: acc.totalTax + item.cgst + item.sgst + item.igst + item.cess,
      grandTotal: acc.grandTotal + item.amount + item.cgst + item.sgst + item.igst + item.cess
    }), {
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalTax: 0,
      grandTotal: 0
    });

    return { calculations, totals, isInterState };
  };

  // Validate GSTIN
  const validateGSTIN = async (gstin: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/finance/gst/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ gstins: [gstin] })
      });

      if (response.ok) {
        const data = await response.json();
        setValidationResults(prev => [...prev, data.results[0]]);
      }
    } catch (error) {
      console.error('GSTIN validation failed:', error);
      // Mock validation for development
      setValidationResults(prev => [...prev, {
        gstin,
        isValid: gstin.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gstin),
        companyName: 'Sample Company Pvt Ltd',
        address: 'Sample Address, City, State',
        state: 'Karnataka',
        registrationDate: '2020-01-01',
        validationDate: new Date().toISOString(),
        errors: gstin.length !== 15 ? ['Invalid GSTIN length'] : undefined
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Add new item row
  const addItemRow = () => {
    setCalculatorData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        hsnCode: '',
        quantity: 1,
        rate: 0,
        gstRate: 18
      }]
    }));
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    setCalculatorData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    setCalculatorData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const { calculations, totals, isInterState } = calculateGST();

  const renderCalculatorTab = () => (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer GSTIN</label>
            <input
              type="text"
              placeholder="22AAAAA0000A1Z5"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={calculatorData.customerGSTIN}
              onChange={(e) => setCalculatorData(prev => ({ ...prev, customerGSTIN: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer State</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={calculatorData.customerState}
              onChange={(e) => setCalculatorData(prev => ({ ...prev, customerState: e.target.value }))}
            >
              <option value="">Select State</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Gujarat">Gujarat</option>
              {/* Add more states */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isInterState ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
          <button
            onClick={addItemRow}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {isInterState ? 'IGST' : 'CGST'}
                </th>
                {!isInterState && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGST</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {calculatorData.items.map((item, index) => {
                const calc = calculations[index];
                return (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Item description"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="HSN"
                        className="w-20 p-2 border border-gray-300 rounded"
                        value={item.hsnCode}
                        onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="w-16 p-2 border border-gray-300 rounded"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 p-2 border border-gray-300 rounded"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatAmount(calc.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-20 p-2 border border-gray-300 rounded"
                        value={item.gstRate}
                        onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value))}
                      >
                        {mockGSTRates.map(rate => (
                          <option key={rate.rate} value={rate.rate}>{rate.rate}%</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isInterState ? formatAmount(calc.igst) : formatAmount(calc.cgst)}
                    </td>
                    {!isInterState && (
                      <td className="px-4 py-3 text-sm">
                        {formatAmount(calc.sgst)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {calculatorData.items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Calculation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Subtotal</div>
            <div className="text-xl font-bold text-blue-900">{formatAmount(totals.subtotal)}</div>
          </div>
          
          {isInterState ? (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">IGST</div>
              <div className="text-xl font-bold text-green-900">{formatAmount(totals.igst)}</div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">CGST</div>
                <div className="text-xl font-bold text-green-900">{formatAmount(totals.cgst)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">SGST</div>
                <div className="text-xl font-bold text-green-900">{formatAmount(totals.sgst)}</div>
              </div>
            </>
          )}

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Grand Total</div>
            <div className="text-xl font-bold text-purple-900">{formatAmount(totals.grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="space-y-6">
      {/* GSTIN Validation Form */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GSTIN Validation</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter GSTIN (e.g., 22AAAAA0000A1Z5)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={gstinToValidate}
              onChange={(e) => setGstinToValidate(e.target.value.toUpperCase())}
              maxLength={15}
            />
          </div>
          <button
            onClick={() => validateGSTIN(gstinToValidate)}
            disabled={loading || gstinToValidate.length !== 15}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
            Validate
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Results</h3>
          <div className="space-y-4">
            {validationResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {result.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-mono text-lg font-semibold">{result.gstin}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    
                    {result.isValid && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Company Name:</span> {result.companyName}
                        </div>
                        <div>
                          <span className="font-medium">State:</span> {result.state}
                        </div>
                        <div>
                          <span className="font-medium">Registration Date:</span> {result.registrationDate}
                        </div>
                        <div>
                          <span className="font-medium">Validated On:</span> {new Date(result.validationDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium text-red-600">Errors:</span>
                        <ul className="list-disc list-inside mt-1 text-sm text-red-600">
                          {result.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Reports</h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
            <input
              type="month"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            />
          </div>
          <button
            onClick={() => {/* Generate report */}}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(1250000)}</p>
              <p className="text-sm text-green-600">+15% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">GST Collected</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(225000)}</p>
              <p className="text-sm text-blue-600">18% average rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Net GST Liability</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(180000)}</p>
              <p className="text-sm text-purple-600">Due by 20th</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">GSTR-1 (Sales)</h4>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Filed</span>
            </div>
            <p className="text-sm text-gray-600">Filed on: 11th Jan 2025</p>
            <p className="text-sm text-gray-600">Next due: 11th Feb 2025</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">GSTR-3B (Summary)</h4>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
            </div>
            <p className="text-sm text-gray-600">Due on: 20th Jan 2025</p>
            <p className="text-sm text-red-600">5 days remaining</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">GST Management</h2>
        <p className="text-gray-600">Calculate GST, validate GSTIN, and manage compliance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'calculator', label: 'GST Calculator', icon: Calculator },
            { id: 'validation', label: 'GSTIN Validation', icon: FileCheck },
            { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
            { id: 'reports', label: 'Reports & Compliance', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 w-5 h-5 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'calculator' && renderCalculatorTab()}
      {activeTab === 'validation' && renderValidationTab()}
      {activeTab === 'reconciliation' && (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">GST Reconciliation</h3>
          <p className="text-gray-600">Coming soon! Reconcile your GST calculations with government data.</p>
        </div>
      )}
      {activeTab === 'reports' && renderReportsTab()}
    </div>
  );
};

export default GSTManagement;
