
import React from 'react';
import { PlanSection, SectionType } from '../types';
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

  const getMonthTotalForSection = (section: PlanSection, month: number) => {
    return calculateSectionTotal(section, month);
  };

  const getMonthKeyFigure = (month: number) => {
    return calculateKeyFigures(sections, month);
  };

  return (
    <div className="print-only hidden">
      <div className="mb-6 flex justify-between items-end border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase">Planerfolgsrechnung (GuV) 2024</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{clientName} | {analysisName}</p>
        </div>
        <div className="text-right text-[8px] font-bold text-slate-400 uppercase tracking-widest">
          Währung: EUR | Alle Werte exkl. USt.
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th className="print-account-num">Kto.</th>
            <th className="print-label-cell w-[180px]">Bezeichnung</th>
            <th className="print-value-cell bg-slate-100/50">Gesamt/J</th>
            {MONTH_NAMES.map((m, i) => (
              <th key={i} className="print-value-cell">{m.substring(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <React.Fragment key={section.id}>
              {/* Sektions-Header */}
              <tr className="print-row-section-header">
                <td className="print-account-num"></td>
                <td className="print-label-cell">{section.label}</td>
                <td className="print-value-cell">{formatNumber(calculateSectionTotal(section))}</td>
                {Array.from({ length: 12 }).map((_, i) => (
                  <td key={i} className="print-value-cell">{formatNumber(calculateSectionTotal(section, i + 1))}</td>
                ))}
              </tr>

              {/* Einzelposten */}
              {section.items.map((item) => (
                <tr key={item.id}>
                  <td className="print-account-num">{item.accountNumber}</td>
                  <td className="print-label-cell pl-4">{item.label}</td>
                  <td className="print-value-cell font-bold">{formatNumber(sumLineItem(item.values))}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell">{formatNumber(item.values[i + 1] || 0)}</td>
                  ))}
                </tr>
              ))}

              {/* Zwischensummen & Kennzahlen-Integration */}
              {section.type === 'MATERIAL' && (
                <tr className="print-row-highlight-emerald">
                  <td className="print-account-num"></td>
                  <td className="print-label-cell">DECKUNGSBEITRAG 1 (MARGE)</td>
                  <td className="print-value-cell">{formatNumber(keyFigures.db1)}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell">{formatNumber(getMonthKeyFigure(i + 1).db1)}</td>
                  ))}
                </tr>
              )}

              {section.type === 'PERSONNEL' && (
                <tr className="print-row-subtotal">
                  <td className="print-account-num"></td>
                  <td className="print-label-cell">DECKUNGSBEITRAG 2</td>
                  <td className="print-value-cell">{formatNumber(keyFigures.db2)}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell">{formatNumber(getMonthKeyFigure(i + 1).db2)}</td>
                  ))}
                </tr>
              )}

              {section.type === 'ADMIN' && (
                <tr className="print-row-highlight-blue">
                  <td className="print-account-num"></td>
                  <td className="print-label-cell">OPERATIVES ERGEBNIS (EBIT)</td>
                  <td className="print-value-cell">{formatNumber(keyFigures.ebit)}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell">{formatNumber(getMonthKeyFigure(i + 1).ebit)}</td>
                  ))}
                </tr>
              )}

              {section.type === 'FINANCE' && (
                <tr className="print-row-subtotal">
                  <td className="print-account-num"></td>
                  <td className="print-label-cell">ERGEBNIS D. GEW. GESCHÄFTSTÄTIGKEIT (EGT)</td>
                  <td className="print-value-cell">{formatNumber(keyFigures.egt)}</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="print-value-cell">{formatNumber(getMonthKeyFigure(i + 1).egt)}</td>
                  ))}
                </tr>
              )}
            </React.Fragment>
          ))}

          {/* Endergebnis */}
          <tr className="print-row-final">
            <td className="print-account-num"></td>
            <td className="print-label-cell">NETTO-VERBLEIB (NACH STEUERN & PRIVAT)</td>
            <td className="print-value-cell">{formatNumber(keyFigures.result)}</td>
            {Array.from({ length: 12 }).map((_, i) => (
              <td key={i} className="print-value-cell">{formatNumber(getMonthKeyFigure(i + 1).result)}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-12 pt-4 border-t border-slate-200 text-[6pt] flex justify-between text-slate-400 font-bold uppercase tracking-widest">
        <span>Erstellt mit plan4selbst.at | Business Intelligence for SMEs</span>
        <span>Seite 2 / 2</span>
      </div>
    </div>
  );
};
