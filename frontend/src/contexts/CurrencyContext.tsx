import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
  exchangeRate?: number; // Rate relative to base currency (INR)
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India', exchangeRate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States', exchangeRate: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union', exchangeRate: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom', exchangeRate: 0.009 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia', exchangeRate: 0.018 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada', exchangeRate: 0.016 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore', exchangeRate: 0.016 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates', exchangeRate: 0.044 },
];

export interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, showSymbol?: boolean, precision?: number) => string;
  convertAmount: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  getSupportedCurrencies: () => Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Get default currency from environment or fallback to INR
  const defaultCurrencyCode = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'INR';
  const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === defaultCurrencyCode) || SUPPORTED_CURRENCIES[0];
  
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(defaultCurrency);

  useEffect(() => {
    // Check for stored currency preference
    const storedCurrency = localStorage.getItem('erp_currency');
    if (storedCurrency) {
      try {
        const parsedCurrency = JSON.parse(storedCurrency);
        const supportedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === parsedCurrency.code);
        if (supportedCurrency) {
          setCurrentCurrency(supportedCurrency);
        }
      } catch (error) {
        console.error('Error parsing stored currency:', error);
      }
    }
  }, []);

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('erp_currency', JSON.stringify(currency));
  };

  const formatAmount = (amount: number, showSymbol: boolean = true, precision: number = 2): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return showSymbol ? `${currentCurrency.symbol} 0.00` : '0.00';
    
    const formattedAmount = amount.toLocaleString('en-IN', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });

    return showSymbol ? `${currentCurrency.symbol} ${formattedAmount}` : formattedAmount;
  };

  const convertAmount = (amount: number, fromCurrency: string = 'INR', toCurrency?: string): number => {
    if (isNaN(amount)) return 0;
    
    const targetCurrency = toCurrency || currentCurrency.code;
    
    if (fromCurrency === targetCurrency) return amount;

    const fromCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency);
    const toCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency);

    if (!fromCurrencyData || !toCurrencyData) return amount;

    // Convert to INR first (base currency), then to target currency
    const inrAmount = amount / (fromCurrencyData.exchangeRate || 1);
    const convertedAmount = inrAmount * (toCurrencyData.exchangeRate || 1);

    return convertedAmount;
  };

  const getSupportedCurrencies = (): Currency[] => {
    return SUPPORTED_CURRENCIES;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    formatAmount,
    convertAmount,
    getSupportedCurrencies,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
