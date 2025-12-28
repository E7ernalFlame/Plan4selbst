
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
// Added formatNumber to imports
import { formatCurrency, formatNumber } from './utils/formatting';
import { MONTH_NAMES } from './constants';
import { Loader2, Hexagon, Globe, ShieldCheck, FileText, CheckCircle2, ChevronRight, Stamp, Zap, BarChart3 } from 'lucide-react';

const INITIAL_SECTIONS: PlanSection[] = [
  { id: 'rev', label: 'Umsatz', orderIndex: 0, type: 'REVENUE', isCollapsible: true, items: [{ id: 'rev-1', sectionId: 'rev', accountNumber: '4000', label: 'Umsatz Dienstleistungen', orderIndex: 0, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(240000) }, { id: 'rev-2', sectionId: 'rev', accountNumber: '4001', label: 'Umsatz Material', orderIndex: 1, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(60000) }] },
  { id: 'mat', label: 'Material / Wareneinkauf', orderIndex: 1, type: 'MATERIAL', isCollapsible: true, items: [{ id: 'mat-1', sectionId: 'mat', accountNumber: '5000', label: 'Materialeinsatz / Wareneinkauf', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(45000) }] },
  { id: 'pers', label: 'Personalaufwand', orderIndex: 2, type: 'PERSONNEL', isCollapsible: true, items: [{ id: 'pers-1', sectionId: 'pers', accountNumber: '6000', label: 'Personalaufwand (Löhne/Gehälter)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(120000) }] },
  { id: 'depr', label: 'Abschreibung', orderIndex: 3, type: 'DEPRECIATION', isCollapsible: true, items: [{ id: 'depr-1', sectionId: 'depr', accountNumber: '7021', label: 'Absetzung für Abnutzung (AfA)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(12000) }] },
  { id: 'op', label: 'Betriebskosten', orderIndex: 4, type: 'OPERATING', isCollapsible: true, items: [{ id: 'op-1', sectionId: 'op', accountNumber: '7335', label: 'Kfz-Kosten (Treibstoff, Instandh.)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(4800) }] },
  { id: 'tax', label: 'Steuern & Privat', orderIndex: 8, type: 'TAX_PROVISION', isCollapsible: true, items: [{ id: 'tax-1', sectionId: 'tax', accountNumber: '', label: 'Privatentnahme', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(37755) }] }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('planrechnung');
  const [selectedClientId, setSelectedClientId] = useState<string>('1');
  const [selectedExportModules, setSelectedExportModules] = useState<string[]>([]);
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
      // Kurze Verzögerung damit der State die UI für den Druck rendern kann
      setTimeout(() => {
        window.print();
      }, 500);
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
        {activeTab === 'prognose' && <ForecastView sections={activeAnalysis.planData} allScenarios={{'Basisplan': activeAnalysis.planData}} baseYear={2024} rates={{REVENUE: 5, MATERIAL: 3, PERSONNEL: 4, OPERATING: 2, FINANCE: 1, TAX: 2}} onUpdateRates={() => {}} />}
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

      {/* --- MASTER REPORTING DOSSIER (NUR FÜR DRUCK SICHTBAR) --- */}
      <div className="hidden print:block print-only bg-white text-slate-950 p-0 font-sans">
        
        {/* SEITE 1: DECKBLATT */}
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
                 <p className="text-3xl font-light text-slate-400 italic">Gesamt-Reporting & Strategisches Dossier 2024</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-20 border-t border-slate-100 pt-16">
              <div className="space-y-6">
                 <div className="flex items-center gap-4 text-slate-900">
                   <CheckCircle2 size={24} className="text-emerald-500" />
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                     <p className="text-sm font-bold">Vollständig kalkuliert & geprüft</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 text-slate-900">
                   <ShieldCheck size={24} className="text-blue-500" />
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Datenschutz</p>
                     <p className="text-sm font-bold">Management Confidential</p>
                   </div>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ausgestellt durch</p>
                 <p className="text-xl font-black text-slate-900">{currentUser?.displayName?.split('||')[1] || 'Zertifizierte Fachkanzlei'}</p>
                 <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
           </div>
        </section>

        {/* SEITE 2: KPI ÜBERSICHT */}
        <section className="page-break p-16 space-y-12">
           <h2 className="text-3xl font-black uppercase tracking-tight border-b-4 border-slate-900 pb-6">01. Management Summary</h2>
           
           <div className="grid grid-cols-2 gap-10">
              <div className="p-12 bg-slate-50 rounded-[48px] space-y-4 border border-slate-100">
                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">Projiziertes Jahresergebnis</p>
                 <p className="text-7xl font-black text-blue-600">{formatCurrency(keyFigures.result)}</p>
                 <p className="text-sm font-medium text-slate-500 leading-relaxed italic">Dieses Ergebnis berücksichtigt alle geplanten Investitionen, Personalkosten und steuerlichen Abgaben.</p>
              </div>
              <div className="p-12 bg-slate-900 text-white rounded-[48px] space-y-4 shadow-2xl">
                 <p className="text-xs font-black uppercase tracking-widest text-slate-500">Operativer Cashflow (EBITDA)</p>
                 <p className="text-7xl font-black text-emerald-400">{formatCurrency(keyFigures.ebitda)}</p>
                 <p className="text-sm font-medium text-slate-400 leading-relaxed italic">Basis für die Schuldendienstfähigkeit des Unternehmens gegenüber Banken.</p>
              </div>
           </div>

           <div className="bg-white border-2 border-slate-100 rounded-[48px] p-10 space-y-8 no-break">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"><BarChart3 size={18} className="text-blue-600" /> Key Metrics Portfolio</h3>
              <div className="grid grid-cols-4 gap-8">
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Umsatz</p><p className="text-xl font-bold">{formatCurrency(keyFigures.revenue)}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Materialquote</p><p className="text-xl font-bold">{((keyFigures.material/keyFigures.revenue)*100).toFixed(1)}%</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Personalkosten</p><p className="text-xl font-bold">{formatCurrency(keyFigures.personnel)}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Fixkostenbelastung</p><p className="text-xl font-bold">{formatCurrency(keyFigures.totalFixedCosts)}</p></div>
              </div>
           </div>
        </section>

        {/* SEITE 3: DIE PLANRECHNUNG (GUV) */}
        {selectedExportModules.includes('planrechnung') && (
          <section className="page-break p-10 space-y-8">
            <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-900 pb-4">02. Detaillierte Plan-Erfolgsrechnung 2024</h2>
            <table className="print-table w-full no-break">
              <thead className="bg-slate-100 font-black text-[8px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="text-left w-[200px] p-2">Bezeichnung / Konto</th>
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
                        <td className="p-1.5 text-right font-black">{formatNumber(sumLineItem(item.values))}</td>
                        {Object.values(item.values).map((v, i) => <td key={i} className="p-1.5 text-right opacity-60 italic">{formatNumber(v)}</td>)}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* WEITERE MODULE (FALLS GEWÄHLT) */}
        {selectedExportModules.includes('auswertungen') && (
           <div className="page-break p-16"><ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} /></div>
        )}
        
        {selectedExportModules.includes('kreditfaehigkeit') && (
           <div className="page-break p-16"><CreditCapacityView activeAnalysis={activeAnalysis} /></div>
        )}

        {/* FOOTER FÜR JEDE SEITE */}
        <footer className="fixed bottom-10 left-0 right-0 px-20 flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] pointer-events-none border-t border-slate-50 pt-4">
           <div className="flex items-center gap-2">
             <Hexagon size={12} fill="currentColor" />
             plan4selbst.at // Certified Digital Audit 2024
           </div>
           <div>
             Mandant: {activeClient.name} // Stand: {new Date().toLocaleDateString()}
           </div>
        </footer>

      </div>
    </Layout>
  );
};

export default App;
