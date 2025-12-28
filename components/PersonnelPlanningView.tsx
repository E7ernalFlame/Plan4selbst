
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Users, 
  Calendar, 
  TrendingUp, 
  Calculator,
  UserPlus,
  ShieldAlert,
  Clock,
  Euro,
  Settings2,
  FileDown
} from 'lucide-react';
import { EmployeePlanItem } from '../types';
import { formatNumber, formatCurrency } from '../utils/formatting';

// AT Standard Lohnnebenkosten Sätze (Dienstgeberanteile 2024/25)
const LNK_RATES = {
  SV_DG: 21.03, // Sozialversicherung Dienstgeber
  DB: 3.7,      // Dienstgeberbeitrag
  DZ: 0.36,     // Zuschlag zum DB
  KommSt: 3.0,  // Kommunalsteuer
  BV: 1.53      // Betriebliche Vorsorge (Abfertigung Neu)
};

const TOTAL_LNK_FACTOR = (Object.values(LNK_RATES).reduce((a, b) => a + b, 0)) / 100;

export const PersonnelPlanningView: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeePlanItem[]>([
    { 
      id: '1', nr: 1, name: 'Mag. Thomas Hager', role: 'Kanzleileitung', department: 'Management', 
      fte: 1.0, entryDate: '2018-01-01', vacationDays: 30, sickDaysAvg: 3, otherAbsences: 0,
      monthlyGross: 7500, bonusFactor: 14, otherCostsMonthly: 500 
    },
    { 
      id: '2', nr: 2, name: 'Sandra Buchhalter', role: 'Bilanzbuchhalterin', department: 'Rechnungswesen', 
      fte: 0.8, entryDate: '2020-05-01', vacationDays: 25, sickDaysAvg: 5, otherAbsences: 2,
      monthlyGross: 3800, bonusFactor: 14, otherCostsMonthly: 0 
    },
    { 
      id: '3', nr: 3, name: 'Kevin Junior', role: 'Berufsanwärter', department: 'Consulting', 
      fte: 1.0, entryDate: '2023-09-01', vacationDays: 25, sickDaysAvg: 8, otherAbsences: 0,
      monthlyGross: 2900, bonusFactor: 14, otherCostsMonthly: 0 
    },
  ]);

  const updateEmployee = (id: string, updates: Partial<EmployeePlanItem>) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addEmployee = () => {
    const nextNr = employees.length + 1;
    const newEmployee: EmployeePlanItem = {
      id: Date.now().toString(),
      nr: nextNr,
      name: '',
      role: '',
      department: '',
      fte: 1.0,
      entryDate: new Date().toISOString().split('T')[0],
      vacationDays: 25,
      sickDaysAvg: 5,
      otherAbsences: 0,
      monthlyGross: 0,
      bonusFactor: 14,
      otherCostsMonthly: 0
    };
    setEmployees([...employees, newEmployee]);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id).map((e, idx) => ({ ...e, nr: idx + 1 })));
  };

  const calculateEmployeeMetrics = (emp: EmployeePlanItem) => {
    // 1. Kapazität (Abwesenheit)
    const workDaysYear = 260; // Mo-Fr Basis
    const effectiveDays = workDaysYear - emp.vacationDays - emp.sickDaysAvg - emp.otherAbsences;
    const availabilityPercent = (effectiveDays / workDaysYear) * 100;

    // 2. Kosten (Österreich Logik)
    const yearlyBaseGross = emp.monthlyGross * emp.fte * emp.bonusFactor;
    const yearlyOther = emp.otherCostsMonthly * 12 * emp.fte;
    const totalYearlyGross = yearlyBaseGross + yearlyOther;
    
    const lnkEuro = totalYearlyGross * TOTAL_LNK_FACTOR;
    const totalDGCost = totalYearlyGross + lnkEuro;

    return { 
      availabilityPercent, 
      totalDGCost, 
      lnkEuro, 
      totalYearlyGross,
      monthlyAvgCost: totalDGCost / 12
    };
  };

  const totals = useMemo(() => {
    return employees.reduce((acc, emp) => {
      const metrics = calculateEmployeeMetrics(emp);
      return {
        cost: acc.cost + metrics.totalDGCost,
        fte: acc.fte + emp.fte,
        gross: acc.gross + metrics.totalYearlyGross,
        lnk: acc.lnk + metrics.lnkEuro
      };
    }, { cost: 0, fte: 0, gross: 0, lnk: 0 });
  }, [employees]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header Bereich */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
                <Users size={20} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personalplanung (3-Säulen-Modell)</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic pl-11">Kalkulation nach österreichischem Arbeits- und Abgabenrecht</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-50 transition-all">
             <FileDown size={16} /> Export PDF
           </button>
           <button onClick={addEmployee} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-500/20">
             <UserPlus size={16} /> Mitarbeiter hinzufügen
           </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Personalbudget / Jahr', value: formatCurrency(totals.cost), icon: <Euro className="text-blue-600" />, sub: 'Inkl. LNK & 13./14.' },
          { label: 'Kapazität (FTE)', value: totals.fte.toFixed(2), icon: <Clock className="text-emerald-600" />, sub: 'Vollzeitäquivalente' },
          { label: 'Ø LNK-Aufschlag', value: `${(TOTAL_LNK_FACTOR * 100).toFixed(2)}%`, icon: <ShieldAlert className="text-amber-600" />, sub: 'Dienstgeberanteile AT' },
          { label: 'Bruttolohnsumme', value: formatCurrency(totals.gross), icon: <Calculator className="text-purple-600" />, sub: 'Lohnaufwand Basis' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">{stat.icon}</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stat.value}</h4>
            <p className="text-[10px] text-slate-400 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Haupt-Tabelle */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs min-w-[1400px]">
            <thead>
              {/* Sektions-Header */}
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                <th colSpan={3} className="bg-slate-100 dark:bg-slate-800/20 h-2"></th>
                <th colSpan={4} className="bg-blue-600 py-3 text-center border-r border-white/10">Säule I: Grunddaten & Status</th>
                <th colSpan={3} className="bg-amber-500 py-3 text-center border-r border-white/10">Säule II: Abwesenheit (Tage/J)</th>
                <th colSpan={5} className="bg-slate-800 py-3 text-center">Säule III: Personalkosten (€)</th>
              </tr>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest">
                <th className="p-4 w-12 text-center">Nr</th>
                <th className="p-4 w-[250px] text-left">Mitarbeiter / Name</th>
                <th className="p-4 w-[150px] text-left">Funktion</th>
                <th className="p-4 w-[120px] text-left">Abteilung</th>
                <th className="p-4 w-[140px] text-center">Eintritt</th>
                <th className="p-4 w-[80px] text-right">FTE</th>
                <th className="p-4 w-[100px] text-right border-r border-slate-200/50">Verfügb. %</th>
                
                <th className="p-4 w-[100px] text-right text-amber-700">Urlaub</th>
                <th className="p-4 w-[100px] text-right text-amber-700">Krank</th>
                <th className="p-4 w-[100px] text-right text-amber-700 border-r border-slate-200/50">Sonst.</th>
                
                <th className="p-4 w-[120px] text-right">Brutto/M</th>
                <th className="p-4 w-[80px] text-center">Faktor</th>
                <th className="p-4 w-[120px] text-right">LNK (J)</th>
                <th className="p-4 w-[150px] text-right bg-blue-50/30 dark:bg-blue-900/10 text-slate-900 dark:text-white">Gesamt / J</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const metrics = calculateEmployeeMetrics(emp);
                return (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="p-4 text-center font-bold text-slate-300">{emp.nr}.</td>
                    
                    {/* Grunddaten */}
                    <td className="p-2">
                      <input 
                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 rounded-xl p-2 font-bold text-slate-900 dark:text-white outline-none focus:bg-white transition-all"
                        value={emp.name}
                        onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                        placeholder="Mitarbeiter Name..."
                      />
                    </td>
                    <td className="p-2 text-slate-500">
                      <input 
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded-xl p-2 font-medium outline-none focus:bg-white transition-all"
                        value={emp.role}
                        onChange={(e) => updateEmployee(emp.id, { role: e.target.value })}
                        placeholder="z.B. IT..."
                      />
                    </td>
                    <td className="p-2">
                       <select 
                        className="w-full bg-transparent border-none font-bold text-slate-500 outline-none cursor-pointer"
                        value={emp.department}
                        onChange={(e) => updateEmployee(emp.id, { department: e.target.value })}
                      >
                        <option value="">Abteilung...</option>
                        <option value="Management">Management</option>
                        <option value="Rechnungswesen">Rechnungswesen</option>
                        <option value="Consulting">Consulting</option>
                        <option value="IT">IT</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input 
                        type="date"
                        className="w-full bg-transparent border-none text-center font-bold text-slate-400 outline-none"
                        value={emp.entryDate}
                        onChange={(e) => updateEmployee(emp.id, { entryDate: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" step="0.1" max="1" min="0"
                        className="w-full bg-blue-50/30 border border-transparent hover:border-blue-200 rounded-xl p-2 font-black text-right text-blue-600 outline-none focus:bg-white transition-all"
                        value={emp.fte}
                        onChange={(e) => updateEmployee(emp.id, { fte: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-4 text-right font-bold text-slate-400 border-r border-slate-200/50">
                      {metrics.availabilityPercent.toFixed(1)}%
                    </td>

                    {/* Abwesenheit */}
                    <td className="p-2 bg-amber-50/10">
                      <input 
                        type="number"
                        className="w-full bg-transparent border border-transparent hover:border-amber-200 rounded-xl p-2 font-black text-right text-amber-600 outline-none focus:bg-white transition-all"
                        value={emp.vacationDays}
                        onChange={(e) => updateEmployee(emp.id, { vacationDays: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-2 bg-amber-50/10">
                      <input 
                        type="number"
                        className="w-full bg-transparent border border-transparent hover:border-amber-200 rounded-xl p-2 font-black text-right text-amber-600 outline-none focus:bg-white transition-all"
                        value={emp.sickDaysAvg}
                        onChange={(e) => updateEmployee(emp.id, { sickDaysAvg: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-2 bg-amber-50/10 border-r border-slate-200/50">
                      <input 
                        type="number"
                        className="w-full bg-transparent border border-transparent hover:border-amber-200 rounded-xl p-2 font-black text-right text-amber-600 outline-none focus:bg-white transition-all"
                        value={emp.otherAbsences}
                        onChange={(e) => updateEmployee(emp.id, { otherAbsences: Number(e.target.value) })}
                      />
                    </td>

                    {/* Personalkosten */}
                    <td className="p-2">
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 rounded-xl p-2 pr-6 font-black text-right outline-none focus:bg-white transition-all"
                          value={emp.monthlyGross}
                          onChange={(e) => updateEmployee(emp.id, { monthlyGross: Number(e.target.value) })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">€</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <select 
                        className="w-full bg-transparent border-none font-bold text-center outline-none cursor-pointer text-slate-500"
                        value={emp.bonusFactor}
                        onChange={(e) => updateEmployee(emp.id, { bonusFactor: Number(e.target.value) })}
                      >
                        <option value={12}>12x</option>
                        <option value={13}>13x</option>
                        <option value={14}>14x (AT)</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-400">
                      {formatNumber(metrics.lnkEuro)}
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/10">
                      {formatNumber(metrics.totalDGCost)} €
                    </td>

                    {/* Löschen */}
                    <td className="p-4 text-center">
                      <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-sm">
                <td colSpan={13} className="p-5 text-right uppercase tracking-[0.2em] text-[10px] text-slate-500">Gesamtbudget Personal Planjahr</td>
                <td className="p-5 text-right text-amber-400 text-lg border-l border-slate-800">{formatNumber(totals.cost)} €</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer Tools & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <Settings2 size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Konfiguration Dienstgeberabgaben (Referenz AT 2024)</h4>
              <p className="text-[10px] text-slate-400 font-medium">Diese Sätze fließen in die automatische Kalkulation ein.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'SV-DG', rate: LNK_RATES.SV_DG, desc: 'Sozialvers.' },
              { label: 'DB', rate: LNK_RATES.DB, desc: 'DG-Beitrag' },
              { label: 'DZ', rate: LNK_RATES.DZ, desc: 'Zuschlag DB' },
              { label: 'KommSt', rate: LNK_RATES.KommSt, desc: 'Komm. Steuer' },
              { label: 'Abf. Neu', rate: LNK_RATES.BV, desc: 'Betr. Vorsorge' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 transition-colors">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{item.label}</p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.rate}%</p>
                <p className="text-[8px] text-slate-400 italic mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-600/20 transition-all"></div>
          <div className="relative z-10">
            <TrendingUp size={32} className="text-blue-500 mb-6" />
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-2 opacity-60">Übertrag in Planrechnung</h4>
            <p className="text-xl font-bold leading-snug">Werte automatisch in die GuV Konten 6000-6005 spiegeln?</p>
          </div>
          <button className="mt-8 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-xs font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:scale-[1.02]">
            <Download size={16} /> Budget jetzt synchronisieren
          </button>
        </div>
      </div>
    </div>
  );
};
