
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Info, 
  TrendingDown, 
  Calendar, 
  Percent, 
  Euro, 
  Plus,
  Trash2,
  Download,
  Clock,
  Building2,
  Briefcase,
  Zap,
  ChevronRight,
  PieChart as PieIcon
} from 'lucide-react';
import { LoanItem, LoanType } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Cell, Pie } from 'recharts';

const LOAN_TYPE_CONFIG: Record<LoanType, { icon: React.ReactNode, color: string }> = {
  'Immobilien': { icon: <Building2 size={16} />, color: '#3b82f6' },
  'Betriebsmittel': { icon: <Briefcase size={16} />, color: '#10b981' },
  'Investition': { icon: <Zap size={16} />, color: '#f59e0b' },
  'Förderung': { icon: <Percent size={16} />, color: '#8b5cf6' },
  'Sonstiges': { icon: <CreditCard size={16} />, color: '#64748b' }
};

export const CreditCalculatorView: React.FC = () => {
  const [loans, setLoans] = useState<LoanItem[]>([
    { 
      id: '1', name: 'Betriebsgebäude Graz', type: 'Immobilien', 
      amount: 450000, interestRate: 2.8, durationYears: 20, installmentsPerYear: 12, startDate: '2023-01-01' 
    },
    { 
      id: '2', name: 'Fuhrpark Erweiterung', type: 'Investition', 
      amount: 85000, interestRate: 4.2, durationYears: 5, installmentsPerYear: 12, startDate: '2024-05-01' 
    }
  ]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(loans[0]?.id || null);

  const addLoan = () => {
    const newLoan: LoanItem = {
      id: Date.now().toString(),
      name: 'Neue Finanzierung',
      type: 'Investition',
      amount: 100000,
      interestRate: 3.5,
      durationYears: 10,
      installmentsPerYear: 12,
      startDate: new Date().toISOString().split('T')[0]
    };
    setLoans([...loans, newLoan]);
    setSelectedLoanId(newLoan.id);
  };

  const updateLoan = (id: string, updates: Partial<LoanItem>) => {
    setLoans(loans.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLoan = (id: string) => {
    const nextLoans = loans.filter(l => l.id !== id);
    setLoans(nextLoans);
    if (selectedLoanId === id) setSelectedLoanId(nextLoans[0]?.id || null);
  };

  const calculateLoan = (loan: LoanItem) => {
    const n = loan.durationYears * loan.installmentsPerYear;
    const r = (loan.interestRate / 100) / loan.installmentsPerYear;
    const annuity = loan.amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    const schedule = [];
    let remainingBalance = loan.amount;
    let totalInterest = 0;

    for (let i = 1; i <= n; i++) {
      const interest = remainingBalance * r;
      const principal = annuity - interest;
      remainingBalance -= principal;
      totalInterest += interest;
      schedule.push({ period: i, annuity, interest, principal, remainingBalance: Math.max(0, remainingBalance) });
    }

    return { annuity, totalInterest, totalPayment: loan.amount + totalInterest, schedule };
  };

  const portfolioMetrics = useMemo(() => {
    return loans.reduce((acc, loan) => {
      const { annuity, totalInterest } = calculateLoan(loan);
      return {
        totalOutstanding: acc.totalOutstanding + loan.amount,
        totalMonthlyBurden: acc.totalMonthlyBurden + (annuity * (loan.installmentsPerYear / 12)),
        totalInterest: acc.totalInterest + totalInterest,
        weightedInterest: acc.weightedInterest + (loan.interestRate * loan.amount)
      };
    }, { totalOutstanding: 0, totalMonthlyBurden: 0, totalInterest: 0, weightedInterest: 0 });
  }, [loans]);

  const avgInterest = portfolioMetrics.totalOutstanding > 0 
    ? portfolioMetrics.weightedInterest / portfolioMetrics.totalOutstanding 
    : 0;

  const pieData = useMemo(() => {
    const types = loans.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + l.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [loans]);

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const selectedCalculation = selectedLoan ? calculateLoan(selectedLoan) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-slate-900 p-2 rounded-lg text-white shadow-lg">
                <CreditCard size={20} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Finanzierungs-Portfolio</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic pl-11">Konsolidierte Ansicht aller Unternehmenskredite</p>
        </div>
        <button onClick={addLoan} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
          <Plus size={16} /> Finanzierung hinzufügen
        </button>
      </div>

      {/* Portfolio Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamtobligo', value: formatCurrency(portfolioMetrics.totalOutstanding), color: 'text-slate-900 dark:text-white', sub: 'Aktuelles Kapital' },
          { label: 'Ø Zinssatz', value: `${avgInterest.toFixed(2)}%`, color: 'text-blue-600', sub: 'Gewichtet nach Volumen' },
          { label: 'Rate / Monat gesamt', value: formatCurrency(portfolioMetrics.totalMonthlyBurden), color: 'text-emerald-600', sub: 'Liquiditätswirksam' },
          { label: 'Zinskosten (Lifetime)', value: formatCurrency(portfolioMetrics.totalInterest), color: 'text-red-500', sub: 'Portfolio-Aufwand' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className={`text-2xl font-black leading-none mb-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-slate-400 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Loan List & Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <PieIcon size={14} /> Portfolio-Struktur
            </h3>
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LOAN_TYPE_CONFIG[entry.name as LoanType]?.color || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Finanzierungen</h3>
              {loans.map(loan => (
                <div 
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer group relative ${
                    selectedLoanId === loan.id 
                      ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedLoanId === loan.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {LOAN_TYPE_CONFIG[loan.type].icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{loan.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{loan.type} • {loan.interestRate}%</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`text-slate-300 transition-transform ${selectedLoanId === loan.id ? 'translate-x-1 text-blue-600' : ''}`} />
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-200">{formatCurrency(loan.amount)}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLoan(loan.id); }}
                      className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detailed Calculator for Selected Loan */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLoan && selectedCalculation ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-4 flex-1">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Finanzierungs-Bezeichnung</label>
                     <input 
                      className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white border-none p-0 focus:ring-0"
                      value={selectedLoan.name}
                      onChange={(e) => updateLoan(selectedLoan.id, { name: e.target.value })}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zins (%)</label>
                        <input type="number" step="0.1" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2 font-bold text-sm" value={selectedLoan.interestRate} onChange={(e) => updateLoan(selectedLoan.id, { interestRate: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laufzeit (J)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2 font-bold text-sm" value={selectedLoan.durationYears} onChange={(e) => updateLoan(selectedLoan.id, { durationYears: Number(e.target.value) })} />
                      </div>
                   </div>
                </div>
                <div className="bg-blue-600 p-8 rounded-[32px] text-white flex flex-col justify-center min-w-[240px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Rate / Monat</p>
                  <h4 className="text-3xl font-black">{formatCurrency(selectedCalculation.annuity * (selectedLoan.installmentsPerYear / 12))}</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
                    <Calendar size={12} /> Startet am {selectedLoan.startDate}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Restschuld-Verlauf</h3>
                   <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedCalculation.schedule.filter((_, idx) => idx % selectedLoan.installmentsPerYear === 0)}>
                        <defs>
                          <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="period" hide />
                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="remainingBalance" name="Restschuld" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoan)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Finanzierungsdetails</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Darlehensbetrag', value: formatCurrency(selectedLoan.amount), icon: <Euro size={14} /> },
                      { label: 'Zinskosten (Laufzeit)', value: formatCurrency(selectedCalculation.totalInterest), icon: <TrendingDown size={14} className="text-red-500" /> },
                      { label: 'Gesamt-Rückzahlung', value: formatCurrency(selectedCalculation.totalPayment), icon: <Zap size={14} className="text-amber-500" /> },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{item.icon}</span>
                          <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tilgungsplan</h3>
                   <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">
                     <Download size={12} /> Excel Tilgungsplan
                   </button>
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-2xl">
                   <table className="w-full text-[10px]">
                     <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="p-3 text-left">P</th>
                          <th className="p-3 text-right">Zins</th>
                          <th className="p-3 text-right">Tilgung</th>
                          <th className="p-3 text-right">Rest</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium">
                        {selectedCalculation.schedule.slice(0, 24).map(s => (
                          <tr key={s.period}>
                            <td className="p-3 text-slate-400">{s.period}</td>
                            <td className="p-3 text-right text-red-500">{formatNumber(s.interest)}</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{formatNumber(s.principal)}</td>
                            <td className="p-3 text-right font-black">{formatNumber(s.remainingBalance)}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-20 bg-slate-50 dark:bg-slate-900/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-6">
                 <CreditCard size={40} />
               </div>
               <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Kein Kredit ausgewählt</h3>
               <p className="text-sm text-slate-400 max-w-xs">Wählen Sie eine Finanzierung aus der Liste oder legen Sie eine neue an, um die Details zu berechnen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
