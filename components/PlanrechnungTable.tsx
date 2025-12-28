
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, RotateCcw, ChevronLeft, ChevronRight as ArrowRight, FileSpreadsheet, Loader2 } from 'lucide-react';
import { PlanSection, PlanLineItem, LineItemType } from '../types';
import { formatNumber, parseLocaleNumber } from '../utils/formatting';
import { sumLineItem, calculateSectionTotal, calculateKeyFigures, distributeYearly } from '../utils/calculations';
import { exportToCSV } from '../utils/export';
import { MONTH_NAMES } from '../constants';

interface PlanrechnungTableProps {
  sections: PlanSection[];
  onUpdateSections: (sections: PlanSection[]) => void;
  clientName: string;
  year: number;
}

export const PlanrechnungTable: React.FC<PlanrechnungTableProps> = ({ sections, onUpdateSections, clientName, year }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingCell, setEditingCell] = useState<{ row: string, col: number | 'year' } | null>(null);
  
  const toggleSection = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateLineItem = (sectionId: string, itemId: string, updates: Partial<PlanLineItem>) => {
    const newSections = sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, ...updates };
        })
      };
    });
    onUpdateSections(newSections);
  };

  const addLineItem = (sectionId: string) => {
    const s = sections.find(sec => sec.id === sectionId);
    if (!s) return;
    const newItem: PlanLineItem = {
      id: `item-${Date.now()}`,
      sectionId,
      label: 'Neuer Posten',
      accountNumber: '',
      orderIndex: s.items.length,
      type: s.type === 'REVENUE' ? LineItemType.Revenue : LineItemType.Expense,
      isCustom: true,
      values: distributeYearly(0)
    };
    onUpdateSections(sections.map(sec => sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec));
  };

  const deleteLineItem = (sectionId: string, itemId: string) => {
    const newSections = sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, items: s.items.filter(i => i.id !== itemId) };
    });
    onUpdateSections(newSections);
  };

  const keyFigures = useMemo(() => calculateKeyFigures(sections), [sections]);

  const renderCell = (sectionId: string, item: PlanLineItem, col: number | 'year') => {
    const isEditing = editingCell?.row === item.id && editingCell?.col === col;
    const value = col === 'year' ? sumLineItem(item.values) : item.values[col];
    
    if (isEditing) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-white border-2 border-blue-500 outline-none px-2 text-right shadow-sm text-sm font-medium"
          defaultValue={value === 0 ? '' : formatNumber(value)}
          onBlur={(e) => {
            const num = parseLocaleNumber(e.target.value);
            if (col === 'year') updateLineItem(sectionId, item.id, { values: distributeYearly(num) });
            else updateLineItem(sectionId, item.id, { values: { ...item.values, [col]: num } });
            setEditingCell(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      );
    }

    return (
      <div 
        onClick={() => setEditingCell({ row: item.id, col })}
        className="w-full h-full flex items-center justify-end px-3 cursor-text text-sm font-medium text-slate-600 hover:bg-blue-50/50"
      >
        {formatNumber(value)}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-sm table-fixed min-w-[1600px]">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="w-[48px] sticky left-0 z-40 bg-white"></th>
              <th className="w-[320px] text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] sticky left-[48px] z-40 bg-white border-r border-slate-100">Bezeichnung / Konto</th>
              <th className="w-[140px] text-right px-4 py-3 font-black text-blue-600 uppercase tracking-widest text-[9px] bg-blue-50/10 border-r border-slate-100">Jahreswert</th>
              {MONTH_NAMES.map((name, i) => <th key={i} className="w-[110px] text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] border-r border-slate-100/30">{name}</th>)}
              <th className="w-[48px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                {/* --- Section Header Row --- */}
                <tr className="bg-slate-50/40 group/section">
                  <td className="sticky left-0 z-30 bg-white flex items-center justify-center h-10">
                    <button onClick={() => addLineItem(section.id)} className="w-6 h-6 flex items-center justify-center text-blue-600 opacity-0 group-hover/section:opacity-100 transition-all"><Plus size={14} /></button>
                  </td>
                  <td className="px-4 py-2 sticky left-[48px] z-30 bg-white border-r border-slate-100 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSection(section.id)}>{collapsed[section.id] ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}</button>
                      {section.label}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-black text-slate-900 bg-slate-100/20 border-r border-slate-100">{formatNumber(calculateSectionTotal(section))}</td>
                  {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 py-2 text-right font-bold text-slate-400 text-[12px] border-r border-slate-50">{formatNumber(calculateSectionTotal(section, i + 1))}</td>)}
                  <td className="px-2"></td>
                </tr>

                {!collapsed[section.id] && section.items.map((item) => (
                  <tr key={item.id} className="group/row hover:bg-blue-50/20 transition-colors h-9">
                    <td className="sticky left-0 z-30 bg-white group-hover/row:bg-blue-50/20 flex items-center justify-center transition-colors">
                       <button onClick={() => deleteLineItem(section.id, item.id)} className="w-6 h-6 flex items-center justify-center text-red-400 bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={12} /></button>
                    </td>
                    <td className="px-4 py-0 sticky left-[48px] z-30 bg-white group-hover/row:bg-blue-50/20 border-r border-slate-100 transition-colors">
                      <div className="flex items-center gap-2 w-full">
                        <input className="w-12 text-[9px] font-mono text-slate-400 bg-transparent border-none outline-none" defaultValue={item.accountNumber} placeholder="0000" onBlur={(e) => updateLineItem(section.id, item.id, { accountNumber: e.target.value })} />
                        <input className="flex-1 text-[13px] font-medium text-slate-600 bg-transparent border-none outline-none" defaultValue={item.label} onBlur={(e) => updateLineItem(section.id, item.id, { label: e.target.value })} />
                      </div>
                    </td>
                    <td className="border-r border-slate-50 p-0">{renderCell(section.id, item, 'year')}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className="border-r border-slate-50 p-0">{renderCell(section.id, item, i + 1)}</td>)}
                    <td className="px-2"></td>
                  </tr>
                ))}
                
                {/* --- Subtotals --- */}
                {section.type === 'MATERIAL' && (
                  <tr className="bg-emerald-50/30 font-black border-y border-emerald-100/40 h-10">
                    <td className="sticky left-0 z-30 bg-emerald-50/30"></td>
                    <td className="px-4 sticky left-[48px] z-30 bg-emerald-50/30 border-r border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">Deckungsbeitrag 1 (Marge)</td>
                    <td className="px-4 text-right text-emerald-900 border-r border-emerald-100 text-sm">{formatNumber(keyFigures.db1)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 text-right text-emerald-600 text-sm">{formatNumber(calculateKeyFigures(sections, i+1).db1)}</td>)}
                    <td></td>
                  </tr>
                )}

                {section.type === 'PERSONNEL' && (
                  <tr className="bg-slate-100/30 font-black border-y border-slate-200/40 h-10">
                    <td className="sticky left-0 z-30 bg-slate-100/30"></td>
                    <td className="px-4 sticky left-[48px] z-30 bg-slate-100/30 border-r border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700">Deckungsbeitrag 2</td>
                    <td className="px-4 text-right text-slate-900 border-r border-slate-200 text-sm">{formatNumber(keyFigures.db2)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 text-right text-slate-600 text-sm">{formatNumber(calculateKeyFigures(sections, i+1).db2)}</td>)}
                    <td></td>
                  </tr>
                )}

                {/* --- DER SPLIT NACH VERWALTUNG (OPERATIVES ERGEBNIS / EBIT) --- */}
                {section.type === 'ADMIN' && (
                  <tr className="bg-blue-600 text-white font-black h-12 shadow-sm relative z-20">
                    <td className="sticky left-0 z-30 bg-blue-600"></td>
                    <td className="px-4 sticky left-[48px] z-30 bg-blue-600 border-r border-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Operatives Ergebnis (EBIT)</td>
                    <td className="px-4 text-right font-black text-base border-r border-blue-500">{formatNumber(keyFigures.ebit)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 text-right font-black text-sm">{formatNumber(calculateKeyFigures(sections, i + 1).ebit)}</td>)}
                    <td></td>
                  </tr>
                )}

                {/* --- EGT NACH FINANZIERUNG --- */}
                {section.type === 'FINANCE' && (
                  <tr className="bg-slate-800 text-white font-black h-10">
                    <td className="sticky left-0 z-30 bg-slate-800"></td>
                    <td className="px-4 sticky left-[48px] z-30 bg-slate-800 border-r border-slate-700 text-[9px] font-black uppercase tracking-widest">Ergebnis d. gew. Geschäftstätigkeit (EGT)</td>
                    <td className="px-4 text-right border-r border-slate-700">{formatNumber(keyFigures.egt)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 text-right font-black opacity-80">{formatNumber(calculateKeyFigures(sections, i + 1).egt)}</td>)}
                    <td></td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            <tr className="bg-slate-950 text-white h-14">
              <td className="sticky left-0 z-30 bg-slate-950"></td>
              <td className="px-4 sticky left-[48px] z-30 bg-slate-950 border-r border-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Netto-Verbleib nach Steuern & Privat</td>
              <td className="px-4 text-right text-amber-400 font-black text-lg border-r border-slate-900">{formatNumber(keyFigures.result)}</td>
              {Array.from({ length: 12 }).map((_, i) => <td key={i} className="px-4 text-right font-black text-amber-400/80">{formatNumber(calculateKeyFigures(sections, i + 1).result)}</td>)}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
