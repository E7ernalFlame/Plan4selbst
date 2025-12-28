
import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  TrendingUp, 
  Info,
  ArrowUpRight,
  History,
  Calendar,
  Box,
  Truck,
  Monitor,
  Building,
  Layers,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { InvestmentItem, AssetCategory } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CATEGORY_CONFIG: Record<AssetCategory, { icon: React.ReactNode, color: string }> = {
  'IT & Software': { icon: <Monitor size={14} />, color: '#3b82f6' },
  'Fuhrpark': { icon: <Truck size={14} />, color: '#10b981' },
  'Maschinen': { icon: <Box size={14} />, color: '#f59e0b' },
  'Gebäude': { icon: <Building size={14} />, color: '#ef4444' },
  'Büroausstattung': { icon: <Layers size={14} />, color: '#8b5cf6' },
  'GWG': { icon: <AlertCircle size={14} />, color: '#64748b' }
};

export const InvestmentPlanningView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Neuzugang' | 'Altbestand'>('Neuzugang');
  const [items, setItems] = useState<InvestmentItem[]>([
    { id: '1', label: 'Bestandsmaschinen 2022', category: 'Maschinen', cost: 125000, usefulLife: 10, acquisitionDate: '2022-01-01', type: 'Altbestand' },
    { id: '2', label: 'Büroausstattung', category: 'Büroausstattung', cost: 12000, usefulLife: 8, acquisitionDate: '2021-06-15', type: 'Altbestand' },
    { id: '3', label: 'Server-Infrastruktur Upgrade', category: 'IT & Software', cost: 45000, usefulLife: 3, acquisitionDate: '2024-03-12', type: 'Neuzugang' },
    { id: '4', label: 'E-Fuhrpark (Tesla Model 3)', category: 'Fuhrpark', cost: 55000, usefulLife: 8, acquisitionDate: '2024-08-20', type: 'Neuzugang' },
  ]);

  const updateItem = (id: string, updates: Partial<InvestmentItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addItem = (type: 'Altbestand' | 'Neuzugang') => {
    setItems([...items, {
      id: Date.now().toString(),
      label: 'Neue Position',
      category: 'IT & Software',
      cost: 0,
      usefulLife: 3,
      acquisitionDate: new Date().toISOString().split('T')[0],
      type
    }]);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const month = new Date(item.acquisitionDate).getMonth() + 1;
      const isH2 = month > 6;
      
      let afaYear = 0;
      if (item.cost <= 1000) {
        // GWG Logik (Sofortabschreibung)
        afaYear = item.cost;
      } else {
        // Lineare AfA
        const fullYearAfA = item.usefulLife > 0 ? item.cost / item.usefulLife : 0;
        // Halbjahresregel AT
        afaYear = isH2 ? fullYearAfA / 2 : fullYearAfA;
      }

      const residualValue = Math.max(0, item.cost - afaYear);

      return {
        ...item,
        afaYear,
        residualValue,
        isH2
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    const neuzugange = calculatedItems.filter(i => i.type === 'Neuzugang');
    return {
      totalCost: neuzugange.reduce((sum, i) => sum + i.cost, 0),
      totalAfA: calculatedItems.reduce((sum, i) => sum + i.afaYear, 0),
      totalResidual: calculatedItems.reduce((sum, i) => sum + i.residualValue, 0),
      gwgCount: neuzugange.filter(i => i.cost <= 1000).length
    };
  }, [calculatedItems]);

  // Daten für AfA-Vorschau (vereinfacht für die nächsten 5 Jahre)
  const chartData = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map(yearOffset => {
      const year = 2024 + yearOffset;
      const totalAfA = calculatedItems.reduce((sum, item) => {
        // Sehr vereinfachte Logik für den AfA Buckel
        if (yearOffset < item.usefulLife) return sum + (item.cost / item.usefulLife);
        return sum;
      }, 0);
      return { name: year.toString(), value: totalAfA };
    });
  }, [calculatedItems]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-xl shadow-slate-900/20">
                <HardHat size={22} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Investitions- & Asset-Management</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kalkulation nach UGB & EStG (AT)</p>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            <Save size={16} /> In Planrechnung spiegeln
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Net Investment 2024', value: formatCurrency(totals.totalCost), color: 'text-blue-600', sub: 'Geplante Neuzugänge' },
          { label: 'Guv Impact (AfA)', value: formatCurrency(totals.totalAfA), color: 'text-red-500', sub: 'Inkl. Halbjahresregel' },
          { label: 'Restbuchwert (EOP)', value: formatCurrency(totals.totalResidual), color: 'text-slate-900 dark:text-white', sub: 'Proj. zum 31.12.' },
          { label: 'GWG Volumen', value: `${totals.gwgCount} Assets`, color: 'text-emerald-600', sub: '< € 1.000,- Grenze' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
            <h4 className={`text-2xl font-black leading-none mb-1 relative z-10 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-slate-400 font-medium italic relative z-10">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Main List Control */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex bg-slate-50/50 dark:bg-slate-900/50">
              {['Neuzugang', 'Altbestand'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all ${
                    activeTab === t ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {t === 'Neuzugang' ? 'Geplante Investitionen' : 'Anlagen-Altbestand'}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20">
                    <th className="p-4 text-left">Asset / Kategorie</th>
                    <th className="p-4 text-right w-32">Anschaffung (€)</th>
                    <th className="p-4 text-center w-28">Datum</th>
                    <th className="p-4 text-center w-20">ND (J)</th>
                    <th className="p-4 text-right w-32 bg-red-50/20 dark:bg-red-900/10 font-black text-red-600">AfA 2024</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {calculatedItems.filter(i => i.type === activeTab).map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">
                             {CATEGORY_CONFIG[item.category].icon}
                           </div>
                           <div className="flex-1">
                             <input 
                                className="w-full bg-transparent border-none p-0 font-bold text-slate-900 dark:text-white outline-none"
                                value={item.label}
                                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                             />
                             <select 
                                className="block text-[9px] font-bold text-slate-400 uppercase bg-transparent border-none p-0 outline-none cursor-pointer"
                                value={item.category}
                                onChange={(e) => updateItem(item.id, { category: e.target.value as AssetCategory })}
                             >
                               {Object.keys(CATEGORY_CONFIG).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                           </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-800/50 text-right p-3 rounded-xl font-black text-slate-900 dark:text-white outline-none border border-transparent focus:border-blue-500/30"
                            value={item.cost}
                            onChange={(e) => updateItem(item.id, { cost: Number(e.target.value) })}
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <input 
                          type="date"
                          className="w-full bg-transparent text-center p-2 font-bold text-slate-400 outline-none"
                          value={item.acquisitionDate}
                          onChange={(e) => updateItem(item.id, { acquisitionDate: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number"
                          className="w-full bg-transparent text-center p-2 font-bold text-slate-500 outline-none"
                          value={item.usefulLife}
                          onChange={(e) => updateItem(item.id, { usefulLife: Number(e.target.value) })}
                        />
                      </td>
                      <td className="p-4 text-right font-black text-red-600 bg-red-50/10 dark:bg-red-900/5 relative">
                        {formatNumber(item.afaYear)}
                        {item.isH2 && <span className="absolute top-1 right-1 text-[7px] text-amber-600 font-black">1/2</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
               <button onClick={() => addItem(activeTab)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                 <Plus size={14} /> Neue Position erfassen
               </button>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                 Asset-Limit: {calculatedItems.filter(i => i.type === activeTab).length} Positionen
               </p>
            </div>
          </div>
        </div>

        {/* Predictive Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-slate-900/30 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
            <div className="flex items-center gap-3">
               <BarChart2 size={24} className="text-blue-400" />
               <h4 className="font-black uppercase tracking-[0.2em] text-[10px]">AfA Prognose-Trend</h4>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Visualisierung der Abschreibungslast basierend auf den ND-Werten Ihrer Assets.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
             <div className="flex gap-4 items-start">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                  <Calculator size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Expert Guidance</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Die **Halbjahresregelung** gilt in Österreich stichtagsbezogen zum 30.06. Investitionen danach mindern das steuerliche Ergebnis nur um die halbe Jahres-AfA.
                  </p>
               </div>
             </div>
             <div className="flex gap-4 items-start">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                  <TrendingUp size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Liquiditäts-Tip</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Achten Sie auf die AfA-Lücke bei auslaufenden Nutzungsdauern, um steuerliche Überraschungen zu vermeiden.
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
