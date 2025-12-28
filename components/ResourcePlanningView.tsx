
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Calculator, 
  TrendingUp, 
  Users, 
  Target, 
  Coins, 
  FileCheck,
  Edit3
} from 'lucide-react';
import { ResourcePlanItem } from '../types';
import { formatNumber } from '../utils/formatting';

export const ResourcePlanningView: React.FC = () => {
  const [items, setItems] = useState<ResourcePlanItem[]>([
    { id: '1', nr: 1, activity: 'KI KMU Starter', salesperson: '', price: 497, provisionPercent: 30, months: 12, avgAppointments: 30, closingRate: 5, salesPartner: '' },
    { id: '2', nr: 2, activity: 'KI KMU Professionell', salesperson: '', price: 819, provisionPercent: 30, months: 12, avgAppointments: 5, closingRate: 5, salesPartner: '' },
    { id: '3', nr: 3, activity: 'Neukunden Abschlussprovision', salesperson: '', price: 997, provisionPercent: 50, months: 1, avgAppointments: 30, closingRate: 5, salesPartner: '' },
    { id: '4', nr: 4, activity: 'KI KMU Starter', salesperson: '', price: 497, provisionPercent: 20, months: 12, avgAppointments: 10, closingRate: 5, salesPartner: '' },
    { id: '5', nr: 5, activity: 'KI KMU Professionell', salesperson: '', price: 819, provisionPercent: 20, months: 12, avgAppointments: 5, closingRate: 5, salesPartner: '' },
    { id: '6', nr: 6, activity: 'KI KMU Starter', salesperson: 'Nico', price: 497, provisionPercent: 10, months: 12, avgAppointments: 30, closingRate: 5, salesPartner: '' },
    { id: '7', nr: 7, activity: 'KI KMU Professionell', salesperson: 'Nico', price: 819, provisionPercent: 10, months: 12, avgAppointments: 5, closingRate: 5, salesPartner: '' },
  ]);

  const updateItem = (id: string, updates: Partial<ResourcePlanItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addItem = () => {
    const nextNr = items.length + 1;
    const newItem: ResourcePlanItem = {
      id: Date.now().toString(),
      nr: nextNr,
      activity: '',
      salesperson: '',
      price: 0,
      provisionPercent: 0,
      months: 12,
      avgAppointments: 0,
      closingRate: 0,
      salesPartner: ''
    };
    setItems([...items, newItem]);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id).map((item, idx) => ({ ...item, nr: idx + 1 })));
  };

  const calculateResults = (item: ResourcePlanItem) => {
    const provisionEuro = (item.price * item.provisionPercent) / 100;
    const closingsPerYear = Math.round(((item.avgAppointments * 10 * (item.closingRate / 100)) / 10) * item.months);
    const closingsPerMonth = closingsPerYear / 12;
    const revenue = closingsPerYear * item.price;
    const count = closingsPerYear; 

    return { provisionEuro, closingsPerYear, closingsPerMonth, revenue, count };
  };

  const totalRevenue = items.reduce((acc, item) => acc + calculateResults(item).revenue, 0);
  const totalProvision = items.reduce((acc, item) => acc + (calculateResults(item).provisionEuro * calculateResults(item).closingsPerYear), 0);
  const totalClosings = items.reduce((acc, item) => acc + calculateResults(item).closingsPerYear, 0);

  const stats = [
    { label: 'Proj. Gesamtumsatz', value: `${formatNumber(totalRevenue)} €`, icon: <TrendingUp className="text-blue-600" />, sub: 'Planperiode' },
    { label: 'Provisionen gesamt', value: `${formatNumber(totalProvision)} €`, icon: <Coins className="text-amber-600" />, sub: 'Vertriebskosten' },
    { label: 'Abschlüsse gesamt', value: totalClosings.toString(), icon: <Target className="text-emerald-600" />, sub: 'Konvertierung' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Einsatz- und Ressourcenplanung</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Strategische Vertriebskalkulation & Skalierungsmodellierung</p>
        </div>
        <div className="flex gap-3">
           <button onClick={addItem} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
             <Plus size={16} /> Tätigkeit hinzufügen
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">{stat.label}</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
              <p className="text-[10px] text-slate-400 font-medium italic">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs min-w-[1400px]">
            <thead>
              {/* Group Headers */}
              <tr>
                <th colSpan={3} className="bg-slate-50/50 dark:bg-slate-800/20 h-2"></th>
                <th colSpan={4} className="bg-blue-600 text-white py-3 text-[10px] font-black text-center tracking-[0.2em] uppercase border-r border-white/10">Sparte I: Dienstleistungen</th>
                <th colSpan={8} className="bg-slate-800 text-white py-3 text-[10px] font-black text-center tracking-[0.2em] uppercase">Sparte II: Performance & Datenerfassung</th>
              </tr>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 w-12 text-center font-black text-slate-400 uppercase tracking-tighter">Nr.</th>
                <th className="p-4 w-[280px] text-left font-black text-slate-400 uppercase tracking-widest">Tätigkeit / Service</th>
                <th className="p-4 w-[160px] text-left font-black text-slate-400 uppercase tracking-widest">Verantwortlich</th>
                <th className="p-4 w-[110px] text-right font-black text-slate-400 uppercase tracking-widest">Preis €</th>
                <th className="p-4 w-[110px] text-right font-black text-slate-400 uppercase tracking-widest">Prov. %</th>
                <th className="p-4 w-[110px] text-right font-black text-slate-400 uppercase tracking-widest">Prov. €</th>
                <th className="p-4 w-[90px] text-right font-black text-slate-400 uppercase tracking-widest">Monate</th>
                <th className="p-4 w-[130px] text-right font-black text-slate-400 uppercase tracking-widest">Termine (avg)</th>
                <th className="p-4 w-[130px] text-right font-black text-slate-400 uppercase tracking-widest">Rate %</th>
                <th className="p-4 w-[130px] text-right font-black text-slate-400 uppercase tracking-widest">Abschl. / J</th>
                <th className="p-4 w-[130px] text-right font-black text-slate-400 uppercase tracking-widest">Abschl. / M</th>
                <th className="p-4 w-[110px] text-right font-black text-slate-400 uppercase tracking-widest">Volume</th>
                <th className="p-4 w-[160px] text-left font-black text-slate-400 uppercase tracking-widest">Partner</th>
                <th className="p-4 w-[160px] text-right font-black text-slate-400 uppercase tracking-widest bg-blue-50/30 dark:bg-blue-900/10">Umsatz €</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const results = calculateResults(item);
                return (
                  <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="p-4 text-center font-bold text-slate-400 bg-slate-50/20 dark:bg-slate-900/50">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                        {item.nr}
                      </div>
                    </td>
                    
                    {/* Activity Input */}
                    <td className="p-2">
                      <div className="flex items-center gap-2 group/input">
                        <Edit3 size={10} className="text-slate-300 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                        <input 
                          className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl p-2 font-bold text-slate-700 dark:text-slate-200 outline-none focus:bg-white focus:border-blue-400 transition-all"
                          value={item.activity}
                          onChange={(e) => updateItem(item.id, { activity: e.target.value })}
                        />
                      </div>
                    </td>

                    {/* Salesperson Input */}
                    <td className="p-2">
                      <input 
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl p-2 font-bold text-slate-600 dark:text-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-all"
                        value={item.salesperson}
                        placeholder="Zuweisen..."
                        onChange={(e) => updateItem(item.id, { salesperson: e.target.value })}
                      />
                    </td>

                    {/* Price Input */}
                    <td className="p-2">
                      <input 
                        type="number"
                        className="w-full bg-slate-50/30 dark:bg-slate-950/30 border border-transparent hover:border-slate-200 rounded-xl p-2 font-black text-right outline-none focus:bg-white focus:border-blue-400 transition-all"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                      />
                    </td>

                    {/* Provision % Input */}
                    <td className="p-2">
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-slate-50/30 dark:bg-slate-950/30 border border-transparent hover:border-slate-200 rounded-xl p-2 pr-6 font-black text-right outline-none focus:bg-white focus:border-blue-400 transition-all text-amber-600"
                          value={item.provisionPercent}
                          onChange={(e) => updateItem(item.id, { provisionPercent: Number(e.target.value) })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-600/50">%</span>
                      </div>
                    </td>

                    {/* Calculated Provision € */}
                    <td className="p-4 text-right font-bold text-slate-400">
                      {formatNumber(results.provisionEuro)}
                    </td>

                    {/* Months Input */}
                    <td className="p-2">
                       <input 
                        type="number"
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded-xl p-2 font-bold text-right outline-none focus:bg-white transition-all"
                        value={item.months}
                        onChange={(e) => updateItem(item.id, { months: Number(e.target.value) })}
                      />
                    </td>

                    {/* Avg Appointments Input */}
                    <td className="p-2">
                      <input 
                        type="number"
                        className="w-full bg-slate-50/30 border border-transparent hover:border-slate-200 rounded-xl p-2 font-black text-right outline-none focus:bg-white transition-all"
                        value={item.avgAppointments}
                        onChange={(e) => updateItem(item.id, { avgAppointments: Number(e.target.value) })}
                      />
                    </td>

                    {/* Rate % Input */}
                    <td className="p-2">
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-slate-50/30 border border-transparent hover:border-slate-200 rounded-xl p-2 pr-6 font-black text-right outline-none focus:bg-white transition-all text-emerald-600"
                          value={item.closingRate}
                          onChange={(e) => updateItem(item.id, { closingRate: Number(e.target.value) })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600/50">%</span>
                      </div>
                    </td>

                    {/* Calculated Results */}
                    <td className="p-4 text-right font-bold text-slate-500">
                      {results.closingsPerYear}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-500">
                      {results.closingsPerMonth.toFixed(1)}
                    </td>
                    <td className="p-4 text-right font-black text-blue-600">
                      {results.count}
                    </td>

                    {/* Partner Input */}
                    <td className="p-2">
                      <input 
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded-xl p-2 font-bold outline-none focus:bg-white transition-all"
                        value={item.salesPartner}
                        placeholder="Kooperation..."
                        onChange={(e) => updateItem(item.id, { salesPartner: e.target.value })}
                      />
                    </td>

                    {/* Total Revenue Calculated */}
                    <td className="p-4 text-right font-black text-slate-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/10">
                      {formatNumber(results.revenue)} €
                    </td>

                    {/* Delete Action */}
                    <td className="p-4 text-center">
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 dark:bg-slate-950 text-white font-black text-sm">
                <td colSpan={13} className="p-5 text-right uppercase tracking-[0.2em] text-[10px] text-slate-500">Gesamtsumme Projektion Planjahr</td>
                <td className="p-5 text-right text-amber-400 text-lg border-l border-slate-800">{formatNumber(totalRevenue)} €</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-6 lg:col-span-2">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Calculator size={28} />
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Berechnungslogik & Annahmen</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Dieses Modul nutzt eine <span className="text-blue-600 font-bold">10-Monats-Schnitt-Logik</span> zur Glättung saisonaler Schwankungen und Fehlzeiten. Die Prognosewerte dienen als strategische Basis für die GuV-Planung und können per Mausklick in die Detailplanung überführt werden.
            </p>
          </div>
        </div>
        
        <div className="bg-emerald-600 p-8 rounded-[32px] text-white flex flex-col justify-between shadow-xl shadow-emerald-500/20 group cursor-pointer overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-3xl group-hover:bg-white/20 transition-all rounded-full"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h4 className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-80">Synchronisation</h4>
              <p className="text-lg font-bold leading-tight">In Planrechnung<br/>importieren</p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
               <FileCheck size={20} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 relative z-10">
             <button className="flex-1 bg-white text-emerald-700 py-3 rounded-2xl text-xs font-black shadow-lg transition-transform active:scale-95 group-hover:bg-emerald-50">
               Jetzt abgleichen
             </button>
             <button className="p-3 bg-emerald-700 rounded-2xl hover:bg-emerald-800 transition-colors">
               <Download size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
