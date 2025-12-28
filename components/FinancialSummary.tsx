
import React from 'react';
import { formatCurrency } from '../utils/formatting';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

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
    { label: 'Umsatz gesamt', value: metrics.revenue, icon: <DollarSign className="text-blue-600" />, trend: 'up' },
    { label: 'DB 1 (Marge)', value: metrics.db1, subValue: `${db1Margin.toFixed(1)}%`, icon: <Percent className="text-emerald-600" />, trend: 'up' },
    { label: 'EBITDA', value: metrics.ebitda, icon: <TrendingUp className="text-purple-600" />, trend: 'up' },
    { label: 'Jahresüberschuss', value: metrics.result, subValue: `${netMargin.toFixed(1)}% Marge`, icon: <TrendingDown className="text-amber-600" />, trend: 'down' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              {card.icon}
            </div>
            {card.trend === 'up' ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.4%</span>
            ) : (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">-2.1%</span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-xl font-bold text-slate-900">{formatCurrency(card.value)}</h4>
            {card.subValue && <span className="text-xs font-semibold text-slate-400">{card.subValue}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
