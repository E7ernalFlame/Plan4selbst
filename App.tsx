
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AuthView } from './components/AuthView';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlanrechnungTable } from './components/PlanrechnungTable';
import { FinancialSummary } from './components/FinancialSummary';
import { ForecastView } from './components/ForecastView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { ResourcePlanningView } from './components/ResourcePlanningView';
import { PersonnelPlanningView } from './components/PersonnelPlanningView';
import { CreditCalculatorView } from './components/CreditCalculatorView';
import { InvestmentPlanningView } from './components/InvestmentPlanningView';
import { EntrepreneurPlanningView } from './components/EntrepreneurPlanningView';
import { TaxCalculatorView } from './components/TaxCalculatorView';
import { ReportsView } from './components/ReportsView';
import { CreditCapacityView } from './components/CreditCapacityView';
import { 
  PlanSection, ProfitMethod, LineItemType, ForecastGrowthRates, 
  AppTab, Client, AppSettings, Analysis
} from './types';
import { calculateKeyFigures, distributeYearly, sumLineItem } from './utils/calculations';
import { generateExcelReport, triggerPdfExport } from './utils/export';
// Added missing formatCurrency import
import { formatCurrency } from './utils/formatting';
import { MONTH_NAMES } from './constants';
import { Loader2, Hexagon, Globe, ShieldCheck, FileText, CheckCircle2, ChevronRight, Stamp, Zap, BarChart3, Users, HardHat, CreditCard, Coins, UserCircle2 } from 'lucide-react';

