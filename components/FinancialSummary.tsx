
import React from 'react';
import { formatCurrency } from '../utils/formatting';
import { DollarSign, Percent, Zap, Activity } from 'lucide-react';

interface FinancialSummaryProps {
  metrics: {
    revenue: number;
    db1: number;
    ebitda: number;
    result: number;
  };
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ metrics }) => {
  const db1Margin = metrics.revenue ? (metrics.db1 / metrics.revenue) * 100 : 0;
  const netMargin = metrics.revenue ? (metrics.result / metrics.revenue) * 100 : 0;

  const cards = [
    { label: 'Umsatzerlöse', value: metrics.revenue, icon: <DollarSign size={20} className="text-blue-600" />, color: 'blue' },
    { label: 'Deckungsbeitrag 1', value: metrics.db1, subValue: `${db1Margin.toFixed(1)}% Marge`, icon: <Percent size={18} className="text-emerald-600" />, color: 'emerald' },
    { label: 'EBITDA (Cashflow)', value: metrics.ebitda, icon: <Zap size={18} className="text-purple-600" />, color: 'purple' },
    { label: 'Planjahres-Überschuss', value: metrics.result, subValue: `${netMargin.toFixed(1)}% Rendite`, icon: <Activity size={18} className="text-amber-600" />, color: 'amber' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-125" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700`}>
              {card.icon}
            </div>
            {/* Trend-Anzeige wurde hier entfernt */}
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">{card.label}</p>
            <div className="flex flex-col">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                {formatCurrency(card.value)}
              </h4>
              {card.subValue && (
                <span className={`text-[11px] font-bold mt-1 inline-flex items-center gap-1 ${
                  card.color === 'emerald' ? 'text-emerald-500' : 
                  card.color === 'amber' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {card.subValue}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
