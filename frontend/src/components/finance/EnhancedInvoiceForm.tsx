import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, FileText, Truck } from 'lucide-react';
import { Invoice, GSTCalculationRequest, financeService } from '../../services/financeService';
import AddressSection from './AddressSection';
import GSTBreakdown from './GSTBreakdown';

interface EnhancedInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  invoice?: Invoice | null;
}

const EnhancedInvoiceForm: React.FC<EnhancedInvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice
}) => {
  // Basic invoice fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  // Enhanced fields
  const [billToName, setBillToName] = useState('');
  const [billToAddress, setBillToAddress] = useState('');
  const [billToGSTIN, setBillToGSTIN] = useState('');
  
  const [shipToName, setShipToName] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [shipToGSTIN, setShipToGSTIN] = useState('');
  
  const [shippingCharges, setShippingCharges] = useState('');
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState('18');
  
  // GST calculation states
  const [gstBreakup, setGstBreakup] = useState<any>(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);

  // Form states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy Bill To to Ship To functionality
  const [copyToShipTo, setCopyToShipTo] = useState(false);

  // Initialize form data when invoice prop changes
  useEffect(() => {
    if (invoice) {
      setClientName(invoice.clientName || '');
      setClientEmail(invoice.clientEmail || '');
      setAmount(invoice.amount?.toString() || '');
      setDueDate(invoice.dueDate || '');
      setStatus(invoice.status || 'pending');
      setNotes(invoice.notes || '');
      
      // Enhanced fields
      setBillToName(invoice.billToName || '');
      setBillToAddress(invoice.billToAddress || '');
      setBillToGSTIN(invoice.billToGSTIN || '');
      setShipToName(invoice.shipToName || '');
      setShipToAddress(invoice.shipToAddress || '');
      setShipToGSTIN(invoice.shipToGSTIN || '');
      setShippingCharges(invoice.shippingCharges?.toString() || '');
      setIsTaxEnabled(invoice.isTaxOptional !== false);
      setTaxRate(invoice.taxRate?.toString() || '18');
      setGstBreakup(invoice.gstBreakup || null);
      setCalculatedTotal(invoice.calculatedTotal || 0);
    } else {
      resetForm();
    }
  }, [invoice]);

  // Copy Bill To to Ship To
  useEffect(() => {
    if (copyToShipTo) {
      setShipToName(billToName);
      setShipToAddress(billToAddress);
      setShipToGSTIN(billToGSTIN);
    }
  }, [copyToShipTo, billToName, billToAddress, billToGSTIN]);

  // Auto-calculate GST when relevant fields change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isTaxEnabled && amount && billToGSTIN && parseFloat(amount) > 0) {
        calculateGST();
      } else {
        setGstBreakup(null);
        setCalculatedTotal(parseFloat(amount || '0') + parseFloat(shippingCharges || '0'));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [amount, shippingCharges, taxRate, isTaxEnabled, billToGSTIN, shipToGSTIN]);

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setAmount('');
    setDueDate('');
    setStatus('pending');
    setNotes('');
    setBillToName('');
    setBillToAddress('');
    setBillToGSTIN('');
    setShipToName('');
    setShipToAddress('');
    setShipToGSTIN('');
    setShippingCharges('');
    setIsTaxEnabled(true);
    setTaxRate('18');
    setGstBreakup(null);
    setCalculatedTotal(0);
    setShowGstBreakdown(false);
    setCopyToShipTo(false);
    setErrors({});
  };

  const calculateGST = async () => {
    if (!isTaxEnabled || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsCalculating(true);
    try {
      const request: GSTCalculationRequest = {
        billToState: extractStateFromGSTIN(billToGSTIN) || 'Unknown',
        shipToState: extractStateFromGSTIN(shipToGSTIN) || extractStateFromGSTIN(billToGSTIN) || 'Unknown',
        subtotal: parseFloat(amount),
        shippingCharges: parseFloat(shippingCharges || '0'),
        taxRate: parseFloat(taxRate),
      };

      const result = await financeService.calculateGST(request);
      setGstBreakup(result.gstBreakup);
      setCalculatedTotal(result.grandTotal);
      setShowGstBreakdown(true);
    } catch (error) {
      console.error('GST calculation failed:', error);
      setGstBreakup(null);
      setCalculatedTotal(parseFloat(amount) + parseFloat(shippingCharges || '0'));
    } finally {
      setIsCalculating(false);
    }
  };

  // Helper function to extract state from GSTIN
  const extractStateFromGSTIN = (gstin?: string): string | null => {
    if (!gstin || gstin.length < 2) return null;
    const stateCode = gstin.substring(0, 2);
    
    // Map of state codes to state names (partial list for common states)
    const stateCodes: Record<string, string> = {
      '01': 'Jammu and Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '25': 'Daman and Diu',
      '26': 'Dadra and Nagar Haveli',
      '27': 'Maharashtra',
      '28': 'Andhra Pradesh',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman and Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh',
    };
    
    return stateCodes[stateCode] || 'Unknown';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    if (!billToName.trim()) newErrors.billToName = 'Bill to name is required';
    if (!billToAddress.trim()) newErrors.billToAddress = 'Bill to address is required';

    // GSTIN validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (billToGSTIN && !gstinRegex.test(billToGSTIN)) {
      newErrors.billToGSTIN = 'Invalid GSTIN format';
    }
    if (shipToGSTIN && !gstinRegex.test(shipToGSTIN)) {
      newErrors.shipToGSTIN = 'Invalid GSTIN format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber: invoice?.invoiceNumber || '', // Will be auto-generated by backend
        clientName,
        clientEmail: clientEmail || undefined,
        amount: parseFloat(amount),
        dueDate,
        status,
        notes: notes || undefined,
        
        // Enhanced fields
        billToName,
        billToAddress,
        billToGSTIN: billToGSTIN || undefined,
        shipToName: shipToName || undefined,
        shipToAddress: shipToAddress || undefined,
        shipToGSTIN: shipToGSTIN || undefined,
        subtotal: parseFloat(amount),
        shippingCharges: parseFloat(shippingCharges || '0'),
        taxRate: isTaxEnabled ? parseFloat(taxRate) : undefined,
        isTaxOptional: !isTaxEnabled,
        gstBreakup: gstBreakup || undefined,
        calculatedTotal: calculatedTotal > 0 ? calculatedTotal : parseFloat(amount) + parseFloat(shippingCharges || '0'),
      };

      await onSubmit(invoiceData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Invoice Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.clientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter client name"
              />
              {errors.clientName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Truck className="w-4 h-4 mr-1" />
                Shipping Charges (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCharges}
                onChange={(e) => setShippingCharges(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Tax Configuration */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Tax Configuration (India GST)
            </h4>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isTaxEnabled}
                  onChange={(e) => setIsTaxEnabled(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable GST Calculation
                </span>
              </label>

              {isTaxEnabled && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tax Rate (%):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {isTaxEnabled && (
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={calculateGST}
                  disabled={isCalculating || !amount || parseFloat(amount) <= 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? 'Calculating...' : 'Calculate GST'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                >
                  {showGstBreakdown ? 'Hide' : 'Show'} Tax Breakdown
                </button>
              </div>
            )}
          </div>

          {/* Address Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bill To Section */}
            <AddressSection
              title="Bill To"
              name={billToName}
              address={billToAddress}
              gstin={billToGSTIN}
              onNameChange={setBillToName}
              onAddressChange={setBillToAddress}
              onGstinChange={setBillToGSTIN}
              className={errors.billToName || errors.billToAddress || errors.billToGSTIN ? 'border-red-300' : ''}
            />

            {/* Ship To Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={copyToShipTo}
                    onChange={(e) => setCopyToShipTo(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Same as Bill To
                  </span>
                </label>
              </div>

              <AddressSection
                title="Ship To"
                name={shipToName}
                address={shipToAddress}
                gstin={shipToGSTIN}
                onNameChange={setShipToName}
                onAddressChange={setShipToAddress}
                onGstinChange={setShipToGSTIN}
                className={errors.shipToGSTIN ? 'border-red-300' : ''}
              />
            </div>
          </div>

          {/* GST Breakdown */}
          {showGstBreakdown && isTaxEnabled && (
            <GSTBreakdown
              gstBreakup={gstBreakup}
              subtotal={parseFloat(amount || '0')}
              shippingCharges={parseFloat(shippingCharges || '0')}
              total={calculatedTotal}
              isVisible={true}
            />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {invoice ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {invoice ? 'Update Invoice' : 'Create Invoice'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedInvoiceForm;