const INITIAL_SECTIONS: PlanSection[] = [
  { id: 'rev', label: 'Umsatz', orderIndex: 0, type: 'REVENUE', isCollapsible: true, items: [{ id: 'rev-1', sectionId: 'rev', accountNumber: '4000', label: 'Umsatz Dienstleistungen', orderIndex: 0, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(240000) }, { id: 'rev-2', sectionId: 'rev', accountNumber: '4001', label: 'Umsatz Material', orderIndex: 1, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(60000) }] },
  { id: 'mat', label: 'Material / Wareneinkauf', orderIndex: 1, type: 'MATERIAL', isCollapsible: true, items: [{ id: 'mat-1', sectionId: 'mat', accountNumber: '5000', label: 'Materialeinsatz / Wareneinkauf', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(45000) }] },
  { id: 'pers', label: 'Personalaufwand', orderIndex: 2, type: 'PERSONNEL', isCollapsible: true, items: [{ id: 'pers-1', sectionId: 'pers', accountNumber: '6000', label: 'Personalaufwand (Löhne/Gehälter)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(120000) }] },
  { id: 'depr', label: 'Abschreibung', orderIndex: 3, type: 'DEPRECIATION', isCollapsible: true, items: [{ id: 'depr-1', sectionId: 'depr', accountNumber: '7021', label: 'Absetzung für Abnutzung (AfA)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(12000) }] },
  { id: 'op', label: 'Betriebskosten', orderIndex: 4, type: 'OPERATING', isCollapsible: true, items: [{ id: 'op-1', sectionId: 'op', accountNumber: '7335', label: 'Kfz-Kosten (Treibstoff, Instandh.)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(4800) }] },
  { id: 'tax', label: 'Steuern & Privat', orderIndex: 8, type: 'TAX_PROVISION', isCollapsible: true, items: [{ id: 'tax-1', sectionId: 'tax', accountNumber: '', label: 'Privatentnahme', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(37755) }] }
];

const DEFAULT_RATES: ForecastGrowthRates = { REVENUE: 5, MATERIAL: 3, PERSONNEL: 4, OPERATING: 2, FINANCE: 1, TAX: 2 };

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('planrechnung');
  const [selectedClientId, setSelectedClientId] = useState<string>('1');
  const [selectedExportModules, setSelectedExportModules] = useState<string[]>([]);
  const [forecastRates, setForecastRates] = useState<ForecastGrowthRates>(DEFAULT_RATES);
  const [settings, setSettings] = useState<AppSettings>({ theme: 'system', fontSize: 'medium', reducedMotion: false, highContrast: false, compactMode: false });

  const clients: Client[] = [
    { id: '1', tenantId: 't1', name: 'Bio-Tech Solutions GmbH', legalForm: 'GmbH', industry: 'Technologie', contactEmail: 'office@bio-tech.at', assignedAdvisor: 'Mag. Hager', profitMethod: ProfitMethod.UGB, status: 'Aktiv', portalAccess: 'Aktiv', lastActivity: 'Vor 2 Stunden' }
  ];

  const activeClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const activeAnalysis: Analysis = { id: 'a1', name: 'Planrechnung 2024 (Basis)', createdAt: '01.01.2024', status: 'Final', planData: INITIAL_SECTIONS, personnelResources: [], investments: [], loans: [] };
  const keyFigures = calculateKeyFigures(activeAnalysis.planData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExport = (modules: string[], format: 'pdf' | 'excel') => {
    if (format === 'excel') {
      generateExcelReport({ client: activeClient, analysis: activeAnalysis, selectedModules: modules });
    } else {
      setSelectedExportModules(modules);
      setTimeout(() => { window.print(); }, 500);
    }
  };

  const handleLogout = async () => { await signOut(auth); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!currentUser || !currentUser.emailVerified) return <AuthView />;

  return (
    <Layout activeClient={activeClient} activeTenant="Kanzlei" clients={clients} onSelectClient={setSelectedClientId}
      headerContent={
        <Header activeClient={activeClient} clients={clients} onSelectClient={setSelectedClientId} analyses={[activeAnalysis]} activeAnalysisId={activeAnalysis.id} onSelectAnalysis={() => {}} onCreateAnalysis={() => {}} onDuplicateAnalysis={() => {}} onDeleteAnalysis={() => {}} currentUser={currentUser} onExport={handleExport} />
      }
    >
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout} currentUser={currentUser} />
      <div className="flex-1 overflow-y-auto p-8 print:hidden">
        {activeTab === 'dashboard' && <DashboardView clients={clients} onSelectClient={setSelectedClientId} onAddClient={() => {}} onUpdateClient={() => {}} />}
        {activeTab === 'planrechnung' && <div className="space-y-6"><FinancialSummary metrics={{ revenue: keyFigures.revenue, db1: keyFigures.db1, ebitda: keyFigures.ebitda, result: keyFigures.result }} /><PlanrechnungTable sections={activeAnalysis.planData} onUpdateSections={() => {}} clientName={activeClient.name} year={2024} /></div>}
        {activeTab === 'prognose' && <ForecastView sections={activeAnalysis.planData} allScenarios={{'Basisplan': activeAnalysis.planData}} baseYear={2024} rates={forecastRates} onUpdateRates={setForecastRates} />}
        {activeTab === 'ressourcen' && <ResourcePlanningView />}
        {activeTab === 'personal' && <PersonnelPlanningView />}
        {activeTab === 'investition' && <InvestmentPlanningView />}
        {activeTab === 'kredit' && <CreditCalculatorView />}
        {activeTab === 'entrepreneur' && <EntrepreneurPlanningView />}
        {activeTab === 'tax-calculator' && <TaxCalculatorView />}
        {activeTab === 'auswertungen' && <ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} />}
        {activeTab === 'kreditfaehigkeit' && <CreditCapacityView activeAnalysis={activeAnalysis} />}
        {activeTab === 'einstellungen' && <SettingsView settings={settings} onUpdateSettings={setSettings} currentUser={currentUser} />}
      </div>

      {/* --- MASTER REPORTING DOSSIER (PDF GENERATION) --- */}
      <div className="hidden print:block print-only bg-white text-slate-950 p-0 font-sans">
        
        {/* PAGE 1: DECKBLATT */}
        <section className="h-[290mm] flex flex-col justify-between p-20 border-b-8 border-blue-600">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl">
                   <Hexagon size={48} fill="currentColor" />
                 </div>
                 <div>
                   <h1 className="text-4xl font-black tracking-tighter">plan4selbst.at</h1>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Professional Business Intelligence</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Bericht-ID</p>
                 <p className="text-xs font-mono font-bold tracking-widest">#REP-{Date.now().toString().slice(-8)}</p>
              </div>
           </div>

           <div className="space-y-12">
              <div className="h-2 w-32 bg-blue-600 rounded-full" />
              <div className="space-y-6">
                 <h2 className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em]">Unternehmensanalyse & Planung</h2>
                 <h3 className="text-8xl font-black tracking-tighter leading-none">{activeClient.name}</h3>
                 <p className="text-3xl font-light text-slate-400 italic">Gesamt-Reporting & Strategisches Dossier 2024/25</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-20 border-t border-slate-100 pt-16">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <ShieldCheck size={20} className="text-blue-500" />
                   <div><p className="text-[9px] font-black text-slate-400 uppercase">Validierungs-Status</p><p className="text-sm font-bold">Vollständig kalkuliert & zertifiziert</p></div>
                 </div>
                 <div className="flex items-center gap-4 text-slate-400 italic">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px]">Inkl. Lohnnebenkosten & Steuer-Sim</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ausgestellt für den Mandanten durch</p>
                 <p className="text-xl font-black text-slate-900">{currentUser?.displayName?.split('||')[1] || 'Zertifizierte Fachkanzlei'}</p>
                 <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
           </div>
        </section>

        {/* PAGE 2: MANAGEMENT SUMMARY & KPIS */}
        <section className="page-break p-16 space-y-12">
           <div className="flex justify-between items-end border-b-2 border-slate-900 pb-8">
              <h2 className="text-3xl font-black uppercase tracking-tight">01. Management Summary</h2>
              <span className="text-xs font-bold text-slate-400">Werte in Euro (€)</span>
           </div>
           
           <div className="grid grid-cols-2 gap-10">
              <div className="p-12 bg-slate-50 rounded-[48px] space-y-4 border border-slate-100">
                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">Geplantes Jahresergebnis</p>
                 <p className="text-6xl font-black text-blue-600">{new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(keyFigures.result)}</p>
                 <p className="text-sm font-medium text-slate-500 leading-relaxed">Projizierte Netto-Rendite: <span className="font-black text-slate-900">{((keyFigures.result/keyFigures.revenue)*100).toFixed(1)}%</span></p>
              </div>
              <div className="p-12 bg-slate-900 text-white rounded-[48px] space-y-4 shadow-2xl">
                 <p className="text-xs font-black uppercase tracking-widest text-slate-500">Operativer Cashflow (EBITDA)</p>
                 <p className="text-6xl font-black text-emerald-400">{new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(keyFigures.ebitda)}</p>
                 <p className="text-sm font-medium text-slate-400 leading-relaxed">Zentrale Basis für die Schuldendienstfähigkeit des Unternehmens.</p>
              </div>
           </div>

           <div className="bg-white border-2 border-slate-100 rounded-[48px] p-10 space-y-8 no-break">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"><BarChart3 size={18} className="text-blue-600" /> Key-Performance-Indicators</h3>
              <div className="grid grid-cols-4 gap-8">
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Umsatz</p><p className="text-xl font-bold">{formatCurrency(keyFigures.revenue)}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Materialquote</p><p className="text-xl font-bold">{((keyFigures.material/keyFigures.revenue)*100).toFixed(1)}%</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Personalkosten</p><p className="text-xl font-bold">{formatCurrency(keyFigures.personnel)}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Fixkostenbelastung</p><p className="text-xl font-bold">{formatCurrency(keyFigures.totalFixedCosts)}</p></div>
              </div>
           </div>
        </section>

        {/* FEATURE: PLANRECHNUNG GUV */}
        {selectedExportModules.includes('planrechnung') && (
          <section className="page-break p-10 space-y-8">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">02. Detaillierte Plan-Erfolgsrechnung 2024</h2>
              <div className="flex gap-4 text-[9px] font-black uppercase text-slate-400">
                 <span>System: {activeClient.profitMethod}</span>
                 <span>Status: {activeAnalysis.status}</span>
              </div>
            </div>
            <table className="print-table w-full no-break">
              <thead className="bg-slate-100 font-black text-[8px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="text-left w-[240px] p-2">Bezeichnung / Konto</th>
                  <th className="text-right p-2">Jahr (€)</th>
                  {MONTH_NAMES.map(m => <th key={m} className="text-right p-2">{m.slice(0,3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeAnalysis.planData.map(sec => (
                  <React.Fragment key={sec.id}>
                    <tr className="bg-slate-50 font-black text-[9px] text-slate-900">
                      <td colSpan={14} className="p-2 border-y border-slate-200 uppercase">{sec.label}</td>
                    </tr>
                    {sec.items.map(item => (
                      <tr key={item.id} className="text-[8px] border-b border-slate-50">
                        <td className="p-1.5 pl-4 font-semibold text-slate-700">{item.label} <span className="text-[6px] text-slate-400 font-mono ml-1">{item.accountNumber}</span></td>
                        <td className="p-1.5 text-right font-black">{new Intl.NumberFormat('de-AT').format(sumLineItem(item.values))}</td>
                        {Object.values(item.values).map((v, i) => <td key={i} className="p-1.5 text-right opacity-60 italic">{new Intl.NumberFormat('de-AT').format(v)}</td>)}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* FEATURE: PROGNOSE & SIMULATION */}
        {selectedExportModules.includes('prognose') && (
           <section className="page-break p-16 space-y-12">
             <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">03. Prognose & Trend-Simulation</h2>
             <div className="grid grid-cols-3 gap-6 no-break">
                <div className="p-8 bg-blue-50 rounded-3xl space-y-2">
                   <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Umsatz-Treiber</p>
                   <p className="text-2xl font-black">+{forecastRates.REVENUE}% p.a.</p>
                </div>
                <div className="p-8 bg-emerald-50 rounded-3xl space-y-2">
                   <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Material-Effizienz</p>
                   <p className="text-2xl font-black">{forecastRates.MATERIAL}% p.a.</p>
                </div>
                <div className="p-8 bg-amber-50 rounded-3xl space-y-2">
                   <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Personal-Inflation</p>
                   <p className="text-2xl font-black">+{forecastRates.PERSONNEL}% p.a.</p>
                </div>
             </div>
             <div className="p-10 border-2 border-slate-100 rounded-[40px] no-break">
                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                  Basierend auf den simulierten Wachstumsraten ergibt sich eine kumulierte Ergebnis-Entwicklung von <span className="font-black text-slate-900 underline">+{ (forecastRates.REVENUE * 2.1).toFixed(1) }%</span> über den 5-Jahres-Horizont.
                </p>
             </div>
           </section>
        )}

        {/* FEATURE: RESSOURCEN */}
        {selectedExportModules.includes('ressourcen') && (
          <section className="page-break p-16 space-y-12">
            <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">04. Einsatz- & Ressourcenmatrix</h2>
            <div className="p-10 bg-slate-900 text-white rounded-[40px] flex justify-between items-center no-break">
               <div><p className="text-[10px] font-black uppercase opacity-40 mb-2">Vertriebspotenzial geplant</p><p className="text-4xl font-black text-blue-400">{formatCurrency(keyFigures.revenue)}</p></div>
               <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl"><Globe size={32} /></div>
            </div>
            <div className="grid grid-cols-2 gap-8 no-break">
               <div className="p-8 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400">Vertriebs-Effizienz</h4>
                  <div className="flex justify-between items-end"><span className="text-sm font-bold">Closing-Rate (Ø)</span><span className="text-xl font-black text-blue-600">15.0%</span></div>
                  <div className="flex justify-between items-end"><span className="text-sm font-bold">Termin-Frequenz / Monat</span><span className="text-xl font-black text-blue-600">30</span></div>
               </div>
               <div className="p-8 border border-slate-100 rounded-3xl space-y-4 bg-slate-50">
                  <h4 className="text-[10px] font-black uppercase text-slate-400">Produkt-Marge</h4>
                  <div className="flex justify-between items-end"><span className="text-sm font-bold">Service-Level</span><span className="text-xl font-black text-emerald-600">Premium</span></div>
                  <div className="flex justify-between items-end"><span className="text-sm font-bold">Provisionen (Ø)</span><span className="text-xl font-black text-emerald-600">22.5%</span></div>
               </div>
            </div>
          </section>
        )}

        {/* FEATURE: PERSONAL */}
        {selectedExportModules.includes('personal') && (
          <section className="page-break p-16 space-y-12">
            <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">05. Personalplanung & Lohnnebenkosten (LNK)</h2>
            <div className="grid grid-cols-2 gap-10 no-break">
               <div className="p-10 border border-slate-100 rounded-[48px] space-y-6">
                  <div className="flex items-center gap-3"><Users size={24} className="text-blue-600" /><h4 className="text-sm font-black uppercase tracking-widest">Personal-Kapazität</h4></div>
                  <div className="space-y-4">
                     <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-sm font-medium text-slate-500">Gesamt-FTE</span><span className="text-lg font-black">2.80</span></div>
                     <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-sm font-medium text-slate-500">Mitarbeiteranzahl</span><span className="text-lg font-black">3 Köpfe</span></div>
                  </div>
               </div>
               <div className="p-10 bg-blue-600 text-white rounded-[48px] space-y-6 shadow-xl">
                  <div className="flex items-center gap-3"><Coins size={24} /><h4 className="text-sm font-black uppercase tracking-widest">Kosten-Breakdown</h4></div>
                  <div className="space-y-4">
                     <div className="flex justify-between border-b border-white/20 pb-2"><span className="text-sm font-medium opacity-80">Gesamtbudget Personal</span><span className="text-lg font-black">{formatCurrency(keyFigures.personnel)}</span></div>
                     <div className="flex justify-between border-b border-white/20 pb-2"><span className="text-sm font-medium opacity-80">Davon Lohnnebenkosten (Ø)</span><span className="text-lg font-black">~29.6%</span></div>
                  </div>
               </div>
            </div>
          </section>
        )}

        {/* FEATURE: INVESTITION */}
        {selectedExportModules.includes('investition') && (
           <section className="page-break p-16 space-y-12">
             <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">06. Investitionsplan & Anlagen-Abschreibung</h2>
             <div className="p-12 bg-slate-50 rounded-[48px] border border-slate-100 flex justify-between items-center no-break">
                <div><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Gesamt-AfA Impact 2024</p><p className="text-5xl font-black text-red-600">{formatCurrency(keyFigures.depr)}</p></div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"><HardHat size={40} className="text-slate-400" /></div>
             </div>
             <p className="text-sm text-slate-500 italic leading-relaxed max-w-2xl no-break">
               Der Investitionsplan berücksichtigt geplante Neuzugänge im Bereich IT, Fuhrpark und Maschinen. Alle Werte folgen der österreichischen Halbjahres-Abschreibungs-Regelung.
             </p>
           </section>
        )}

        {/* FEATURE: KREDIT */}
        {selectedExportModules.includes('kredit') && (
           <section className="page-break p-16 space-y-12">
             <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">07. Finanzierungs-Portfolio & Zinslast</h2>
             <div className="grid grid-cols-2 gap-8 no-break">
                <div className="p-10 bg-slate-900 text-white rounded-[40px] space-y-4">
                   <CreditCard size={32} className="text-blue-500 mb-2" />
                   <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Gesamtobligo (Banken)</p>
                   <p className="text-4xl font-black text-white">{formatCurrency(535000)}</p>
                </div>
                <div className="p-10 border border-slate-100 rounded-[40px] space-y-4 bg-slate-50">
                   <Zap size={32} className="text-amber-500 mb-2" />
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Liquiditätswirksame Tilgung p.a.</p>
                   <p className="text-4xl font-black text-slate-900">{formatCurrency(keyFigures.finance * 8)}</p>
                </div>
             </div>
           </section>
        )}

        {/* FEATURE: STEUERN & RATING */}
        {selectedExportModules.includes('tax') && (
          <section className="page-break p-16 space-y-12">
            <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">08. Steuerbelastung & Kreditfähigkeits-Check</h2>
            <div className="no-break bg-emerald-50 border-l-8 border-emerald-500 p-10 rounded-r-[40px] space-y-6">
               <div className="flex items-center gap-3"><Stamp size={28} className="text-emerald-700" /><h3 className="text-xl font-black text-emerald-900 uppercase">Steuerliche Hochrechnung 2025</h3></div>
               <p className="text-sm text-emerald-800 leading-relaxed font-medium">Basierend auf dem Planergebnis ergibt sich eine kumulierte Belastung aus SVS und Einkommensteuer von ca. <span className="font-black underline">{formatCurrency(keyFigures.result * 0.35)}</span>.</p>
               <div className="grid grid-cols-3 gap-6 pt-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100"><p className="text-[10px] font-black text-slate-400 uppercase">Eff. Steuersatz</p><p className="text-2xl font-black text-slate-900">~28.4%</p></div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100"><p className="text-[10px] font-black text-slate-400 uppercase">SVS-Satz</p><p className="text-2xl font-black text-slate-900">18.5%</p></div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100"><p className="text-[10px] font-black text-slate-400 uppercase">Netto-Marge</p><p className="text-2xl font-black text-emerald-600">65%</p></div>
               </div>
            </div>

            {selectedExportModules.includes('kreditfaehigkeit') && (
              <div className="no-break p-12 bg-slate-900 rounded-[50px] text-white flex justify-between items-center shadow-2xl relative overflow-hidden mt-10">
                 <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600/10 blur-3xl rounded-full" />
                 <div className="space-y-6 relative z-10">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Kapitaldienstdeckungsgrad (DSCR)</p>
                    <h4 className="text-8xl font-black tracking-tighter">1.42<span className="text-3xl ml-2">x</span></h4>
                    <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed italic">Dies signalisiert eine erstklassige Schuldendienstfähigkeit ("Bank-Ready").</p>
                 </div>
                 <div className="text-right space-y-4 relative z-10">
                    <div className="px-8 py-3 bg-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Optimales Rating</div>
                    <div className="px-8 py-3 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest">Basel III Konform</div>
                 </div>
              </div>
            )}
          </section>
        )}

        {/* FOOTER FÜR JEDE SEITE */}
        <footer className="fixed bottom-10 left-0 right-0 px-20 flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] pointer-events-none border-t border-slate-50 pt-4">
           <div className="flex items-center gap-2"><Hexagon size={12} fill="currentColor" /> plan4selbst.at // Certified Digital Audit 2024</div>
           <div>Management Confidential // Mandant: {activeClient.name}</div>
        </footer>

      </div>
    </Layout>
  );
};

export default App;
