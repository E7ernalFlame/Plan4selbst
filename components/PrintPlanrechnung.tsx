
import React from 'react';
import { PlanSection, LineItemType } from '../types';
import { formatNumber } from '../utils/formatting';
import { sumLineItem, calculateSectionTotal, calculateKeyFigures } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';

interface PrintPlanrechnungProps {
  sections: PlanSection[];
  clientName: string;
  analysisName: string;
}

export const PrintPlanrechnung: React.FC<PrintPlanrechnungProps> = ({ sections, clientName, analysisName }) => {
  const keyFigures = calculateKeyFigures(sections);

  // Hilfsfunktion für Zwischensummen-Zeilen
  const renderSubtotalRow = (label: string, value: number, monthlyValues: number[], colorClass: string = "bg-slate-100") => (
    <tr className={`${colorClass} font-black border-y-2 border-slate-300 no-break`}>
      <td className="print-account-num"></td>
      <td className="print-label-cell uppercase tracking-wider">{label}</td>
      <td className="print-value-cell">{formatNumber(value)}</td>
      {monthlyValues.map((v, i) => (
        <td key={i} className="print-value-cell">{formatNumber(v)}</td>
      ))}
    </tr>
  );

  return (
    <div className="print-only hidden w-full bg-white text-slate-950 p-0">
      {/* Header Bereich für jede Seite (via CSS gesteuert) */}
      <div className="mb-6 flex justify-between items-end border-b-4 border-blue-600 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-blue-600">Planerfolgsrechnung (GuV)</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            {clientName} <span className="mx-2 text-slate-300">|</span> {analysisName} <span className="mx-2 text-slate-300">|</span> Planjahr 2024
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bericht erstellt am</p>
          <p className="text-[10px] font-bold">{new Date().toLocaleDateString('de-AT')} - {new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <table className="print-table w-full">
        <thead>
          <tr>
            <th className="print-account-num">Kto.</th>
            <th className="print-label-cell">Posten / Bezeichnung</th>
            <th className="print-value-cell bg-slate-50 border-x border-slate-200">Gesamt Σ</th>
            {MONTH_NAMES.map((m, i) => (
              <th key={i} className="print-value-cell">{m.substring(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <React.Fragment key={section.id}>
              {/* Sektions-Header */}
              <tr className="print-row-section-header no-break">
                <td className="print-account-num"></td>
                <td className="print-label-cell font-black bg-slate-50">{section.label.toUpperCase()}</td>
                <td className="print-value-cell bg-slate-50 border-x border-slate-200">{formatNumber(calculateSectionTotal(section))}</td>
                {Array.from({ length: 12 }).map((_, i) => (
                  <td key={i} className="print-value-cell bg-slate-50/50">{formatNumber(calculateSectionTotal(section, i + 1))}</td>
                ))}
              </tr>

              {/* Einzelposten der Sektion */}
              {section.items.map((item) => (
                <tr key={item.id} className="no-break border-b border-slate-100">
                  <td className="print-account-num text-slate-400">{item.accountNumber || '---'}</td>
                  <td className="print-label-cell italic pl-6 text-slate-700">{item.label}</td>
                  <td className="print-value-cell font-bold border-x border-slate-100">{formatNumber(sumLineItem(item.values))}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell text-slate-500">{formatNumber(item.values[i + 1] || 0)}</td>
                  ))}
                </tr>
              ))}

              {/* Logische Zwischensummen einfügen basierend auf Sektionstyp */}
              {section.type === 'MATERIAL' && renderSubtotalRow(
                "Deckungsbeitrag 1 (Rohertrag)", 
                keyFigures.db1, 
                Array.from({ length: 12 }).map((_, i) => calculateKeyFigures(sections, i + 1).db1),
                "bg-emerald-50 text-emerald-900 border-emerald-200"
              )}

              {section.type === 'PERSONNEL' && renderSubtotalRow(
                "Deckungsbeitrag 2 (nach Personal)", 
                keyFigures.db2, 
                Array.from({ length: 12 }).map((_, i) => calculateKeyFigures(sections, i + 1).db2),
                "bg-slate-100 text-slate-900"
              )}

              {section.type === 'DEPRECIATION' && renderSubtotalRow(
                "Operatives EBITDA", 
                keyFigures.ebitda, 
                Array.from({ length: 12 }).map((_, i) => calculateKeyFigures(sections, i + 1).ebitda),
                "bg-blue-50/50 text-blue-900"
              )}

              {section.type === 'ADMIN' && renderSubtotalRow(
                "Operatives Ergebnis (EBIT)", 
                keyFigures.ebit, 
                Array.from({ length: 12 }).map((_, i) => calculateKeyFigures(sections, i + 1).ebit),
                "bg-blue-100 text-blue-900 border-blue-200"
              )}

              {section.type === 'FINANCE' && renderSubtotalRow(
                "Ergebnis der gewöhnlichen Gt. (EGT)", 
                keyFigures.egt, 
                Array.from({ length: 12 }).map((_, i) => calculateKeyFigures(sections, i + 1).egt),
                "bg-slate-800 text-white border-slate-900"
              )}
            </React.Fragment>
          ))}

          {/* Endergebnis */}
          <tr className="print-row-final no-break">
            <td className="print-account-num"></td>
            <td className="print-label-cell text-lg">NETTO-VERBLEIB (PROJ. ÜBERSCHUSS)</td>
            <td className="print-value-cell text-xl border-x border-amber-400 bg-amber-50">{formatNumber(keyFigures.result)}</td>
            {Array.from({ length: 12 }).map((_, i) => (
              <td key={i} className="print-value-cell font-black">{formatNumber(calculateKeyFigures(sections, i + 1).result)}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Fußzeile */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-[7pt] flex justify-between text-slate-400 font-bold uppercase tracking-[0.2em]">
        <div className="flex gap-4">
          <span>plan4selbst.at Professional BI</span>
          <span className="text-slate-200">|</span>
          <span>System-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
        <span>Vertraulicher Managementbericht - Seite 1 / 1</span>
      </div>
    </div>
  );
};
