
import React, { useMemo, useState } from 'react';
import { PlanSection, ForecastGrowthRates } from '../types';
import { projectForecast } from '../utils/calculations';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Percent, 
  Layers, 
  Activity,
  Zap,
  SlidersHorizontal,
  ArrowRightCircle
} from 'lucide-react';

interface ForecastViewProps {
  sections: PlanSection[];
  allScenarios: Record<string, PlanSection[]>;
  baseYear: number;
  rates: ForecastGrowthRates;
  onUpdateRates: (rates: ForecastGrowthRates) => void;
}

interface ScenarioOffsets {
  optimistic: number;
  worstCase: number;
}

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[11px] font-bold text-slate-300">{entry.name}:</span>
              </div>
              <span className="text-[11px] font-black text-white">{formatNumber(entry.value)} €</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastView: React.FC<ForecastViewProps> = ({ sections, rates, onUpdateRates }) => {
  // Standard-Offsets laut Vorgabe: +10% und +2%
  const [offsets, setOffsets] = useState<ScenarioOffsets>({
    optimistic: 10,
    worstCase: 2
  });

  // Projektion für den Basis-Trend (Jahr 1 bis Jahr 5)
  const activeProjections = useMemo(() => projectForecast(sections, rates, 4), [sections, rates]);

  // Daten für Szenarien-Vergleich (Startpunkt Jahr 1 ist identisch)
  const scenarioData = useMemo(() => {
    return activeProjections.map((p, idx) => {
      const base = Math.round(p.result);
      const isYearOne = idx === 0;
      
      // Offsets greifen erst ab Jahr 2 (idx > 0)
      const opt = isYearOne ? base : Math.round(base * (1 + offsets.optimistic / 100));
      const worst = isYearOne ? base : Math.round(base * (1 + offsets.worstCase / 100));
      
      return {
        name: `Jahr ${idx + 1}`,
        'Basis': base,
        'Optimistisch': opt,
        'Worst Case': worst,
        // Range für das Shading
        rangeMin: worst,
        rangeMax: opt
      };
    });
  }, [activeProjections, offsets]);

  const handleRateChange = (key: keyof ForecastGrowthRates, val: string) => {
    const num = parseFloat(val) || 0;
    onUpdateRates({ ...rates, [key]: num });
  };

  const trendData = activeProjections.map((p, idx) => ({
    name: `Jahr ${idx + 1}`,
    Umsatz: Math.round(p.revenue),
    Ergebnis: Math.round(p.result),
    DB1: Math.round(p.db1)
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Kontroll-Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">Wachstum p.a.</h3>
            </div>
            
            <div className="space-y-5">
              {[
                { id: 'REVENUE', label: 'Umsatz-Trend', color: 'border-blue-500' },
                { id: 'MATERIAL', label: 'Wareneinsatz', color: 'border-emerald-500' },
                { id: 'PERSONNEL', label: 'Personalkosten', color: 'border-indigo-500' },
                { id: 'OPERATING', label: 'Betriebskosten', color: 'border-slate-400' },
              ].map(rate => (
                <div key={rate.id} className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-hover:text-blue-500 transition-colors">{rate.label}</label>
                  <div className="relative">
                    <input
                      type="number" step="0.1"
                      className={`w-full bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl py-4 px-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white ${rate.color}`}
                      value={rates[rate.id as keyof ForecastGrowthRates]}
                      onChange={(e) => handleRateChange(rate.id as keyof ForecastGrowthRates, e.target.value)}
                    />
                    <Percent size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/10 text-white rounded-2xl">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="font-black text-white uppercase text-[11px] tracking-widest">Szenarien-Logik</h3>
            </div>
            
            <div className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Optimistisch (ab Jahr 2)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-white/5 border-2 border-emerald-500/30 rounded-2xl py-4 px-5 text-sm font-black text-white outline-none focus:border-emerald-500 transition-all"
                    value={offsets.optimistic}
                    onChange={(e) => setOffsets({ ...offsets, optimistic: parseFloat(e.target.value) || 0 })}
                  />
                  <Percent size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Worst Case (ab Jahr 2)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-white/5 border-2 border-rose-500/30 rounded-2xl py-4 px-5 text-sm font-black text-white outline-none focus:border-rose-500 transition-all"
                    value={offsets.worstCase}
                    onChange={(e) => setOffsets({ ...offsets, worstCase: parseFloat(e.target.value) || 0 })}
                  />
                  <Percent size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-500/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grafische Auswertung */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Chart 1: Basis Trend */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">Performance-Verlauf</h3>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gradUmsatz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomForecastTooltip />} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingBottom: '30px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area type="monotone" dataKey="Umsatz" stroke="#3b82f6" fillOpacity={1} fill="url(#gradUmsatz)" strokeWidth={4} />
                    <Area type="monotone" dataKey="Ergebnis" stroke="#f59e0b" fill="none" strokeWidth={4} name="EGT" />
                    <Line type="monotone" dataKey="DB1" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Szenarien Risiko-Schere */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Layers size={20} className="text-purple-600" />
                  <h3 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">Szenarien-Schere (EGT)</h3>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scenarioData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomForecastTooltip />} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingBottom: '30px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="rangeMax" 
                      baseArea={scenarioData.map(d => d.rangeMin)}
                      fill="#3b82f6" 
                      fillOpacity={0.1} 
                      stroke="none" 
                      name="Risk Corridor"
                      legendType="none"
                    />
                    
                    <Line type="monotone" dataKey="Basis" stroke="#3b82f6" strokeWidth={5} dot={{ r: 6, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="Optimistisch" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="Worst Case" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detaillierte Kennzahlen-Tabelle */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
               <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 Finanzielle Projektion
               </h3>
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Zap size={14} className="text-blue-600" /> Jahr 1 bis 5
               </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-10 py-6 font-black text-slate-400 uppercase text-[9px] tracking-[0.3em]">KPI / Kennzahl</th>
                    {activeProjections.map((p, idx) => (
                      <th key={idx} className="text-right px-10 py-6">
                        <span className="block text-lg font-black text-slate-900 dark:text-white leading-none">Jahr {idx + 1}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium">
                  {[
                    { label: 'Umsatzerlöse', key: 'revenue', color: 'text-slate-900 dark:text-white' },
                    { label: 'Deckungsbeitrag 1', key: 'db1', color: 'text-emerald-600' },
                    { label: 'Operativer Cashflow (EBITDA)', key: 'ebitda', color: 'text-slate-500' },
                  ].map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <td className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">{row.label}</td>
                      {activeProjections.map((p, idx) => (
                        <td key={idx} className={`px-10 py-5 text-right font-black ${row.color}`}>
                          {formatNumber(p[row.key as keyof typeof p] as number)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="px-10 py-8 uppercase tracking-[0.4em] text-[10px] text-slate-400">Ergebnis vor Steuern (EGT)</td>
                    {activeProjections.map((p, idx) => (
                      <td key={idx} className="px-10 py-8 text-right text-amber-400 text-2xl tracking-tighter">
                        {formatNumber(p.result)} €
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
