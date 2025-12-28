
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
  PieChart as PieIcon,
  X,
  CheckCircle2
} from 'lucide-react';
import { LoanItem, LoanType } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, PieChart } from 'recharts';

const LOAN_TYPE_CONFIG: Record<LoanType, { icon: React.ReactNode, color: string }> = {
  'Immobilien': { icon: <Building2 size={16} />, color: '#3b82f6' },
  'Betriebsmittel': { icon: <Briefcase size={16} />, color: '#10b981' },
  'Investition': { icon: <Zap size={16} />, color: '#f59e0b' },
  'Förderung': { icon: <Percent size={16} />, color: '#8b5cf6' },
  'Sonstiges': { icon: <CreditCard size={16} />, color: '#64748b' }
};

// Eigener Tooltip für ein schöneres Erlebnis
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Jahr {label}</p>
        <p className="text-sm font-black text-white">{formatCurrency(payload[0].value)}</p>
        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
           <div 
             className="h-full bg-blue-500 transition-all duration-500" 
             style={{ width: `${(payload[0].value / payload[0].payload.initialAmount) * 100}%` }}
           />
        </div>
      </div>
    );
  }
  return null;
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
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newLoan, setNewLoan] = useState<Omit<LoanItem, 'id'>>({
    name: '',
    type: 'Investition',
    amount: 50000,
    interestRate: 3.5,
    durationYears: 10,
    installmentsPerYear: 12,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const loanToAdd = { ...newLoan, id };
    setLoans([...loans, loanToAdd]);
    setSelectedLoanId(id);
    setShowAddModal(false);
    setNewLoan({
      name: '',
      type: 'Investition',
      amount: 50000,
      interestRate: 3.5,
      durationYears: 10,
      installmentsPerYear: 12,
      startDate: new Date().toISOString().split('T')[0]
    });
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
      schedule.push({ 
        period: i, 
        year: Math.floor((i - 1) / loan.installmentsPerYear) + 1,
        annuity, 
        interest, 
        principal, 
        remainingBalance: Math.max(0, remainingBalance),
        initialAmount: loan.amount
      });
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

  // Chart-Daten auf Jahresbasis aufbereiten für die Grafik
  const chartData = useMemo(() => {
    if (!selectedCalculation || !selectedLoan) return [];
    // Wir nehmen den Wert am Ende jedes Jahres
    const yearlyPoints = [];
    // Startwert hinzufügen
    yearlyPoints.push({
      year: 0,
      remainingBalance: selectedLoan.amount,
      initialAmount: selectedLoan.amount
    });
    
    for (let y = 1; y <= selectedLoan.durationYears; y++) {
      const lastMonthOfYear = y * selectedLoan.installmentsPerYear;
      const point = selectedCalculation.schedule[lastMonthOfYear - 1];
      if (point) {
        yearlyPoints.push({
          year: y,
          remainingBalance: point.remainingBalance,
          initialAmount: selectedLoan.amount
        });
      }
    }
    return yearlyPoints;
  }, [selectedCalculation, selectedLoan]);

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
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
        >
          <Plus size={16} /> Finanzierung hinzufügen
        </button>
      </div>

      {/* KPI Cards */}
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

        <div className="lg:col-span-8 space-y-6">
          {selectedLoan && selectedCalculation ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-4 flex-1">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Finanzierungs-Bezeichnung</label>
                     <input 
                      className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white border-none p-0 focus:ring-0"
                      value={selectedLoan.name}
                      onChange={(e) => updateLoan(selectedLoan.id, { name: e.target.value })}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zins (%)</label>
                        <input type="number" step="0.1" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-sm" value={selectedLoan.interestRate} onChange={(e) => updateLoan(selectedLoan.id, { interestRate: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Laufzeit (Jahre)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-sm" value={selectedLoan.durationYears} onChange={(e) => updateLoan(selectedLoan.id, { durationYears: Number(e.target.value) })} />
                      </div>
                   </div>
                </div>
                <div className="bg-blue-600 p-8 rounded-[32px] text-white flex flex-col justify-center min-w-[260px] shadow-xl shadow-blue-500/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Annuität / Monat</p>
                  <h4 className="text-3xl font-black">{formatCurrency(selectedCalculation.annuity * (selectedLoan.installmentsPerYear / 12))}</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
                    <Calendar size={12} className="opacity-60" /> 
                    <span>Startdatum: <span className="opacity-100">{selectedLoan.startDate}</span></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restschuld-Verlauf (Entwicklung)</h3>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">linear reduziert</span>
                   </div>
                   <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                          label={{ value: 'Jahre', position: 'insideBottom', offset: -5, fontSize: 8, fontWeight: 900, fill: '#cbd5e1' }}
                        />
                        <YAxis hide domain={[0, 'dataMax + 10000']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                          type="monotone" 
                          dataKey="remainingBalance" 
                          stroke="#3b82f6" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorDebt)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kostenanalyse & Rückzahlung</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Darlehensbetrag', value: formatCurrency(selectedLoan.amount), icon: <Euro size={14} />, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Zinskosten (gesamt)', value: formatCurrency(selectedCalculation.totalInterest), icon: <TrendingDown size={14} />, color: 'bg-red-50 text-red-500' },
                      { label: 'Gesamt-Belastung', value: formatCurrency(selectedCalculation.totalPayment), icon: <Zap size={14} />, color: 'bg-amber-50 text-amber-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${item.color}`}>{item.icon}</div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-2">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tilgungsplan Detail</h3>
                     <span className="text-[9px] font-bold text-slate-400 italic">(Auszug erste 24 Perioden)</span>
                   </div>
                   <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100">
                     <Download size={14} /> Excel Export
                   </button>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-100 dark:border-slate-800">
                   <table className="w-full text-[10px]">
                     <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="p-4 text-left">Monat</th>
                          <th className="p-4 text-right">Zinsanteil</th>
                          <th className="p-4 text-right">Tilgungsanteil</th>
                          <th className="p-4 text-right bg-slate-100/30">Restschuld</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium">
                        {selectedCalculation.schedule.slice(0, 24).map(s => (
                          <tr key={s.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="p-4 text-slate-400 font-bold">{s.period}. Monat</td>
                            <td className="p-4 text-right text-red-500">{formatNumber(s.interest)} €</td>
                            <td className="p-4 text-right text-emerald-600 font-bold">{formatNumber(s.principal)} €</td>
                            <td className="p-4 text-right font-black bg-slate-50/20">{formatNumber(s.remainingBalance)} €</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-20 bg-slate-50 dark:bg-slate-900/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[32px] shadow-xl flex items-center justify-center text-slate-300 mb-8 border border-slate-100 dark:border-slate-700">
                 <CreditCard size={48} className="animate-pulse" />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Keine Auswahl aktiv</h3>
               <p className="text-sm text-slate-400 max-w-sm leading-relaxed">Bitte wählen Sie links eine bestehende Finanzierung aus oder erfassen Sie eine neue Investition über den Button oben rechts.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD LOAN MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-500/20">
                  <Plus size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Finanzierung anlegen</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Grundparameter definieren</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLoan} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name der Finanzierung</label>
                <input 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 text-sm font-black outline-none dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="z.B. IT-Infrastruktur 2025"
                  value={newLoan.name}
                  onChange={(e) => setNewLoan({...newLoan, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategorie</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-5 text-sm font-bold outline-none dark:text-white"
                    value={newLoan.type}
                    onChange={(e) => setNewLoan({...newLoan, type: e.target.value as LoanType})}
                  >
                    {Object.keys(LOAN_TYPE_CONFIG).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Auszahlungsdatum</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-5 text-sm font-bold outline-none dark:text-white"
                    value={newLoan.startDate}
                    onChange={(e) => setNewLoan({...newLoan, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[32px] border border-blue-100 dark:border-blue-900/30 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Netto-Darlehensbetrag (€)</label>
                  <div className="relative">
                    <Euro className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                    <input 
                      type="number"
                      required
                      className="w-full bg-white dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl pl-14 pr-6 py-5 text-xl font-black text-blue-600 outline-none shadow-sm focus:border-blue-500"
                      value={newLoan.amount}
                      onChange={(e) => setNewLoan({...newLoan, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Nominalzins (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input 
                        type="number" step="0.1"
                        required
                        className="w-full bg-white dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl pl-14 pr-6 py-4 text-base font-black text-blue-600 outline-none"
                        value={newLoan.interestRate}
                        onChange={(e) => setNewLoan({...newLoan, interestRate: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Laufzeit (Jahre)</label>
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input 
                        type="number"
                        required
                        className="w-full bg-white dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl pl-14 pr-6 py-4 text-base font-black text-blue-600 outline-none"
                        value={newLoan.durationYears}
                        onChange={(e) => setNewLoan({...newLoan, durationYears: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-xs font-black text-slate-500 transition-all uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                  <CheckCircle2 size={20} /> Datensatz speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
