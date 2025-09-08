import React, { useState } from 'react';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useCurrency, Currency } from '../../contexts/CurrencyContext';

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  className = '',
  showLabel = true 
}) => {
  const { currentCurrency, setCurrency, getSupportedCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const supportedCurrencies = getSupportedCurrencies();

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <div className="flex items-center">
            <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="font-medium">{currentCurrency.symbol}</span>
            <span className="ml-2 text-gray-500">{currentCurrency.code}</span>
            <span className="ml-2 text-sm text-gray-400 hidden sm:block">
              {currentCurrency.name}
            </span>
          </div>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {supportedCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency)}
                className={`${
                  currency.code === currentCurrency.code
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-100'
                } relative cursor-pointer select-none py-2 pl-3 pr-9 w-full text-left`}
              >
                <div className="flex items-center">
                  <span className="font-medium text-lg mr-3">{currency.symbol}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-xs text-gray-500">{currency.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto hidden sm:block">
                    {currency.country}
                  </span>
                </div>
                
                {currency.code === currentCurrency.code && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencySelector;
