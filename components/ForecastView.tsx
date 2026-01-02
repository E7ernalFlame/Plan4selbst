
import React, { useMemo, useState } from 'react';
import { PlanSection, ForecastGrowthRates } from '../types';
import { projectForecast, calculateKeyFigures } from '../utils/calculations';
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
  Line,
  Bar,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Percent, 
  Layers, 
  Activity,
  Zap,
  SlidersHorizontal,
  ArrowRightCircle,
  ShieldCheck,
  FileBarChart,
  Calculator,
  Info,
  ChevronRight,
  TrendingDown,
  Target,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface ForecastViewProps {
  sections: PlanSection[];
  allScenarios: Record<string, PlanSection[]>;
  baseYear: number;
  rates: ForecastGrowthRates;
  onUpdateRates: (rates: ForecastGrowthRates) => void;
}

type ScenarioKey = 'basis' | 'best' | 'worst';

interface ScenarioParams {
  label: string;
  revenueRate: number;
  costRate: number;
  color: string;
  icon: React.ReactNode;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ sections, rates, onUpdateRates }) => {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('basis');
  
  // Individuell anpassbare Szenario-Raten
  const [scenarioRates, setScenarioRates] = useState<Record<ScenarioKey, number>>({
    basis: 7,
    best: 15,
    worst: 3
  });

  const SCENARIOS: Record<ScenarioKey, ScenarioParams> = {
    basis: { label: 'Basis-Szenario', revenueRate: scenarioRates.basis, costRate: 2, color: '#3b82f6', icon: <Activity size={16} /> },
    best: { label: 'Best Case', revenueRate: scenarioRates.best, costRate: 5, color: '#10b981', icon: <Target size={16} /> },
    worst: { label: 'Worst Case', revenueRate: scenarioRates.worst, costRate: 1, color: '#ef4444', icon: <TrendingDown size={16} /> }
  };

  // Berechnungen für alle 3 Pfade gleichzeitig (für das Risk Corridor Chart)
  const allProjections = useMemo(() => {
    return {
      basis: projectForecast(sections, { ...rates, REVENUE: scenarioRates.basis }, 4),
      best: projectForecast(sections, { ...rates, REVENUE: scenarioRates.best }, 4),
      worst: projectForecast(sections, { ...rates, REVENUE: scenarioRates.worst }, 4)
    };
  }, [sections, rates, scenarioRates]);

  // Daten für das große Korridor-Chart
  const corridorData = useMemo(() => {
    return allProjections.basis.map((p, idx) => ({
      name: `Jahr ${idx + 1}`,
      Basis: Math.round(p.result),
      Best: Math.round(allProjections.best[idx].result),
      Worst: Math.round(allProjections.worst[idx].result),
      range: [Math.round(allProjections.worst[idx].result), Math.round(allProjections.best[idx].result)]
    }));
  }, [allProjections]);

  const activeData = allProjections[activeScenario];
  const lastYear = activeData[activeData.length - 1];
  const firstYear = activeData[0];
  const growthAbsolute = lastYear.result - firstYear.result;

  const getExecutiveSummary = () => {
    if (activeScenario === 'best') {
      return "Dieses Szenario geht von einer aggressiven Marktdurchdringung aus. Die Investitionskraft ist hoch, was einen signifikanten Anstieg des Unternehmenswertes zur Folge hat. Fokus liegt auf Skalierung.";
    } else if (activeScenario === 'worst') {
      return "Ein konservativer Ausblick bei stagnierender Nachfrage. Fokus in dieser Planung ist Kostendisziplin und Cash-Sicherung, um auch bei minimalem Wachstum profitabel zu bleiben.";
    }
    return "Die Basisplanung spiegelt ein moderates, gesundes Wachstum wider. Die Kostenstruktur skaliert unterproportional zum Ertrag, was die operative Marge kontinuierlich verbessert.";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Strategische Mehrjahresplanung</h2>
          <p className="text-slate-500 font-medium italic">5-Jahres-Projektion basierend auf Szenario-Simulationen</p>
        </div>
        
        {/* Scenario Switcher Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeScenario === key 
                  ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white scale-105 ring-1 ring-slate-200 dark:ring-slate-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div style={{ color: SCENARIOS[key].color }}>{SCENARIOS[key].icon}</div>
              {SCENARIOS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Driver Controls & Written Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Growth Driver Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">Szenario-Treiber anpassen</h3>
            </div>
            
            <div className="space-y-6">
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map(key => (
                <div key={key} className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors flex items-center gap-2">
                       {SCENARIOS[key].label} Growth
                    </label>
                    <span className="text-[10px] font-black text-slate-300">p.a.</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number" step="0.5"
                      className={`w-full bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl py-4 px-5 text-sm font-black focus:outline-none transition-all dark:text-white ${
                        activeScenario === key ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-transparent'
                      }`}
                      value={scenarioRates[key]}
                      onChange={(e) => setScenarioRates({ ...scenarioRates, [key]: parseFloat(e.target.value) || 0 })}
                    />
                    <Percent size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Written Plan / Executive Summary */}
          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full translate-x-16 -translate-y-16" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-white/10 rounded-xl">
                <FileText size={20} className="text-blue-400" />
              </div>
              <h3 className="font-black uppercase text-[11px] tracking-widest">Executive Summary</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed italic opacity-80 border-l-2 border-blue-500/30 pl-4">
              "{getExecutiveSummary()}"
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
               <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Delta J1 - J5</p>
                 <p className="text-lg font-black text-emerald-400">+{formatNumber(growthAbsolute)} €</p>
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                 <p className="text-lg font-black text-blue-400 uppercase tracking-tighter">Profitabel</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Charts & Matrix */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Risk Corridor Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Ergebnis-Korridor</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Multi-Szenario Simulation</p>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={corridorData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                    />
                    <Area dataKey="range" fill="#3b82f6" fillOpacity={0.08} stroke="none" name="Sicherheitskorridor" />
                    <Line type="monotone" dataKey="Basis" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="Best" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="Worst" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scenario Detail Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Wachstumstrend</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{SCENARIOS[activeScenario].label} Detail</p>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SCENARIOS[activeScenario].color} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={SCENARIOS[activeScenario].color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="yearOffset" axisLine={false} tickLine={false} tickFormatter={(v) => `Jahr ${v+1}`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="revenue" name="Umsatz" stroke={SCENARIOS[activeScenario].color} fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                    <Line type="monotone" dataKey="result" name="Ergebnis (EGT)" stroke="#1e293b" strokeWidth={2} dot={{ r: 3, fill: '#1e293b' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Professional Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-3">
                 <Calculator size={18} className="text-blue-600" />
                 <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Projektions-Matrix 2024 - 2028</h3>
               </div>
               <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm`}>
                 <Zap size={10} className="text-amber-500 fill-amber-500" /> Auto-Projektion Aktiv
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-white dark:bg-slate-900 text-slate-400 font-black uppercase tracking-[0.2em] text-[9px] border-b border-slate-50 dark:border-slate-800">
                    <th className="text-left px-10 py-6">Plan-Position</th>
                    {activeData.map((_, i) => (
                      <th key={i} className="text-right px-10 py-6">Jahr {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="px-10 py-5 font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Umsatzerlöse</td>
                    {activeData.map((p, i) => <td key={i} className="px-10 py-5 text-right font-bold text-slate-700 dark:text-slate-300">{formatNumber(p.revenue)} €</td>)}
                  </tr>
                  <tr>
                    <td className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Rohertrag (DB1)</td>
                    {activeData.map((p, i) => <td key={i} className="px-10 py-5 text-right text-slate-500 italic">{formatNumber(p.db1)} €</td>)}
                  </tr>
                  <tr>
                    <td className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Operatives EBITDA</td>
                    {activeData.map((p, i) => <td key={i} className="px-10 py-5 text-right text-slate-500">{formatNumber(p.ebitda)} €</td>)}
                  </tr>
                  <tr className="bg-blue-50/20 dark:bg-blue-900/5">
                    <td className="px-10 py-8 font-black text-blue-600 uppercase tracking-[0.3em] text-[10px]">Ergebnis vor Steuern (EGT)</td>
                    {activeData.map((p, i) => <td key={i} className="px-10 py-8 text-right font-black text-blue-700 dark:text-blue-400 text-base">{formatNumber(p.result)} €</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 flex gap-4 items-center border-t border-slate-100 dark:border-slate-800">
               <BadgeAlert size={18} className="text-blue-600 shrink-0" />
               <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold leading-relaxed italic">
                 Diese Projektion ist eine mathematische Schätzung basierend auf den aktuellen Planprämissen und linearen Wachstumskonstanten. Marktveränderungen sind gesondert zu bewerten.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
