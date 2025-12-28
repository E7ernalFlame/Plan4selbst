
import React, { useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowRight, 
  Calendar,
  Building2,
  Activity,
  ChevronRight
} from 'lucide-react';
import { PlanSection, Client, Analysis } from '../types';
import { calculateKeyFigures } from '../utils/calculations';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface ReportsViewProps {
  activeClient: Client;
  activeAnalysis: Analysis;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeClient, activeAnalysis }) => {
  const sections = activeAnalysis.planData;
  const figures = useMemo(() => calculateKeyFigures(sections), [sections]);

  // Daten für Monatstrend
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const monthIdx = i + 1;
      const monthFigures = calculateKeyFigures(sections, monthIdx);
      return {
        name: monthIdx.toString(),
        Umsatz: Math.round(monthFigures.revenue),
        Ergebnis: Math.round(monthFigures.result),
        EBITDA: Math.round(monthFigures.ebitda)
      };
    });
  }, [sections]);

  // Kostenstruktur für BarChart
  const costStructure = [
    { name: 'Material', value: figures.material, color: '#94a3b8' },
    { name: 'Personal', value: figures.personnel, color: '#3b82f6' },
    { name: 'Fixkosten', value: figures.totalFixedCosts - figures.depr, color: '#64748b' },
    { name: 'Abschreibung', value: figures.depr, color: '#cbd5e1' },
  ].filter(c => c.value > 0);

  const handlePrint = () => {
    window.print();
  };

  const db1Margin = (figures.db1 / figures.revenue) * 100;
  const ebitdaMargin = (figures.ebitda / figures.revenue) * 100;
  const resultMargin = (figures.result / figures.revenue) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 print:p-0 print:m-0 print:max-w-none">
      
      {/* Header & Actions */}
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Performance Reporting</h2>
          <p className="text-sm text-slate-500 font-medium">Mandant: {activeClient.name} • {activeAnalysis.name}</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
        >
          <Printer size={16} /> Dashboard drucken / PDF
        </button>
      </div>

      {/* --- PRINT ONLY HEADER --- */}
      <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Management Report</h1>
            <p className="text-lg font-bold text-slate-600 uppercase tracking-widest">{activeClient.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase">Erstellt am</p>
            <p className="text-sm font-bold">{new Date().toLocaleDateString('de-AT')}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Analyse: {activeAnalysis.name}</span>
          <span>Planjahr: 2024</span>
          <span>Rechtsform: {activeClient.legalForm}</span>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        {[
          { label: 'Umsatzerlöse', val: figures.revenue, sub: 'Planperiode gesamt', color: 'text-slate-900 dark:text-white' },
          { label: 'Deckungsbeitrag 1', val: figures.db1, sub: `${db1Margin.toFixed(1)}% Marge`, color: 'text-slate-900 dark:text-white' },
          { label: 'EBITDA', val: figures.ebitda, sub: `${ebitdaMargin.toFixed(1)}% Marge`, color: 'text-slate-900 dark:text-white' },
          { label: 'Personalkosten', val: figures.personnel, sub: `${((figures.personnel/figures.revenue)*100).toFixed(1)}% Quote`, color: 'text-slate-900 dark:text-white' },
          { label: 'Gesamtfixkosten', val: figures.totalFixedCosts, sub: 'Inkl. AfA & Finanzen', color: 'text-slate-900 dark:text-white' },
          { label: 'Plan-Ergebnis (EGT)', val: figures.result, sub: `${resultMargin.toFixed(1)}% Rendite`, color: 'text-blue-600', highlight: true },
        ].map((kpi, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${kpi.highlight ? 'bg-blue-50/30 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} print:border-slate-300 print:shadow-none`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
            <h4 className={`text-2xl font-black tracking-tight mb-1 ${kpi.color}`}>{formatCurrency(kpi.val)}</h4>
            <p className="text-[10px] font-bold text-slate-400 italic">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:grid-cols-12 print:gap-4">
        {/* Trend Chart */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 print:border-slate-300 print:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-600" /> Ergebnisentwicklung monatlich
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Ergebnis" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRes)" strokeWidth={3} />
                <Line type="monotone" dataKey="Umsatz" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Structure */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 print:border-slate-300 print:col-span-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
            <PieIcon size={14} className="text-slate-400" /> Kostenstruktur
          </h3>
          <div className="space-y-5">
            {costStructure.map((cost, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-500">{cost.name}</span>
                  <span className="text-slate-900 dark:text-white">{formatNumber(cost.value)} €</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${(cost.value / figures.revenue) * 100}%`,
                      backgroundColor: cost.color
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Analyse-Hinweis</p>
             <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
               Die Kostenstruktur zeigt eine gesunde Balance. Die Personalkostenquote liegt im Branchenmittel.
             </p>
          </div>
        </div>
      </div>

      {/* Footer Info for Print */}
      <div className="hidden print:flex justify-between items-center mt-20 pt-6 border-t border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">
        <span>© TaxFlow Austria Business Intelligence</span>
        <span>Vertraulich • Nur für interne Verwendung</span>
        <span>Seite 1 / 1</span>
      </div>
    </div>
  );
};
