
import React, { useMemo } from 'react';
import { PlanSection, ForecastGrowthRates } from '../types';
import { projectForecast } from '../utils/calculations';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, Percent, Info, Layers, LineChart as ChartIcon } from 'lucide-react';

interface ForecastViewProps {
  sections: PlanSection[];
  allScenarios: Record<string, PlanSection[]>;
  baseYear: number;
  rates: ForecastGrowthRates;
  onUpdateRates: (rates: ForecastGrowthRates) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ sections, allScenarios, baseYear, rates, onUpdateRates }) => {
  // Projektion für das aktuell aktive Szenario (für die Tabelle und den Detail-Chart)
  const activeProjections = useMemo(() => projectForecast(sections, rates), [sections, rates]);

  // Projektionen für den Szenarienvergleich (Basis vs. Optimistisch vs. Worst Case)
  const scenarioComparisonData = useMemo(() => {
    // Fix: Explicitly type entries to avoid 'unknown' or '{}' inference errors
    const entries = Object.entries(allScenarios) as [string, PlanSection[]][];
    
    if (entries.length === 0) return [];

    const projectedScenarios = entries.map(([name, scenarioSections]) => ({
      name,
      projections: projectForecast(scenarioSections, rates)
    }));

    // Transformieren in Recharts Format
    // Fix: Handle case where projectedScenarios might be empty or missing data
    if (!projectedScenarios[0] || !projectedScenarios[0].projections) return [];

    return projectedScenarios[0].projections.map((_, yearIdx) => {
      const dataPoint: any = { 
        name: (baseYear + yearIdx).toString(),
      };
      projectedScenarios.forEach(scenario => {
        if (scenario.projections[yearIdx]) {
          dataPoint[scenario.name] = Math.round(scenario.projections[yearIdx].result);
        }
      });
      return dataPoint;
    });
  }, [allScenarios, baseYear, rates]);

  const handleRateChange = (key: keyof ForecastGrowthRates, val: string) => {
    const num = parseFloat(val) || 0;
    onUpdateRates({ ...rates, [key]: num });
  };

  const activeChartData = activeProjections.map(p => ({
    name: (baseYear + p.yearOffset).toString(),
    Umsatz: Math.round(p.revenue),
    Ergebnis: Math.round(p.result),
    DB1: Math.round(p.db1)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-white">Wachstumsraten (%)</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 'REVENUE', label: 'Umsatzwachstum', color: 'border-blue-500' },
              { id: 'MATERIAL', label: 'Wareneinsatz', color: 'border-emerald-500' },
              { id: 'PERSONNEL', label: 'Personalkosten', color: 'border-indigo-500' },
              { id: 'OPERATING', label: 'Betriebskosten', color: 'border-purple-500' },
            ].map(rate => (
              <div key={rate.id} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{rate.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border-2 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white ${rate.color}`}
                    value={rates[rate.id as keyof ForecastGrowthRates]}
                    onChange={(e) => handleRateChange(rate.id as keyof ForecastGrowthRates, e.target.value)}
                  />
                  <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
            <Info size={18} className="text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
              Die Raten werden jährlich kumuliert auf das Basisjahr {baseYear} angewendet. Die Werte basieren auf dem gewählten Szenario-Treiber.
            </p>
          </div>
        </div>

        {/* Visualizations */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Trend Chart (Active Scenario) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ChartIcon size={16} className="text-blue-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Aktueller Trend-Mix</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData}>
                    <defs>
                      <linearGradient id="colorUmsatz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Area type="monotone" dataKey="Umsatz" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUmsatz)" strokeWidth={3} />
                    <Line type="monotone" dataKey="DB1" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Ergebnis" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scenario Comparison Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Layers size={16} className="text-purple-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Szenarien-Entwicklung (Ergebnis)</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenarioComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Line type="monotone" dataKey="Basisplan" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="Optimistisch" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Worst Case" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Forecast Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left px-8 py-5 font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Kennzahlen Projection</th>
                    {activeProjections.map(p => (
                      <th key={p.yearOffset} className={`text-right px-8 py-5 font-black ${p.yearOffset === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        <span className="text-lg leading-none">{baseYear + p.yearOffset}</span>
                        {p.yearOffset === 0 && <span className="block text-[8px] uppercase tracking-tighter opacity-50">(Basis)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { label: 'Umsatzerlöse', key: 'revenue', color: 'text-blue-600' },
                    { label: 'Deckungsbeitrag 1', key: 'db1', color: 'text-emerald-600' },
                    { label: 'EBITDA', key: 'ebitda', color: 'text-slate-700 dark:text-slate-300' },
                  ].map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{row.label}</td>
                      {activeProjections.map(p => (
                        <td key={p.yearOffset} className={`px-8 py-4 text-right font-black ${row.color}`}>
                          {formatNumber(p[row.key as keyof typeof p] as number)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-900 dark:bg-black text-white font-black">
                    <td className="px-8 py-6 uppercase tracking-[0.3em] text-[10px] text-slate-400">Plan-Ergebnis (EGT)</td>
                    {activeProjections.map(p => (
                      <td key={p.yearOffset} className="px-8 py-6 text-right text-amber-400 text-lg">
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
