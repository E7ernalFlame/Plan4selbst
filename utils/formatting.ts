
import { DEFAULT_CURRENCY_FORMAT } from '../constants';

export const formatCurrency = (value: number): string => {
  return DEFAULT_CURRENCY_FORMAT.format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('de-AT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseLocaleNumber = (stringNumber: string): number => {
  const cleanString = stringNumber.replace(/[^0-9,-]/g, '').replace(',', '.');
  return parseFloat(cleanString) || 0;
};
