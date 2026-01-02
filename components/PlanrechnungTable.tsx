
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, FileSpreadsheet, Calculator, ArrowDown, ArrowUp, Download, Zap, Printer, Columns } from 'lucide-react';
import { PlanSection, PlanLineItem, LineItemType, SectionType } from '../types';
import { formatNumber, parseLocaleNumber } from '../utils/formatting';
import { sumLineItem, calculateSectionTotal, calculateKeyFigures, distributeYearly, scaleProportionally } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { triggerPdfExport, generateExcelReport } from '../utils/export';

interface PlanrechnungTableProps {
  sections: PlanSection[];
  onUpdateSections: (sections: PlanSection[]) => void;
  clientName: string;
  year: number;
}

export const PlanrechnungTable: React.FC<PlanrechnungTableProps> = ({ sections, onUpdateSections, clientName, year }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showMonths, setShowMonths] = useState(true);
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

  const handleFullPrint = () => {
    triggerPdfExport();
  };

  const handleExcelExport = () => {
    const mockAnalysis: any = {
      name: 'Direkt-Export',
      planData: sections
    };
    generateExcelReport({
      client: { name: clientName } as any,
      analysis: mockAnalysis,
      selectedModules: ['planrechnung']
    });
  };

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
              if (col === 'year') {
                const newValues = scaleProportionally(num, item.values);
                updateLineItem(sectionId, item.id, { values: newValues });
              } else {
                updateLineItem(sectionId, item.id, { values: { ...item.values, [col]: num } });
              }
              setEditingCell(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setEditingCell(null);
            }}
          />
        </div>
      );
    }

    return (
      <div 
        onClick={() => setEditingCell({ row: item.id, col })}
        className={`w-full h-full flex items-center justify-end px-3 cursor-text text-sm font-semibold transition-all ${
          col === 'year' 
            ? 'text-slate-900 dark:text-white font-black bg-blue-50/10 dark:bg-blue-900/5' 
            : 'text-slate-500 dark:text-slate-400'
        } hover:bg-blue-50/50 dark:hover:bg-blue-900/20`}
      >
        {formatNumber(value)}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300 print:shadow-none print:border-none print:rounded-none">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 dark:bg-slate-900/20 print:hidden gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calculator size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Planungsmodus Aktiv</span>
           </div>
           <p className="hidden lg:block text-[11px] text-slate-400 font-medium italic">
             Gesamtjahr ändern skaliert Monate proportional.
           </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setShowMonths(!showMonths)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              showMonths 
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50' 
                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Columns size={14} /> {showMonths ? 'Monate ausblenden' : 'Detailansicht'}
          </button>
          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button 
            onClick={handleFullPrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
          >
            <Printer size={14} /> Druck/PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
        <table className={`w-full border-collapse text-sm table-fixed ${showMonths ? 'min-w-[1700px]' : 'min-w-full'} print:min-w-full transition-all duration-500`}>
          <thead>
            <tr className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 print:bg-slate-50">
              <th className="w-[48px] sticky left-0 z-[60] bg-white dark:bg-slate-950 print:bg-slate-50 print:static"></th>
              <th className={`${showMonths ? 'w-[340px]' : 'w-auto'} text-left px-6 py-4 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px] sticky left-[48px] z-[60] bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)] print:static print:shadow-none print:w-auto`}>Bezeichnung / Konto</th>
              <th className={`${showMonths ? 'w-[150px]' : 'w-64'} text-right px-6 py-4 font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] text-[9px] bg-blue-50/20 dark:bg-blue-900/10 border-r border-slate-100 dark:border-slate-800`}>Jahreswert Σ</th>
              {showMonths && MONTH_NAMES.map((name, i) => (
                <th key={i} className={`w-[110px] text-right px-4 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] border-r border-slate-100/30 dark:border-slate-800/30 ${i % 3 === 2 ? 'border-r-slate-300 dark:border-r-slate-600' : ''}`}>
                  {name}
                </th>
              ))}
              <th className="w-[48px] print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                <tr className="bg-slate-50/60 dark:bg-slate-900/40 group/section border-t-2 border-slate-100 dark:border-slate-800 print:bg-slate-100">
                  <td className="sticky left-0 z-50 bg-slate-50 dark:bg-slate-900/40 border-r border-transparent flex items-center justify-center h-12 print:static">
                    <button onClick={() => addLineItem(section.id)} className="w-7 h-7 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg opacity-0 group-hover/section:opacity-100 transition-all hover:bg-blue-600 hover:text-white shadow-sm print:hidden"><Plus size={16} /></button>
                  </td>
                  <td className="px-6 py-2 sticky left-[48px] z-50 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-[0.1em] print:static">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleSection(section.id)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors print:hidden"
                      >
                        {collapsed[section.id] ? <ChevronRight size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      {section.label}
                    </div>
                  </td>
                  <td className="px-6 py-2 text-right font-black text-slate-900 dark:text-white bg-slate-100/20 dark:bg-slate-800/20 border-r border-slate-100 dark:border-slate-800 text-sm">
                    {formatNumber(calculateSectionTotal(section))}
                  </td>
                  {showMonths && Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className={`px-4 py-2 text-right font-bold text-slate-400 dark:text-slate-500 text-[11px] border-r border-slate-50 dark:border-slate-900 ${i % 3 === 2 ? 'border-r-slate-200 dark:border-r-slate-800' : ''}`}>
                      {formatNumber(calculateSectionTotal(section, i + 1))}
                    </td>
                  ))}
                  <td className="px-2 print:hidden"></td>
                </tr>

                {!collapsed[section.id] && section.items.map((item) => (
                  <tr key={item.id} className="group/row hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors h-11 no-break">
                    <td className="sticky left-0 z-40 bg-white dark:bg-slate-950 group-hover/row:bg-blue-50/30 dark:group-hover/row:bg-blue-900/10 flex items-center justify-center transition-colors print:static">
                       <button onClick={() => deleteLineItem(section.id, item.id)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-0 group-hover/row:opacity-100 transition-all print:hidden"><Trash2 size={12} /></button>
                    </td>
                    <td className="px-6 py-0 sticky left-[48px] z-40 bg-white dark:bg-slate-950 group-hover/row:bg-blue-50/30 dark:group-hover/row:bg-blue-900/10 border-r border-slate-100 dark:border-slate-800 transition-colors print:static">
                      <div className="flex items-center gap-3 w-full">
                        <span className="w-10 text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.accountNumber || '----'}</span>
                        <div className="flex items-center gap-2 flex-1">
                          {item.type === LineItemType.Revenue ? <ArrowUp size={10} className="text-emerald-500 print:hidden" /> : <ArrowDown size={10} className="text-red-400 print:hidden" />}
                          <span className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-slate-50 dark:border-slate-900 p-0 h-11">{renderCell(section.id, item, 'year')}</td>
                    {showMonths && Array.from({ length: 12 }).map((_, i) => (
                      <td key={i} className={`border-r border-slate-50 dark:border-slate-900 p-0 h-11 ${i % 3 === 2 ? 'border-r-slate-200 dark:border-r-slate-800' : ''}`}>
                        {renderCell(section.id, item, i + 1)}
                      </td>
                    ))}
                    <td className="px-2 print:hidden"></td>
                  </tr>
                ))}
                
                {section.type === 'MATERIAL' && (
                  <tr className="bg-emerald-600 text-white font-black h-12 shadow-lg relative z-30 print:bg-emerald-50 print:text-emerald-900 print:shadow-none">
                    <td className="sticky left-0 z-50 bg-emerald-600 border-r border-transparent print:static print:bg-emerald-50"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-emerald-600 border-r border-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] print:static print:bg-emerald-50">
                      Deckungsbeitrag 1 (Marge)
                    </td>
                    <td className="px-6 text-right font-black text-base border-r border-emerald-500">{formatNumber(keyFigures.db1)}</td>
                    {showMonths && Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-bold text-xs ${i % 3 === 2 ? 'border-r-emerald-500/50' : ''}`}>{formatNumber(calculateKeyFigures(sections, i+1).db1)}</td>)}
                    <td className="print:hidden"></td>
                  </tr>
                )}

                {section.type === 'PERSONNEL' && (
                  <tr className="bg-slate-800 text-white font-black h-12 border-y border-slate-700 relative z-20 shadow-md print:bg-slate-100 print:text-slate-900 print:shadow-none">
                    <td className="sticky left-0 z-50 bg-slate-800 border-r border-transparent h-12 print:static print:bg-slate-100"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-slate-800 border-r border-slate-700 text-[10px] font-black uppercase tracking-[0.2em] print:static print:bg-slate-100">
                      Deckungsbeitrag 2
                    </td>
                    <td className="px-6 text-right font-black text-base border-r border-slate-700">{formatNumber(keyFigures.db2)}</td>
                    {showMonths && Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-bold text-xs ${i % 3 === 2 ? 'border-r-slate-700' : ''}`}>{formatNumber(calculateKeyFigures(sections, i+1).db2)}</td>)}
                    <td className="print:hidden"></td>
                  </tr>
                )}

                {section.type === 'ADMIN' && (
                  <tr className="bg-blue-700 text-white font-black h-14 relative z-30 shadow-xl border-y border-blue-600 print:bg-blue-50 print:text-blue-900 print:shadow-none">
                    <td className="sticky left-0 z-50 bg-blue-700 border-r border-transparent h-14 print:static print:bg-blue-50"></td>
                    <td className="px-6 sticky left-[48px] z-50 bg-blue-700 border-r border-blue-600 text-[10px] font-black uppercase tracking-[0.3em] print:static print:bg-blue-50">
                      Operatives Ergebnis (EBIT)
                    </td>
                    <td className="px-6 text-right font-black text-xl border-r border-blue-600">{formatNumber(keyFigures.ebit)}</td>
                    {showMonths && Array.from({ length: 12 }).map((_, i) => <td key={i} className={`px-4 text-right font-black text-sm ${i % 3 === 2 ? 'border-r-blue-600' : ''}`}>{formatNumber(calculateKeyFigures(sections, i + 1).ebit)}</td>)}
                    <td className="print:hidden"></td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            <tr className="bg-slate-950 text-white h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t-4 border-amber-500/50 relative z-40 print:bg-amber-100 print:text-amber-950 print:shadow-none">
              <td className="sticky left-0 z-50 bg-slate-950 border-r border-transparent h-20 print:static print:bg-amber-100"></td>
              <td className="px-6 sticky left-[48px] z-50 bg-slate-950 border-r border-slate-900 text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 h-20 print:static print:bg-amber-100">
                Netto-Verbleib
              </td>
              <td className="px-6 text-right text-amber-400 font-black text-2xl border-r border-slate-900 print:text-amber-900">{formatNumber(keyFigures.result)}</td>
              {showMonths && Array.from({ length: 12 }).map((_, i) => (
                <td key={i} className={`px-4 text-right font-black text-amber-400/80 text-base ${i % 3 === 2 ? 'border-r-slate-800' : ''} print:text-amber-800`}>
                  {formatNumber(calculateKeyFigures(sections, i + 1).result)}
                </td>
              ))}
              <td className="print:hidden"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
