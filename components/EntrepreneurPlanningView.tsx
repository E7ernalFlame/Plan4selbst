
import React, { useState, useMemo } from 'react';
import { 
  UserCircle2, 
  Clock, 
  Calculator, 
  TrendingUp, 
  Info, 
  Save, 
  ChevronRight, 
  Calendar, 
  Sun, 
  Briefcase, 
  Heart, 
  Target,
  ArrowRightCircle
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatting';

export const EntrepreneurPlanningView: React.FC = () => {
  // --- States für Unternehmerlohn ---
  const [targetMonthlyProfit, setTargetMonthlyProfit] = useState(6000);
  
  // --- States für Auslastung ---
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [weekends, setWeekends] = useState(104);
  const [holidays, setHolidays] = useState(10);
  const [vacationDays, setVacationDays] = useState(25);
  const [sickDays, setSickDays] = useState(5);
  const [trainingDays, setTrainingDays] = useState(10);
  const [productivityPercent, setProductivityPercent] = useState(60);

  // --- Berechnungen Unternehmerlohn (Simplified AT Logic) ---
  const wageMetrics = useMemo(() => {
    const annualProfit = targetMonthlyProfit * 12;
    const gfb = annualProfit * 0.15; // Grundfreibetrag Schätzung
    const taxableProfit = Math.max(0, annualProfit - gfb);
    
    // Einfache AT ESt Schätzung (Progressiv approx.)
    const estRate = annualProfit > 60000 ? 0.35 : 0.25; 
    const est = taxableProfit * estRate;
    
    // SVS Schätzung (~18-20% vom Gewinn)
    const svs = annualProfit * 0.18;
    
    const annualNet = annualProfit - est - svs;
    const monthlyNet = annualNet / 12;

    return {
      annualProfit,
      gfb,
      taxableProfit,
      est,
      svs,
      annualNet,
      monthlyNet
    };
  }, [targetMonthlyProfit]);

  // --- Berechnungen Auslastung ---
  const capacityMetrics = useMemo(() => {
    const totalDays = 365;
    const presenceDays = totalDays - weekends - holidays - vacationDays - sickDays - trainingDays;
    const presenceHours = presenceDays * hoursPerDay;
    const billableHours = presenceHours * (productivityPercent / 100);
    const billableHoursPerMonth = billableHours / 12;
    const billableHoursPerDay = billableHours / presenceDays;

    // Selbstkosten pro Stunde
    const hourlyCost = billableHours > 0 ? wageMetrics.annualProfit / billableHours : 0;

    return {
      presenceDays,
      presenceHours,
      billableHours,
      billableHoursPerMonth,
      billableHoursPerDay,
      hourlyCost
    };
  }, [hoursPerDay, weekends, holidays, vacationDays, sickDays, trainingDays, productivityPercent, wageMetrics]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header Bereich */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-xl shadow-amber-500/20">
                <UserCircle2 size={22} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Unternehmer-Kalkulator</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Wunsch-Netto & Kapazitäts-Analyse</p>
             </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
          <Save size={16} /> Übernahme ins Budget
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empfohlener Stundensatz</p>
          <h4 className="text-2xl font-black text-amber-600">{formatCurrency(capacityMetrics.hourlyCost)}</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Mindest-Verrechnungssatz zur Kostendeckung</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Effektives Netto / Monat</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(wageMetrics.monthlyNet)}</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Nach Steuern & SVS (Schätzung)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verrechenbare Kapazität</p>
          <h4 className="text-2xl font-black text-blue-600">{formatNumber(capacityMetrics.billableHours)} Std. / Jahr</h4>
          <p className="text-[10px] text-slate-400 mt-1 italic">Bei {productivityPercent}% Auslastung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Linke Seite: Kalkulationen */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Sektion 1: Unternehmerlohn */}
          <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Calculator size={16} className="text-amber-500" /> Berechnung Unternehmerlohn
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Angestrebter Brutto-Gewinn p.M.</p>
                  <p className="text-[10px] text-slate-400 font-medium italic">Basis für Steuern & SVS</p>
                </div>
                <div className="relative">
                   <input 
                    type="number"
                    className="w-40 bg-amber-50 dark:bg-amber-900/10 text-right p-3 rounded-xl font-black text-amber-600 outline-none border border-amber-200 dark:border-amber-900/30 focus:ring-4 focus:ring-amber-500/10 transition-all"
                    value={targetMonthlyProfit}
                    onChange={(e) => setTargetMonthlyProfit(Number(e.target.value))}
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-400">€</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Wunsch-Gewinn p.a.</span>
                   <span className="font-black text-slate-700 dark:text-slate-200">{formatCurrency(wageMetrics.annualProfit)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Einkommensteuer</span>
                   <span className="font-black text-red-500">-{formatCurrency(wageMetrics.est)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Gewinnfreibetrag</span>
                   <span className="font-black text-emerald-600">{formatCurrency(wageMetrics.gfb)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Sozialversicherung</span>
                   <span className="font-black text-red-500">-{formatCurrency(wageMetrics.svs)}</span>
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-3xl text-white flex justify-between items-center">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Verbleibendes Nettoeinkommen</p>
                   <h4 className="text-2xl font-black text-emerald-400">{formatCurrency(wageMetrics.annualNet)} <span className="text-xs text-white opacity-40">p.a.</span></h4>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] font-bold text-slate-500 uppercase">Monatlich</p>
                   <p className="text-lg font-black">{formatCurrency(wageMetrics.monthlyNet)}</p>
                 </div>
              </div>
            </div>
          </section>

          {/* Sektion 2: Auslastung */}
          <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> Berechnung Auslastung & Produktivität
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                
                {/* Zeit-Inputs */}
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Anwesenheits-Annahmen (Tage)</h4>
                  {[
                    { label: 'Wochenende (Fix)', val: weekends, set: setWeekends, color: 'text-slate-400' },
                    { label: 'Feiertage', val: holidays, set: setHolidays, color: 'text-amber-600' },
                    { label: 'Urlaub / Freizeit', val: vacationDays, set: setVacationDays, color: 'text-amber-600' },
                    { label: 'Krankheit (geschätzt)', val: sickDays, set: setSickDays, color: 'text-amber-600' },
                    { label: 'Fortbildung / Sonstiges', val: trainingDays, set: setTrainingDays, color: 'text-amber-600' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">{row.label}</span>
                      <input 
                        type="number"
                        className={`w-16 bg-slate-50 dark:bg-slate-800 text-right p-1.5 rounded-lg font-black outline-none border border-transparent focus:border-blue-400 ${row.color}`}
                        value={row.val}
                        onChange={(e) => row.set(Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>

                {/* Produktivität */}
                <div className="space-y-6">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Hebel & Output</h4>
                  <div className="space-y-4 p-6 bg-blue-50/30 dark:bg-blue-900/5 rounded-3xl border border-blue-100/50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest">Produktivität (%)</label>
                        <span className="text-lg font-black text-blue-600">{productivityPercent}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        value={productivityPercent}
                        onChange={(e) => setProductivityPercent(Number(e.target.value))}
                      />
                      <p className="text-[9px] text-slate-400 italic">Anteil der verrechenbaren Stunden an der Anwesenheit</p>
                    </div>

                    <div className="pt-4 border-t border-blue-100/50 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-500">Anwesenheitstage / J</span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{capacityMetrics.presenceDays} Tage</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-500">Verrechenbar / J</span>
                        <span className="font-black text-blue-600">{formatNumber(capacityMetrics.billableHours)} Std.</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-500">Verrechenbar / Monat</span>
                        <span className="font-black text-blue-600">{formatNumber(capacityMetrics.billableHoursPerMonth)} Std.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Rechte Seite: Side-Cards Erläuterungen */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-amber-600 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-3 relative z-10">
               <Heart size={24} fill="currentColor" className="text-amber-200" />
               <h4 className="font-black uppercase tracking-[0.2em] text-[10px]">Wunsch-Nettoeinkommen</h4>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-90 relative z-10">
              Hier ist das gewünschte Nettoeinkommen einzutragen, das Sie monatlich für Ihren Lebensunterhalt benötigen. 
            </p>
            <div className="h-px bg-white/20 relative z-10" />
            <p className="text-[11px] leading-relaxed italic opacity-80 relative z-10">
              Berücksichtigen Sie Miete, Kredite, Versicherungen, Urlaube und den Beitrag des Partners zum Haushalt. 
              Der Unternehmerlohn sollte höher sein als das Gehalt eines Dienstnehmers, um das unternehmerische Risiko abzugelten!
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
             <div className="flex gap-4 items-start">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                  <Target size={22} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Auslastungs-Hinweis</h4>
                  <p className="text-[11px] text-slate-500 leading-normal italic">
                    Nicht produktive Stunden betreffen die Organisation, Akquise, Marketing und Planung. 
                    Diese sind notwendig, können aber nicht direkt an Kunden fakturiert werden. 
                  </p>
               </div>
             </div>
             
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
               <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Selbstkosten-Check</h5>
               <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed mb-4">
                 Ihr Selbstkostenpreis pro Stunde liegt bei <span className="text-amber-600">{formatCurrency(capacityMetrics.hourlyCost)}</span>.
               </p>
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                  <ArrowRightCircle size={14} className="text-emerald-500" />
                  Jeder Euro darüber ist Gewinn.
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
