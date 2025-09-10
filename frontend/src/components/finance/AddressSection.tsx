import React from 'react';

interface AddressSectionProps {
  title: string;
  name: string;
  address: string;
  gstin?: string;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onGstinChange: (value: string) => void;
  className?: string;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  title,
  name,
  address,
  gstin,
  onNameChange,
  onAddressChange,
  onGstinChange,
  className = ''
}) => {
  const validateGSTIN = (value: string): boolean => {
    if (!value) return true; // Optional field
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(value);
  };

  const isGstinValid = validateGSTIN(gstin || '');

  return (
    <div className={`space-y-4 p-4 border border-gray-200 rounded-lg ${className}`}>
      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        {title}
      </h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name/Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter name or company name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          placeholder="Enter complete address with city, state, PIN code"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GSTIN (Optional)
        </label>
        <input
          type="text"
          value={gstin || ''}
          onChange={(e) => onGstinChange(e.target.value.toUpperCase())}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
            gstin && !isGstinValid 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
        />
        {gstin && !isGstinValid && (
          <p className="text-red-500 text-xs mt-1">
            Please enter a valid GSTIN (15 characters: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit/letter, Z, 1 digit/letter)
          </p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          Format: State Code (2) + PAN (10) + Entity Number (1) + Check Code (1) + Default Z (1)
        </p>
      </div>
    </div>
  );
};

export default AddressSection;
