import { useCurrency } from '../contexts/CurrencyContext';

export const useCurrencyFormat = () => {
  const { formatAmount, convertAmount, currentCurrency } = useCurrency();

  const formatINR = (amount: number, showSymbol: boolean = true, precision: number = 2) => {
    return formatAmount(convertAmount(amount, 'INR', currentCurrency.code), showSymbol, precision);
  };

  const formatUSD = (amount: number, showSymbol: boolean = true, precision: number = 2) => {
    return formatAmount(convertAmount(amount, 'USD', currentCurrency.code), showSymbol, precision);
  };

  const formatGeneric = (amount: number, fromCurrency: string = 'INR', showSymbol: boolean = true, precision: number = 2) => {
    return formatAmount(convertAmount(amount, fromCurrency, currentCurrency.code), showSymbol, precision);
  };

  return {
    formatINR,
    formatUSD,
    formatGeneric,
    formatAmount,
    convertAmount,
    currentCurrency,
  };
};
