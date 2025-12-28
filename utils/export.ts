
import { PlanSection, PlanLineItem } from '../types';
import { MONTH_NAMES } from '../constants';
import { sumLineItem } from './calculations';

export const exportToCSV = (sections: PlanSection[], clientName: string, year: number) => {
  const headers = ['Konto', 'Bezeichnung', 'Jahreswert', ...MONTH_NAMES];
  const rows: string[][] = [headers];

  sections.forEach(section => {
    // Section Header row
    rows.push(['', section.label.toUpperCase(), '', ...MONTH_NAMES.map(() => '')]);

    section.items.forEach(item => {
      const row = [
        item.accountNumber || '',
        item.label,
        sumLineItem(item.values).toFixed(2),
        ...MONTH_NAMES.map((_, i) => (item.values[i + 1] || 0).toFixed(2))
      ];
      rows.push(row);
    });

    // Add empty row for spacing
    rows.push(['', '', '', ...MONTH_NAMES.map(() => '')]);
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.join(";")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `plan4selbst_${clientName.replace(/\s+/g, '_')}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
