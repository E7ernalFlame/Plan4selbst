
import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  ShieldCheck, 
  Scale, 
  Calculator, 
  Info, 
  ArrowUpRight, 
  TrendingDown, 
  FileText, 
  Zap,
  ArrowRightCircle,
  AlertCircle,
  Briefcase,
  Home,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatting';

// Steuerstufen AT 2025 (Progressionsstufen)
const TAX_BRACKETS_2025 = [
  { threshold: 13308, rate: 0.00 },
  { threshold: 21617, rate: 0.20 },
  { threshold: 35836, rate: 0.30 },
  { threshold: 69166, rate: 0.40 },
  { threshold: 103072, rate: 0.48 },
  { threshold: 1000000, rate: 0.50 },
  { threshold: Infinity, rate: 0.55 }
];

// SVS Sätze 2025
const SVS_RATES = {
  pension: 0.185,
  health: 0.068,
  selfProvision: 0.0153,
  accidentFlat: 145
};

export const TaxCalculatorView: React.FC = () => {
  const [targetProfit, setTargetProfit] = useState(67050);
  const [actualProfit, setActualProfit] = useState(64161);
  
  // Zusätzliche Einkünfte
  const [nonSelfEmployedIncome, setNonSelfEmployedIncome] = useState(0); // KZ 245
  const [rentIncome, setRentIncome] = useState(0); // V&V
  const [prepaidWageTax, setPrepaidWageTax] = useState(0); // Bereits bezahlte Lohnsteuer

  const calculateTaxes = (profit: number, otherIncome: number, otherRent: number, paidTax: number) => {
    // 1. Sozialversicherung (SVS) - Nur auf den Gewinn aus Selbstständigkeit
    const maxBasis = 90300;
    const basis = Math.min(profit, maxBasis);
    
    const svsPension = basis * SVS_RATES.pension;
    const svsHealth = basis * SVS_RATES.health;
    const svsSeVo = basis * SVS_RATES.selfProvision;
    const svsAccident = SVS_RATES.accidentFlat;
    const totalSvs = svsPension + svsHealth + svsSeVo + svsAccident;

    // 2. Einkommensteuer (ESt)
    // Bemessungsgrundlage = (Gewinn - SVA) + Nichtselbstständige Arbeit + V&V
    const taxableIncome = Math.max(0, (profit - totalSvs) + otherIncome + otherRent);
    
    let totalEst = 0;
    let remainingIncome = taxableIncome;
    let prevThreshold = 0;

    const breakdown = TAX_BRACKETS_2025.map((bracket, i) => {
      const range = bracket.threshold - prevThreshold;
      const amountInBracket = Math.min(Math.max(0, remainingIncome), range);
      const taxInBracket = amountInBracket * bracket.rate;
      
      totalEst += taxInBracket;
      remainingIncome -= amountInBracket;
      
      const res = {
        from: prevThreshold,
        to: bracket.threshold,
        rate: bracket.rate,
        amount: amountInBracket,
        tax: taxInBracket
      };
      prevThreshold = bracket.threshold;
      return res;
    });

    // Endgültige Zahllast (ESt - bereits bezahlte Lohnsteuer)
    const finalTaxDue = totalEst - paidTax;
    const netIncome = profit - totalSvs + otherIncome + otherRent - totalEst;

    return {
      totalSvs,
      svsPension,
      svsHealth,
      svsSeVo,
      svsAccident,
      taxableIncome,
      totalEst,
      finalTaxDue,
      breakdown,
      netIncome,
      effectiveTaxRate: taxableIncome > 0 ? (totalEst / taxableIncome) * 100 : 0
    };
  };

  const actualCalc = useMemo(() => 
    calculateTaxes(actualProfit, nonSelfEmployedIncome, rentIncome, prepaidWageTax), 
    [actualProfit, nonSelfEmployedIncome, rentIncome, prepaidWageTax]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-xl shadow-blue-500/20">
                <Coins size={22} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Steuer- & Abgaben-Experte 2025</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">SVS & Einkommensteuer (Österreich)</p>
             </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gesamt-Einkommen (Netto)</p>
          <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(actualCalc.netIncome)}</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Nach SVS & Gesamt-ESt</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bemessungsgrundlage</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(actualCalc.taxableIncome)}</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Summe aller Einkunftsarten</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vorauss. Nachzahlung</p>
          <h4 className="text-2xl font-black text-red-600">{formatCurrency(Math.max(0, actualCalc.finalTaxDue))}</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">ESt abzüglich Lohnsteuer</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Effektiver Steuersatz</p>
          <h4 className="text-2xl font-black text-amber-600">{actualCalc.effectiveTaxRate.toFixed(1)} %</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Durchschnittl. Belastung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Sektion 1: Einkünfte & Gewinn */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
             <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
               <Calculator size={18} className="text-blue-600" />
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Einkunfts-Zusammenrechnung</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-blue-500" /> Gewinn aus Gewerbebetrieb (Ist)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-blue-50/50 dark:bg-blue-900/10 text-xl font-black text-blue-600 p-4 rounded-2xl outline-none border border-blue-100 dark:border-blue-900/30 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={actualProfit}
                      onChange={(e) => setActualProfit(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} className="text-amber-500" /> Nichtselbstständige Arbeit (KZ 245)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-amber-50/50 dark:bg-amber-900/10 text-xl font-black text-amber-600 p-4 rounded-2xl outline-none border border-amber-100 dark:border-amber-900/30 focus:ring-4 focus:ring-amber-500/10 transition-all"
                      value={nonSelfEmployedIncome}
                      onChange={(e) => setNonSelfEmployedIncome(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Home size={14} className="text-slate-500" /> Vermietung & Verpachtung (Überschuss)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xl font-black text-slate-700 dark:text-slate-200 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-slate-500/10 transition-all"
                      value={rentIncome}
                      onChange={(e) => setRentIncome(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-red-500">
                    <Receipt size={14} /> Anrechenbare Lohnsteuer (bezahlt)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-red-50/50 dark:bg-red-900/10 text-xl font-black text-red-600 p-4 rounded-2xl outline-none border border-red-100 dark:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all"
                      value={prepaidWageTax}
                      onChange={(e) => setPrepaidWageTax(Number(e.target.value))}
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* SVS Sektion */}
          <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" /> Sozialversicherung (nur Gewerbebetrieb)
              </h3>
            </div>
            <div className="p-0">
               <table className="w-full text-xs">
                 <thead>
                   <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20">
                     <th className="p-4 text-left">Beitrags-Komponente</th>
                     <th className="p-4 text-right">Satz</th>
                     <th className="p-4 text-right w-40 bg-blue-50/20 dark:bg-blue-900/5">Betrag (€)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    <tr className="font-medium">
                      <td className="p-4 text-slate-500">Pensionsversicherung</td>
                      <td className="p-4 text-right font-bold">18,50%</td>
                      <td className="p-4 text-right font-black text-blue-600">{formatNumber(actualCalc.svsPension)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="p-4 text-slate-500">Krankenversicherung</td>
                      <td className="p-4 text-right font-bold">6,80%</td>
                      <td className="p-4 text-right font-black text-blue-600">{formatNumber(actualCalc.svsHealth)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="p-4 text-slate-500">Selbstständigenvorsorge (SeVo)</td>
                      <td className="p-4 text-right font-bold">1,53%</td>
                      <td className="p-4 text-right font-black text-blue-600">{formatNumber(actualCalc.svsSeVo)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="p-4 text-slate-500">Unfallversicherung</td>
                      <td className="p-4 text-right font-bold">Fixum</td>
                      <td className="p-4 text-right font-black text-blue-600">{formatNumber(actualCalc.svsAccident)}</td>
                    </tr>
                 </tbody>
                 <tfoot className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest">
                    <tr>
                      <td colSpan={2} className="p-5 text-right opacity-60">Summe SVS-Beiträge (Betriebsausgabe)</td>
                      <td className="p-5 text-right text-blue-400 bg-blue-950/20">{formatCurrency(actualCalc.totalSvs)}</td>
                    </tr>
                 </tfoot>
               </table>
            </div>
          </section>

          {/* ESt Sektion */}
          <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Scale size={16} className="text-emerald-600" /> Tarifliche Einkommensteuer 2025 (Global)
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-xs min-w-[600px]">
                 <thead>
                   <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-50 dark:border-slate-800">
                     <th className="p-4 text-left">Progressionsstufe</th>
                     <th className="p-4 text-right">Steuersatz</th>
                     <th className="p-4 text-right">Steuer-Betrag (€)</th>
                     <th className="p-4 text-right">Kumuliert (€)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {actualCalc.breakdown.map((row, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all ${row.tax > 0 ? 'bg-emerald-50/10' : ''}`}>
                        <td className="p-4 font-bold text-slate-500">
                          {formatNumber(row.from)} € {row.to === Infinity ? '+' : `- ${formatNumber(row.to)} €`}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                          {(row.rate * 100).toFixed(0)}%
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600">
                          {formatNumber(row.tax)}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-400">
                          {formatNumber(actualCalc.breakdown.slice(0, i + 1).reduce((sum, r) => sum + r.tax, 0))}
                        </td>
                      </tr>
                    ))}
                 </tbody>
                 <tfoot className="bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest">
                    <tr>
                      <td colSpan={2} className="p-5 text-right">Tarifsteuer gesamt</td>
                      <td colSpan={2} className="p-5 text-right text-lg">{formatCurrency(actualCalc.totalEst)}</td>
                    </tr>
                    <tr className="bg-red-600 border-t border-red-500">
                      <td colSpan={2} className="p-5 text-right opacity-80 italic">abzüglich anrechenbare Lohnsteuer</td>
                      <td colSpan={2} className="p-5 text-right text-lg">-{formatCurrency(prepaidWageTax)}</td>
                    </tr>
                    <tr className="bg-slate-900">
                      <td colSpan={2} className="p-6 text-right text-blue-400">Voraussichtliche Abschlusszahlung (ESt-Zahllast)</td>
                      <td colSpan={2} className="p-6 text-right text-2xl text-amber-400">{formatCurrency(actualCalc.finalTaxDue)}</td>
                    </tr>
                 </tfoot>
               </table>
            </div>
          </section>
        </div>

        {/* Rechte Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full transition-all group-hover:scale-110" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
              <TrendingDown size={14} /> Progressions-Check
            </h4>
            <div className="space-y-4">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Effektive Grenzsteuer</p>
                  <p className="text-xl font-black text-white">{(TAX_BRACKETS_2025.find(b => b.threshold > actualCalc.taxableIncome)?.rate || 0.55) * 100} %</p>
                  <p className="text-[9px] text-slate-400 italic mt-1">Satz für den nächsten Euro Einkommen</p>
               </div>
               
               <div className="h-px bg-white/10" />
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Abgaben-Mix</p>
                    <p className="text-sm font-black text-red-400">{formatCurrency(actualCalc.totalSvs + actualCalc.totalEst)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Netto-Marge</p>
                    <p className="text-sm font-black text-emerald-400">
                      {actualCalc.taxableIncome > 0 ? (actualCalc.netIncome / actualCalc.taxableIncome * 100).toFixed(1) : 0}%
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
             <div className="flex gap-4 items-start">
               <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                  <Info size={20} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Profi-Tipp: Progression</h4>
                  <p className="text-[11px] text-slate-500 leading-normal italic">
                    In Österreich werden alle Einkunftsarten zusammengerechnet. Das Gehalt aus der Anstellung kann Ihren Gewinn aus dem Nebengewerbe in eine höhere Steuerstufe heben.
                  </p>
               </div>
             </div>
             
             <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
               <div className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest mb-3">
                  <AlertCircle size={14} /> Vorsicht Nachzahlung
               </div>
               <p className="text-[11px] text-red-800 dark:text-red-400 leading-relaxed">
                 Wenn Sie bereits Lohnsteuer als Dienstnehmer zahlen, wird die ESt-Vorschreibung für den Gewinn oft als **Nachzahlung** fällig, da der Grundfreibetrag bereits beim Gehalt verbraucht ist.
               </p>
             </div>

             <div className="space-y-3 pt-4">
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group transition-all hover:bg-slate-900 hover:text-white">
                   <div className="flex items-center gap-3">
                      <Receipt size={18} className="text-slate-400 group-hover:text-blue-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Lohnzettel-Daten importieren</span>
                   </div>
                   <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
