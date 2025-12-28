
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, FileSpreadsheet, Calculator, ArrowDown, ArrowUp, Download } from 'lucide-react';
import { PlanSection, PlanLineItem, LineItemType } from '../types';
import { formatNumber, parseLocaleNumber } from '../utils/formatting';
import { sumLineItem, calculateSectionTotal, calculateKeyFigures, distributeYearly } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { ExportModal } from './ExportModal';

interface PlanrechnungTableProps {
  sections: PlanSection[];
  onUpdateSections: (sections: PlanSection[]) => void;
  clientName: string;
  year: number;
}

export const PlanrechnungTable: React.FC<PlanrechnungTableProps> = ({ sections, onUpdateSections, clientName, year }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingCell, setEditingCell] = useState<{ row: string, col: number | 'year' } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
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
        <div className="relative w-full h-full p-1">
          <input
            autoFocus
            className="w-full h-full bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-md outline-none px-2 text-right shadow-[0_0_15px_rgba(59,130,246,0.25)] text-sm font-bold dark:text-white"
            defaultValue={value === 0 ? '' : formatNumber(value)}
            onBlur={(e) => {
              const num = parseLocaleNumber(e.target.value);
              if (col === 'year') updateLineItem(sectionId, item.id, { values: distributeYearly(num) });
              else updateLineItem(sectionId, item.id, { values: { ...item.values, [col]: num } });
              setEditingCell(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </div>
      );
    }

    return (
      <div 
        onClick={() => setEditingCell({ row: item.id, col })}
        className={`w-full h-full flex items-center justify-end px-3 cursor-text text-sm font-semibold transition-colors ${
          col === 'year' 
            ? 'text-slate-900 dark:text-white font-bold' 
            : 'text-slate-500 dark:text-slate-400'
        } hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
      >
        {formatNumber(value)}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/20">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calculator size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kalkulation Aktiv</span>
           </div>
           <p className="text-[11px] text-slate-400 font-medium italic">Editieren Sie den Jahreswert für automatische Gleichverteilung.</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all shadow-sm"
        >
          <Download size={14} className="text-blue-600" /> Export Options
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-sm table-fixed min-w-[1700px]">
          <thead>
            <tr className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <th className="w-[48px] sticky left-0 z-[60] bg-white dark:bg-slate-950"></th>
              <th className="w-[340px] text-left px-6 py-4 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px] sticky left-[48px] z-[60] bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Bezeichnung / Konto</th>
              <th className="w-[150px] text-right px-6 py-4 font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] text-[9px] bg-blue-50/20 dark:bg-blue-900/10 border-r border-slate-100 dark:border-slate-800">Jahreswert</th>
              {MONTH_NAMES.map((name, i) => (
                <th key={i} className={`w-[110px] text-right px-4 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] border-r border-slate-100/30 dark:border-slate-800/30 ${i % 3 === 2 ? 'border-r-slate-300 dark:border-r-slate-600' : ''}`}>
                  {name}
                </th>
              ))}
              <th className="w-[48px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                {/* --- Section Header --- */}
                <tr className="bg-slate-50/60 dark:bg-slate-900/40 group/section border-t-2 border-slate-100 dark:border-slate-800">
                  <td className="sticky left-0 z-50 bg-slate-50 dark:bg-slate-900/40 border-r border-transparent flex items-center justify-center h-12">
                    <button onClick={() => addLineItem(section.id)} className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg opacity-0 group-hover/section:opacity-100 transition-all hover:bg-blue-600 hover:text-white shadow-sm"><Plus size={16} /></button>
                  </td>
                  <td className="px-6 py-2 sticky left-[48px] z-50 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleSection(section.id)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        {collapsed[section.id] ? <ChevronRight size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      {section.label}
                    </div>
                  </td>
                  <td className="px-6 py-2 text-right font-black text-slate-900 dark:text-white bg-slate-100/20 dark:bg-slate-800/20 border-r border-slate-100 dark:border-slate-800 text-sm">
                    {formatNumber(calculateSectionTotal(section))}
                  </td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className={`px-4 py-2 text-right font-bold text-slate-400 dark:text-slate-500 text-[11px] border-r border-slate-50 dark:border-slate-900 ${i % 3 === 2 ? 'border-r-slate-200 dark:border-r-slate-800' : ''}`}>
                      {formatNumber(calculateSectionTotal(section, i + 1))}
                    </td>
                  ))}
                  <td className="px-2"></td>
                </tr>

                {!collapsed[section.id] && section.items.map((item) => (
                  <tr key={item.id} className="group/row hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors h-11">
                    <td className="sticky left-0 z-40 bg-white dark:bg-slate-950 group-hover/row:bg-blue-50/30 dark:group-hover/row:bg-blue-900/10 flex items-center justify-center transition-colors">
                       <button onClick={() => deleteLineItem(section.id, item.id)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={12} /></button>
                    </td>
                    <td className="px-6 py-0 sticky left-[48px] z-40 bg-white dark:bg-slate-950 group-hover/row:bg-blue-50/30 dark:group-hover/row:bg-blue-900/10 border-r border-slate-100 dark:border-slate-800 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <input 
                           className="w-12 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-md px-1 py-0.5 outline-none focus:border-blue-300" 
                           defaultValue={item.accountNumber} 
                           placeholder="0000" 
                           onBlur={(e) => updateLineItem(section.id, item.id, { accountNumber: e.target.value })} 
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {item.type === LineItemType.Revenue ? <ArrowUp size={10} className="text-emerald-500" /> : <ArrowDown size={10} className="text-red-400" />}
                          <input className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none focus:text-blue-600" defaultValue={item.label} onBlur={(e) => updateLineItem(section.id, item.id, { label: e.target.value })} />
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-slate-50 dark:border-slate-900 p-0 h-11">{renderCell(section.id, item, 'year')}</td>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <td key={i} className={`border-r border-slate-50 dark:border-slate-900 p-0 h-11 ${i % 3 === 2 ? 'border-r-slate-200 dark:border-r-slate-800' : ''}`}>
                        {renderCell(section.id, item, i + 1)}
                      </td>
                    ))}
                    <td className="px-2"></td>
                  </tr>
                ))}
                
                {/* --- Subtotals --- */}
                {section.type === 'MATERIAL' && (
                  <tr className="bg-emerald-600 text-white font-black h-12 shadow-lg relative z-30">
                    <td className="sticky left-0 z-50 bg-emerald-600 border-r border-transparent"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-emerald-600 border-r border-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-white rounded-full"></div>
                        Deckungsbeitrag 1 (Marge)
                      </div>
                    </td>
                    <td className="px-6 text-right font-black text-base border-r border-emerald-500">{formatNumber(keyFigures.db1)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-bold text-xs ${i % 3 === 2 ? 'border-r border-emerald-500/50' : ''}`}>{formatNumber(calculateKeyFigures(sections, i+1).db1)}</td>)}
                    <td></td>
                  </tr>
                )}

                {section.type === 'PERSONNEL' && (
                  <tr className="bg-slate-800 text-white font-black h-12 border-y border-slate-700 relative z-20 shadow-md">
                    <td className="sticky left-0 z-50 bg-slate-800 border-r border-transparent"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-slate-800 border-r border-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        Deckungsbeitrag 2
                      </div>
                    </td>
                    <td className="px-6 text-right font-black text-base border-r border-slate-700">{formatNumber(keyFigures.db2)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-bold text-xs ${i % 3 === 2 ? 'border-r-slate-700' : ''}`}>{formatNumber(calculateKeyFigures(sections, i+1).db2)}</td>)}
                    <td></td>
                  </tr>
                )}

                {section.type === 'ADMIN' && (
                  <tr className="bg-blue-700 text-white font-black h-14 relative z-30 shadow-xl border-y border-blue-600">
                    <td className="sticky left-0 z-50 bg-blue-700 border-r border-transparent h-14"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-blue-700 border-r border-blue-600 text-[10px] font-black uppercase tracking-[0.3em] h-14">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-5 bg-white rounded-sm"></div>
                        Operatives Ergebnis (EBIT)
                      </div>
                    </td>
                    <td className="px-6 text-right font-black text-xl border-r border-blue-600">{formatNumber(keyFigures.ebit)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-black text-sm ${i % 3 === 2 ? 'border-r-blue-600' : ''}`}>{formatNumber(calculateKeyFigures(sections, i + 1).ebit)}</td>)}
                    <td></td>
                  </tr>
                )}

                {section.type === 'FINANCE' && (
                  <tr className="bg-slate-900 text-slate-300 font-black h-12 border-y border-slate-800 relative z-20">
                    <td className="sticky left-0 z-50 bg-slate-900 border-r border-transparent h-12"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-slate-900 border-r border-slate-800 text-[9px] font-black uppercase tracking-[0.2em] h-12">Ergebnis d. gew. Geschäftstätigkeit (EGT)</td>
                    <td className="px-6 text-right border-r border-slate-800 text-white text-lg">{formatNumber(keyFigures.egt)}</td>
                    {Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-black opacity-80 ${i % 3 === 2 ? 'border-r border-slate-800' : ''}`}>{formatNumber(calculateKeyFigures(sections, i + 1).egt)}</td>)}
                    <td></td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* --- GRAND TOTAL --- */}
            <tr className="bg-slate-950 text-white h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t-4 border-amber-500/50 relative z-40">
              <td className="sticky left-0 z-50 bg-slate-950 border-r border-transparent h-20"></td>
              <td className="px-6 sticky left-[48px] z-50 bg-slate-950 border-r border-slate-900 text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 h-20">
                <div className="flex flex-col justify-center h-full">
                  <span>Netto-Verbleib</span>
                  <span className="text-[8px] opacity-40 mt-1 tracking-widest text-white normal-case font-bold">Nach Steuern & Privat</span>
                </div>
              </td>
              <td className="px-6 text-right text-amber-400 font-black text-2xl border-r border-slate-900 border-double border-b-4 border-amber-500/20">{formatNumber(keyFigures.result)}</td>
              {Array.from({ length: 12 }).map((_, i) => (
                <td key={i} className={`px-4 text-right font-black text-amber-400/80 text-base ${i % 3 === 2 ? 'border-r border-slate-800' : ''}`}>
                  {formatNumber(calculateKeyFigures(sections, i + 1).result)}
                </td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        clientName={clientName}
        initialModuleId="planrechnung"
      />
    </div>
  );
};
