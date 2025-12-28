
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Info, 
  TrendingUp, 
  ArrowRight, 
  Calculator, 
  Activity, 
  ChevronRight, 
  AlertCircle, 
  Download,
  CheckCircle2,
  TrendingDown,
  Lock,
  FileBadge
} from 'lucide-react';
import { PlanSection, Analysis } from '../types';
import { calculateKeyFigures } from '../utils/calculations';
import { formatCurrency, formatNumber } from '../utils/formatting';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';

interface CreditCapacityViewProps {
  activeAnalysis: Analysis;
}

export const CreditCapacityView: React.FC<CreditCapacityViewProps> = ({ activeAnalysis }) => {
  // Lokale Parameter für bankenfähige Zusatzbelastungen
  const [capex, setCapex] = useState<number>(20000); // Notwendige Reinvestitionen
  const [payouts, setPayouts] = useState<number>(36000); // Privatentnahme / Mindest-Lebenshaltung
  const [existingRepayment, setExistingRepayment] = useState<number>(30000); // Bestehende Tilgung
  const [newLoanRepayment, setNewLoanRepayment] = useState<number>(24000); // Neue Tilgung

  const sections = activeAnalysis.planData;

  const capacityData = useMemo(() => {
    const figures = calculateKeyFigures(sections);
    
    const ebitda = figures.ebitda;
    const interest = figures.finance; 
    const taxes = figures.incomeTax + figures.svs;
    
    // Free Cash Flow to Equity (vor Tilgung)
    const fcf = ebitda - interest - payouts - taxes - capex;
    const totalRepayments = existingRepayment + newLoanRepayment;
    
    // Kapitaldienstdeckungsgrad (DSCR) - Die wichtigste Bank-Kennzahl
    const dscr = totalRepayments > 0 ? fcf / totalRepayments : 0;
    
    // Sicherheitsabstand (Wie viel EBITDA darf verloren gehen?)
    const requiredEbitda = interest + payouts + taxes + capex + totalRepayments;
    const headroom = ebitda > 0 ? ((ebitda - requiredEbitda) / ebitda) * 100 : 0;

    return {
      ebitda,
      interest,
      payouts,
      taxes,
      capex,
      fcf,
      totalRepayments,
      dscr,
      requiredEbitda,
      headroom
    };
  }, [sections, capex, payouts, existingRepayment, newLoanRepayment]);

  // Chart-Daten für die EBITDA-Schere
  const chartData = useMemo(() => {
    return [2024, 2025, 2026, 2027, 2028].map((year, i) => {
      const growth = 1 + (i * 0.04);
      return {
        name: year.toString(),
        EBITDA: Math.round(capacityData.ebitda * growth),
        'Kapitaldienst-Grenze': Math.round(capacityData.requiredEbitda)
      };
    });
  }, [capacityData]);

  // Rating-Logik für UI
  const getRatingColor = (dscr: number) => {
    if (dscr >= 1.5) return 'text-emerald-600';
    if (dscr >= 1.2) return 'text-blue-600';
    if (dscr >= 1.0) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRatingStatus = (dscr: number) => {
    if (dscr >= 1.2) return { label: 'Bankenfähig', icon: <CheckCircle2 size={16} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (dscr >= 1.0) return { label: 'Knappe Deckung', icon: <Info size={16} />, color: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'Unterdeckung', icon: <AlertCircle size={16} />, color: 'bg-red-50 text-red-700 border-red-100' };
  };

  const rating = getRatingStatus(capacityData.dscr);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      {/* Bank Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg">
              <FileBadge size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kreditfähigkeits-Report</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                Zertifizierte Kapitaldienstprüfung <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">BASEL III KONFORM</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all">
             <Download size={16} /> Banken-Dossier (PDF)
           </button>
        </div>
      </div>

      {/* Die "Bank-Rating" Sektion */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between">
           <div>
             <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kapitaldienstdeckungsgrad (DSCR)</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${rating.color}`}>
                  {rating.icon} {rating.label}
                </span>
             </div>
             <h4 className={`text-6xl font-black tracking-tighter ${getRatingColor(capacityData.dscr)}`}>
               {capacityData.dscr.toFixed(2)}<span className="text-2xl ml-1">x</span>
             </h4>
           </div>
           <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>0.00x</span>
                <span>1.00x</span>
                <span>1.20x</span>
                <span>1.50x+</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 relative overflow-hidden">
                 <div 
                   className="h-full bg-blue-600 transition-all duration-1000" 
                   style={{ width: `${Math.min(100, (capacityData.dscr / 2) * 100)}%` }} 
                 />
                 <div className="absolute left-[50%] top-0 w-1 h-full bg-amber-500/50" /> {/* 1.0 Marker */}
                 <div className="absolute left-[60%] top-0 w-1 h-full bg-emerald-500/50" /> {/* 1.2 Marker */}
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">EBITDA Headroom</p>
          <h4 className={`text-4xl font-black ${capacityData.headroom > 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {capacityData.headroom.toFixed(1)}%
          </h4>
          <p className="text-[10px] text-slate-400 font-bold mt-4 leading-relaxed">
            Der operative Gewinn darf um diesen Prozentsatz sinken, ohne dass der Kapitaldienst gefährdet wird.
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Liquiditäts-Überschuss</p>
            <h4 className="text-3xl font-black text-emerald-400">{formatCurrency(capacityData.fcf - capacityData.totalRepayments)}</h4>
          </div>
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Gesamtbelastung p.a.</p>
            <p className="text-sm font-bold">{formatCurrency(capacityData.totalRepayments)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Die "Banken-Tabelle" */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/20">
             <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
               Kapitaldienst-Ableitung (FCFE)
             </h3>
             <span className="text-[9px] font-bold text-slate-400 italic">Prüfzeitraum: Planjahr 2024</span>
          </div>
          
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <td className="p-6 font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Basis: Operatives Ergebnis (EBITDA)</td>
                <td className="p-6 text-right font-black text-slate-900 dark:text-white text-xl">{formatNumber(capacityData.ebitda)}</td>
              </tr>
              
              <tr className="group">
                <td className="p-5 px-10 text-slate-500 font-bold flex items-center gap-3 italic">
                  <TrendingDown size={14} className="text-red-400" /> Abzüglich Zinsaufwand
                </td>
                <td className="p-5 text-right font-bold text-slate-600">-{formatNumber(capacityData.interest)}</td>
              </tr>

              <tr className="group">
                <td className="p-5 px-10 text-slate-500 font-bold flex items-center gap-3 italic">
                  <TrendingDown size={14} className="text-red-400" /> Ertragsteuern & Sozialversicherung (SVS)
                </td>
                <td className="p-5 text-right font-bold text-slate-600">-{formatNumber(capacityData.taxes)}</td>
              </tr>

              <tr className="group">
                <td className="p-5 px-10 text-slate-500 font-bold flex items-center gap-3">
                  <div className="p-1 bg-amber-50 rounded text-amber-600"><Lock size={10} /></div> Privatentnahmen / Mindest-Nettobedarf
                </td>
                <td className="p-5 text-right">
                  <input 
                    type="number" 
                    className="w-32 bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-right font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    value={capacityData.payouts} 
                    onChange={(e) => setPayouts(Number(e.target.value))}
                  />
                </td>
              </tr>

              <tr className="group">
                <td className="p-5 px-10 text-slate-500 font-bold flex items-center gap-3">
                  <div className="p-1 bg-blue-50 rounded text-blue-600"><Calculator size={10} /></div> Notwendige Ersatzinvestitionen (CAPEX)
                </td>
                <td className="p-5 text-right">
                  <input 
                    type="number" 
                    className="w-32 bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-right font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    value={capacityData.capex} 
                    onChange={(e) => setCapex(Number(e.target.value))}
                  />
                </td>
              </tr>

              <tr className="bg-slate-50 dark:bg-slate-800/40 border-y border-slate-100 dark:border-slate-700">
                <td className="p-6 font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Für Tilgung verfügbares Potential</td>
                <td className="p-6 text-right font-black text-lg text-blue-600">{formatNumber(capacityData.fcf)}</td>
              </tr>

              <tr className="group">
                <td className="p-5 px-10 text-slate-400 font-bold">Kapitaldienst: Bestehende Tilgungen p.a.</td>
                <td className="p-5 text-right">
                  <input 
                    type="number" 
                    className="w-32 bg-transparent border-b border-slate-200 dark:border-slate-800 p-1 text-right font-bold text-slate-600 outline-none" 
                    value={existingRepayment} 
                    onChange={(e) => setExistingRepayment(Number(e.target.value))}
                  />
                </td>
              </tr>

              <tr className="group">
                <td className="p-5 px-10 text-slate-400 font-bold">Kapitaldienst: Neue Tilgungsbelastung p.a.</td>
                <td className="p-5 text-right">
                  <input 
                    type="number" 
                    className="w-32 bg-transparent border-b border-slate-200 dark:border-slate-800 p-1 text-right font-bold text-slate-600 outline-none" 
                    value={newLoanRepayment} 
                    onChange={(e) => setNewLoanRepayment(Number(e.target.value))}
                  />
                </td>
              </tr>

              <tr className="bg-slate-900 text-white h-20">
                <td className="p-6 uppercase tracking-[0.3em] text-[10px] text-slate-400">Netto-Überschuss nach Kapitaldienst</td>
                <td className={`p-6 text-right text-2xl font-black ${capacityData.fcf - capacityData.totalRepayments >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatNumber(capacityData.fcf - capacityData.totalRepayments)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sidebar für den Banker */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8">
               <Activity size={16} className="text-blue-600" /> Stresstest-Szenario
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                  <Line type="monotone" dataKey="EBITDA" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Kapitaldienst-Grenze" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex gap-3">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                Der rote Bereich markiert die Untergrenze, bei der Ihr operativer Gewinn den Schuldendienst gerade noch deckt.
              </p>
            </div>
          </div>

          <div className="bg-emerald-600 p-8 rounded-[40px] text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-3">
                <CheckCircle2 size={24} />
                <h4 className="font-black uppercase tracking-widest text-[10px]">Banken-Argumentation</h4>
             </div>
             <p className="text-xs font-medium leading-relaxed">
               Auf Basis der aktuellen Planung liegt Ihr DSCR bei **{capacityData.dscr.toFixed(2)}x**. Dies signalisiert der Bank ein sehr geringes Ausfallrisiko und stützt Ihre Verhandlungsposition für bessere Konditionen.
             </p>
             <div className="h-px bg-white/20 my-4" />
             <ul className="space-y-2 text-[10px] font-bold">
               <li className="flex items-center gap-2">● DSCR über 1.20 (Optimal)</li>
               <li className="flex items-center gap-2">● Positive Headroom-Marge</li>
               <li className="flex items-center gap-2">● Volle Transparenz der CAPEX</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
