
import { Client, Analysis } from '../types';
import { sumLineItem } from './calculations';
import { MONTH_NAMES } from '../constants';

export const generateExcelReport = (data: {
  client: Client;
  analysis: Analysis;
  selectedModules: string[];
}) => {
  const { client, analysis, selectedModules } = data;
  let csvContent = "\ufeff"; 

  if (selectedModules.includes('planrechnung')) {
    csvContent += `BERICHT: PLANRECHNUNG GUV;;\n`;
    csvContent += `Mandant:;${client.name};;\n`;
    csvContent += `Analyse:;${analysis.name};;\n\n`;
    csvContent += `Konto;Bezeichnung;Jahreswert;${MONTH_NAMES.join(';')}\n`;
    
    analysis.planData.forEach(section => {
      csvContent += `;${section.label.toUpperCase()};;${MONTH_NAMES.map(() => '').join(';')}\n`;
      section.items.forEach(item => {
        const row = [
          item.accountNumber || '',
          item.label,
          sumLineItem(item.values).toFixed(2).replace('.', ','),
          ...MONTH_NAMES.map((_, i) => (item.values[i + 1] || 0).toFixed(2).replace('.', ','))
        ];
        csvContent += row.join(';') + '\n';
      });
      csvContent += '\n';
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Export_${client.name.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const triggerPdfExport = () => {
  // Kleiner Delay hilft dem Browser, das Hidden-Div für den Druck vorzubereiten
  setTimeout(() => {
    window.print();
  }, 300);
};
