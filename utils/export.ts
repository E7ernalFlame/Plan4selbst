
import * as XLSX from 'xlsx';
import { Client, Analysis, PlanSection } from '../types';
import { sumLineItem } from './calculations';
import { MONTH_NAMES } from '../constants';

export const generateExcelReport = (data: {
  client: Client;
  analysis: Analysis;
  selectedModules: string[];
}) => {
  const { client, analysis, selectedModules } = data;
  
  if (!selectedModules.includes('planrechnung')) return;

  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [
    [`BERICHT: PLANRECHNUNG GUV - ${client.name}`],
    [`Analyse: ${analysis.name}`],
    [`Erstellt am: ${new Date().toLocaleDateString('de-AT')}`],
    [],
    ['Konto', 'Bezeichnung', 'Jahreswert Σ', ...MONTH_NAMES]
  ];

  analysis.planData.forEach(section => {
    // Sektions-Header
    wsData.push([
      '', 
      section.label.toUpperCase(), 
      '', 
      ...MONTH_NAMES.map(() => '')
    ]);

    section.items.forEach(item => {
      const row = [
        item.accountNumber || '',
        item.label,
        sumLineItem(item.values),
        ...MONTH_NAMES.map((_, i) => item.values[i + 1] || 0)
      ];
      wsData.push(row);
    });

    // Leerzeile nach Sektion
    wsData.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Spaltenbreiten definieren
  ws['!cols'] = [
    { wch: 8 },  // Konto
    { wch: 35 }, // Bezeichnung
    { wch: 15 }, // Summe
    ...MONTH_NAMES.map(() => ({ wch: 12 })) // Monate
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Planrechnung");
  
  // Datei schreiben und herunterladen
  XLSX.writeFile(wb, `Planrechnung_${client.name.replace(/\s+/g, '_')}_${analysis.name.replace(/\s+/g, '_')}.xlsx`);
};

export const triggerPdfExport = () => {
  // Wir nutzen window.print(), da das CSS in index.html optimiert wurde
  window.print();
};
