
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  Save, 
  Download,
  Info,
  Briefcase,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { PersonnelResourceItem } from '../types';
import { formatNumber, formatCurrency } from '../utils/formatting';

export const PersonnelResourcePlanningView: React.FC = () => {
  const [lastEditDate] = useState('06.11.2024');
  const [items, setItems] = useState<PersonnelResourceItem[]>([
    { 
      id: '1', name: 'Unternehmer', year: 2024, 
      totalHoursYear: 2080, presentHours: 1680, productivityPercent: 85,
      internalPercent: 40, billablePercent: 60, totalCostYear: 120000
    },
    { 
      id: '2', name: 'Mitarbeiter DN1', year: 2024, 
      totalHoursYear: 1920, presentHours: 1540, productivityPercent: 75,
      internalPercent: 20, billablePercent: 80, totalCostYear: 58000
    },
    { 
      id: '3', name: 'Mitarbeiter DN2', year: 2024, 
      totalHoursYear: 1920, presentHours: 1540, productivityPercent: 70,
      internalPercent: 30, billablePercent: 70, totalCostYear: 52000
    }
  ]);

  const updateItem = (id: string, updates: Partial<PersonnelResourceItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: 'Neuer Mitarbeiter',
      year: 2024,
      totalHoursYear: 1920,
      presentHours: 1540,
      productivityPercent: 80,
      internalPercent: 20,
      billablePercent: 80,
      totalCostYear: 50000
    }]);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculatedData = useMemo(() => {
    return items.map(item => {
      const availableHours = item.presentHours * (item.productivityPercent / 100);
      const euroPerAvailableHour = availableHours > 0 ? item.totalCostYear / availableHours : 0;
      
      const internalHours = availableHours * (item.internalPercent / 100);
      const billableHours = availableHours * (item.billablePercent / 100);
      
      const internalCosts = item.totalCostYear * (item.internalPercent / 100);
      const billableCosts = item.totalCostYear * (item.billablePercent / 100);

      return {
        ...item,
        availableHours,
        euroPerAvailableHour,
        internalHours,
        billableHours,
        internalCosts,
        billableCosts
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    return calculatedData.reduce((acc, curr) => ({
      hours: acc.hours + curr.availableHours,
      billable: acc.billable + curr.billableHours,
      costs: acc.costs + curr.totalCostYear,
      billableCosts: acc.billableCosts + curr.billableCosts
    }), { hours: 0, billable: 0, costs: 0, billableCosts: 0 });
  }, [calculatedData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Personaleinsatzplanung
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase tracking-widest font-black">Beta</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bearbeitet am: <span className="text-blue-600 font-bold">{lastEditDate}</span></p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all">
            <Save size={16} /> Übernahme in Umsatzplanung
          </button>
          <button onClick={addItem} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 transition-all">
            <Plus size={16} /> Zeile hinzufügen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verfügbare Kapazität</p>
          <h4 className="text-2xl font-black text-blue-600">{formatNumber(totals.hours)} Std.</h4>
          <p className="text-[10px] text-slate-400 mt-2 italic">Netto nach Produktivitätsfaktor</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verrechenbares Potenzial</p>
          <h4 className="text-2xl font-black text-emerald-600">{formatNumber(totals.billable)} Std.</h4>
          <p className="text-[10px] text-slate-400 mt-2 italic">Direkte Mandanten-Leistung</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direkte Personalkosten</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totals.billableCosts)}</h4>
          <p className="text-[10px] text-slate-400 mt-2 italic">Anteilig verrechenbar</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs min-w-[1600px]">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                <th colSpan={7} className="bg-slate-500 py-3 text-center border-r border-white/10">Basis-Leistungsdaten</th>
                <th colSpan={2} className="bg-blue-600 py-3 text-center border-r border-white/10">Einsatzplanung in %</th>
                <th colSpan={2} className="bg-blue-800 py-3 text-center border-r border-white/10">Einsatzplanung in Stunden</th>
                <th colSpan={3} className="bg-slate-800 py-3 text-center">Personalkosten in Euro</th>
                <th className="bg-slate-800"></th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest">
                <th className="p-4 w-16 text-center">Jahr</th>
                <th className="p-4 w-[200px] text-left sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">Mitarbeiter</th>
                <th className="p-4 w-[120px] text-right bg-emerald-50/30">Gesamtstd/J</th>
                <th className="p-4 w-[120px] text-right bg-emerald-50/30">Anwesend</th>
                <th className="p-4 w-[120px] text-right bg-amber-50 dark:bg-amber-900/10">Produktiv %</th>
                <th className="p-4 w-[120px] text-right">Verfügbar Std.</th>
                <th className="p-4 w-[140px] text-right border-r border-slate-200/50 font-bold text-blue-600 italic">Euro/Std.</th>
                <th className="p-4 w-[120px] text-right bg-blue-50/20 dark:bg-blue-900/5">Intern / Verw.</th>
                <th className="p-4 w-[120px] text-right bg-blue-50/20 dark:bg-blue-900/5 border-r border-slate-200/50">Verrechenbar</th>
                <th className="p-4 w-[120px] text-right bg-blue-50/10 dark:bg-blue-900/5">Intern / Verw.</th>
                <th className="p-4 w-[120px] text-right bg-blue-50/10 dark:bg-blue-900/5 border-r border-slate-200/50 text-emerald-600">Verrechenbar</th>
                <th className="p-4 w-[150px] text-right">Verwaltung GK</th>
                <th className="p-4 w-[150px] text-right">GK Sonstiges</th>
                <th className="p-4 w-[180px] text-right text-emerald-700 bg-emerald-50/20 font-black tracking-normal">Dir. verrechenbar</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {calculatedData.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all font-medium">
                  <td className="p-4 text-center text-slate-400 font-bold">{item.year}</td>
                  <td className="p-2 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10">
                    <input 
                      className="w-full bg-transparent border-none p-2 font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="p-2 bg-emerald-50/10">
                    <input type="number" className="w-full bg-transparent text-right p-2 font-bold outline-none" value={item.totalHoursYear} onChange={(e) => updateItem(item.id, { totalHoursYear: Number(e.target.value) })} />
                  </td>
                  <td className="p-2 bg-emerald-50/10">
                    <input type="number" className="w-full bg-transparent text-right p-2 font-bold outline-none" value={item.presentHours} onChange={(e) => updateItem(item.id, { presentHours: Number(e.target.value) })} />
                  </td>
                  <td className="p-2 bg-amber-50/30 dark:bg-amber-900/5">
                    <input type="number" className="w-full bg-transparent text-right p-2 font-black text-amber-600 outline-none" value={item.productivityPercent} onChange={(e) => updateItem(item.id, { productivityPercent: Number(e.target.value) })} />
                  </td>
                  <td className="p-4 text-right font-black text-slate-900 dark:text-slate-200">
                    {formatNumber(item.availableHours)}
                  </td>
                  <td className="p-4 text-right font-bold text-blue-600 border-r border-slate-200/50 italic">
                    {formatNumber(item.euroPerAvailableHour)}
                  </td>
                  <td className="p-2 bg-blue-50/30 dark:bg-blue-900/5">
                    <input type="number" className="w-full bg-transparent text-right p-2 font-black text-blue-700 outline-none" value={item.internalPercent} onChange={(e) => updateItem(item.id, { internalPercent: Number(e.target.value) })} />
                  </td>
                  <td className="p-2 bg-blue-50/30 dark:bg-blue-900/5 border-r border-slate-200/50">
                    <input type="number" className="w-full bg-transparent text-right p-2 font-black text-emerald-600 outline-none" value={item.billablePercent} onChange={(e) => updateItem(item.id, { billablePercent: Number(e.target.value) })} />
                  </td>
                  <td className="p-4 text-right font-bold text-slate-500">
                    {formatNumber(item.internalHours)}
                  </td>
                  <td className="p-4 text-right font-black text-emerald-600 border-r border-slate-200/50">
                    {formatNumber(item.billableHours)}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-600">
                    {formatCurrency(item.internalCosts)}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-500">
                    {formatCurrency(0)}
                  </td>
                  <td className="p-4 text-right font-black text-emerald-800 bg-emerald-50/20">
                    {formatCurrency(item.billableCosts)}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest sticky bottom-0">
              <tr>
                <td colSpan={5} className="p-5 text-right opacity-60">Konsolidierte Summen</td>
                <td className="p-5 text-right text-blue-400">{formatNumber(totals.hours)} Std.</td>
                <td colSpan={3} className="border-r border-white/5"></td>
                <td className="p-5 text-right border-r border-white/5"></td>
                <td className="p-5 text-right text-emerald-400 border-r border-white/5">{formatNumber(totals.billable)} Std.</td>
                <td colSpan={2} className="p-5 text-right opacity-60">Summe Direkte Pers.Kosten</td>
                <td className="p-5 text-right text-amber-400 bg-black/40 text-sm">{formatCurrency(totals.billableCosts)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 flex gap-6">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
             <Info size={28} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">Informationshinweis</h4>
            <p className="text-xs text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
              Die Produktivität ist der kritische Faktor für die Profitabilität Ihres Kanzleimodells. Streben Sie bei Berufs-Anwärtern und Partnern Faktoren von 80% bis 90% an.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
