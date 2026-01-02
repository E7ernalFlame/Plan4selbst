
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
  CheckCircle2,
  Link2
} from 'lucide-react';
import { LoanItem, LoanType, PlanSection } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, PieChart } from 'recharts';
import { calculateKeyFigures } from '../utils/calculations';

interface CreditCalculatorViewProps {
  sections: PlanSection[];
}

const LOAN_TYPE_CONFIG: Record<LoanType, { icon: React.ReactNode, color: string }> = {
  'Immobilien': { icon: <Building2 size={16} />, color: '#3b82f6' },
  'Betriebsmittel': { icon: <Briefcase size={16} />, color: '#10b981' },
  'Investition': { icon: <Zap size={16} />, color: '#f59e0b' },
  'Förderung': { icon: <Percent size={16} />, color: '#8b5cf6' },
  'Sonstiges': { icon: <CreditCard size={16} />, color: '#64748b' }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Monat {label}</p>
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

export const CreditCalculatorView: React.FC<CreditCalculatorViewProps> = ({ sections }) => {
  const masterFigures = useMemo(() => calculateKeyFigures(sections), [sections]);
  const [loans, setLoans] = useState<LoanItem[]>([
    { id: '1', name: 'Betriebsgebäude Graz', type: 'Immobilien', amount: 450000, interestRate: 2.8, durationYears: 20, installmentsPerYear: 12, startDate: '2023-01-01' }
  ]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(loans[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newLoan, setNewLoan] = useState({
    name: '',
    type: 'Investition' as LoanType,
    amount: 50000,
    interestRate: 3.5,
    durationMonths: 120, // UI nutzt Monate
    startDate: new Date().toISOString().split('T')[0]
  });

  const calculateLoan = (loan: LoanItem) => {
    // durationYears wird hier für die Berechnung genutzt (aus dem Data Model)
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
        annuity, 
        interest, 
        principal, 
        remainingBalance: Math.max(0, remainingBalance),
        initialAmount: loan.amount
      });
    }

    return { annuity, totalInterest, totalPayment: loan.amount + totalInterest, schedule };
  };

  const updateLoan = (id: string, updates: any) => {
    setLoans(loans.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLoan = (id: string) => {
    const nextLoans = loans.filter(l => l.id !== id);
    setLoans(nextLoans);
    if (selectedLoanId === id) setSelectedLoanId(nextLoans[0]?.id || null);
  };

  const portfolioMetrics = useMemo(() => {
    return loans.reduce((acc, loan) => {
      const { annuity, totalInterest } = calculateLoan(loan);
      return {
        totalOutstanding: acc.totalOutstanding + loan.amount,
        totalMonthlyBurden: acc.totalMonthlyBurden + (annuity * (loan.installmentsPerYear / 12)),
        totalYearlyBurden: acc.totalYearlyBurden + (annuity * loan.installmentsPerYear),
        totalInterest: acc.totalInterest + totalInterest,
        weightedInterest: acc.weightedInterest + (loan.interestRate * loan.amount)
      };
    }, { totalOutstanding: 0, totalMonthlyBurden: 0, totalYearlyBurden: 0, totalInterest: 0, weightedInterest: 0 });
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

  const chartData = useMemo(() => {
    if (!selectedCalculation || !selectedLoan) return [];
    // Für das Chart zeigen wir alle 12 Monate einen Datenpunkt
    return selectedCalculation.schedule.filter((_, idx) => idx % 12 === 0 || idx === selectedCalculation.schedule.length - 1);
  }, [selectedCalculation, selectedLoan]);

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const loanToAdd: LoanItem = {
      id,
      name: newLoan.name,
      type: newLoan.type,
      amount: newLoan.amount,
      interestRate: newLoan.interestRate,
      durationYears: newLoan.durationMonths / 12, // Konvertierung ins Model
      installmentsPerYear: 12,
      startDate: newLoan.startDate
    };
    setLoans([...loans, loanToAdd]);
    setSelectedLoanId(id);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-slate-900 p-2 rounded-lg text-white shadow-lg"><CreditCard size={20} /></div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Finanzierungs-Management</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Link2 size={14} /> Master-Sync Aktiv
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl active:scale-95">
            <Plus size={16} /> Finanzierung hinzufügen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio (Ist)', value: formatCurrency(portfolioMetrics.totalOutstanding), color: 'text-slate-900 dark:text-white', sub: 'Summe aller Kredite' },
          { label: 'Ø Zinssatz', value: `${avgInterest.toFixed(2)}%`, color: 'text-slate-400', sub: 'Gewichtet' },
          { label: 'Rate / Monat gesamt', value: formatCurrency(portfolioMetrics.totalMonthlyBurden), color: 'text-emerald-600', sub: `p.a.: ${formatCurrency(portfolioMetrics.totalYearlyBurden)}` },
          { label: 'Zinsaufwand (GuV)', value: formatCurrency(masterFigures.finance), color: 'text-blue-600', sub: 'In Master-Plan gesetzt', sync: true },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border shadow-sm ${stat.sync ? 'border-blue-400 ring-4 ring-blue-500/5' : 'border-slate-200 dark:border-slate-800'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className={`text-2xl font-black leading-none mb-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-slate-400 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><PieIcon size={14} /> Portfolio-Struktur</h3>
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={LOAN_TYPE_CONFIG[entry.name as LoanType]?.color || '#cbd5e1'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {loans.map(loan => (
                <div key={loan.id} onClick={() => setSelectedLoanId(loan.id)} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer group relative ${selectedLoanId === loan.id ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedLoanId === loan.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{LOAN_TYPE_CONFIG[loan.type].icon}</div>
                      <div><p className="text-xs font-black text-slate-900 dark:text-white">{loan.name}</p><p className="text-[10px] text-slate-400 font-bold">{loan.type} • {loan.interestRate}%</p></div>
                    </div>
                    <ChevronRight size={14} className={`text-slate-300 ${selectedLoanId === loan.id ? 'text-blue-600' : ''}`} />
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-200">{formatCurrency(loan.amount)}</p>
                    <button onClick={(e) => { e.stopPropagation(); deleteLoan(loan.id); }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
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
                     <input className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white border-none p-0 focus:ring-0" value={selectedLoan.name} onChange={(e) => updateLoan(selectedLoan.id, { name: e.target.value })} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Darlehensbetrag (€)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-black text-sm" value={selectedLoan.amount} onChange={(e) => updateLoan(selectedLoan.id, { amount: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zins (%)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-sm text-blue-600" value={selectedLoan.interestRate} onChange={(e) => updateLoan(selectedLoan.id, { interestRate: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Laufzeit (Monate)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-sm" value={selectedLoan.durationYears * 12} onChange={(e) => updateLoan(selectedLoan.id, { durationYears: Number(e.target.value) / 12 })} />
                      </div>
                   </div>
                </div>
                <div className="bg-blue-600 p-8 rounded-[32px] text-white flex flex-col justify-center min-w-[280px] shadow-xl shadow-blue-500/20">
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Annuität / Monat</p>
                    <h4 className="text-3xl font-black">{formatCurrency(selectedCalculation.annuity * (selectedLoan.installmentsPerYear / 12))}</h4>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 text-emerald-300">Annuität / Jahr</p>
                    <h4 className="text-2xl font-black text-emerald-300">{formatCurrency(selectedCalculation.annuity * selectedLoan.installmentsPerYear)}</h4>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restschuld-Verlauf</h3>
                   <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis hide domain={[0, 'dataMax + 10000']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="remainingBalance" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorDebt)" />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                </div>
                <div className="space-y-4">
                    {[
                      { label: 'Zinskosten (gesamt)', value: formatCurrency(selectedCalculation.totalInterest), color: 'text-red-500' },
                      { label: 'Gesamt-Belastung', value: formatCurrency(selectedCalculation.totalPayment), color: 'text-amber-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                        <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-20 bg-slate-50 dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <CreditCard size={48} className="text-slate-300 mb-4" />
               <h3 className="text-xl font-black text-slate-400">Keine Auswahl aktiv</h3>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 border border-slate-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-2xl font-black text-slate-900">Kredit anlegen</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLoan} className="p-10 space-y-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bezeichnung</label>
                <input required className="w-full bg-slate-50 p-5 rounded-2xl font-black" placeholder="z.B. Betriebsmittelkredit" value={newLoan.name} onChange={(e) => setNewLoan({...newLoan, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kreditsumme (€)</label>
                  <input type="number" required className="w-full bg-blue-50 p-5 rounded-2xl font-black text-blue-600" value={newLoan.amount} onChange={(e) => setNewLoan({...newLoan, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zinssatz (%)</label>
                  <input type="number" step="0.01" required className="w-full bg-blue-50 p-5 rounded-2xl font-black text-blue-600" value={newLoan.interestRate} onChange={(e) => setNewLoan({...newLoan, interestRate: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laufzeit (Monate)</label>
                <input type="number" required className="w-full bg-slate-50 p-5 rounded-2xl font-black" value={newLoan.durationMonths} onChange={(e) => setNewLoan({...newLoan, durationMonths: Number(e.target.value)})} />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Speichern</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
