import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface CurrencyDisplayProps {
  amount: number;
  showSymbol?: boolean;
  precision?: number;
  className?: string;
  fromCurrency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'green' | 'red' | 'blue';
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  showSymbol = true,
  precision = 2,
  className = '',
  fromCurrency = 'INR',
  size = 'md',
  color = 'default'
}) => {
  const { formatAmount, convertAmount, currentCurrency } = useCurrency();

  // Convert amount if needed
  const convertedAmount = fromCurrency !== currentCurrency.code 
    ? convertAmount(amount, fromCurrency, currentCurrency.code)
    : amount;

  const formattedAmount = formatAmount(convertedAmount, showSymbol, precision);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl font-semibold'
  };

  const colorClasses = {
    default: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };

  return (
    <span className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      {formattedAmount}
    </span>
  );
};

export default CurrencyDisplay;
