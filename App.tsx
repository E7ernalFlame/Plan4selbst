
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
import { CreditCalculatorView } from './components/CreditCalculatorView';
import { InvestmentPlanningView } from './components/InvestmentPlanningView';
import { EntrepreneurPlanningView } from './components/EntrepreneurPlanningView';
import { TaxCalculatorView } from './components/TaxCalculatorView';
import { ReportsView } from './components/ReportsView';
import { CreditCapacityView } from './components/CreditCapacityView';
import { PersonnelPlanningView } from './components/PersonnelPlanningView';
import { 
  PlanSection, ProfitMethod, LineItemType, ForecastGrowthRates, 
  AppTab, Client, AppSettings, Analysis
} from './types';
import { calculateKeyFigures, distributeYearly } from './utils/calculations';
import { generateExcelReport, triggerPdfExport } from './utils/export';
import { Loader2, Hexagon, FileText, Globe, ShieldCheck, MapPin } from 'lucide-react';

const INITIAL_SECTIONS: PlanSection[] = [
  { id: 'rev', label: 'Umsatz', orderIndex: 0, type: 'REVENUE', isCollapsible: true, items: [{ id: 'rev-1', sectionId: 'rev', accountNumber: '4000', label: 'Umsatz Dienstleistungen', orderIndex: 0, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(240000) }, { id: 'rev-2', sectionId: 'rev', accountNumber: '4001', label: 'Umsatz Material', orderIndex: 1, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(60000) }] },
  { id: 'mat', label: 'Material / Wareneinkauf', orderIndex: 1, type: 'MATERIAL', isCollapsible: true, items: [{ id: 'mat-1', sectionId: 'mat', accountNumber: '5000', label: 'Materialeinsatz / Wareneinkauf', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(45000) }] },
  { id: 'pers', label: 'Personalaufwand', orderIndex: 2, type: 'PERSONNEL', isCollapsible: true, items: [{ id: 'pers-1', sectionId: 'pers', accountNumber: '6000', label: 'Personalaufwand (Löhne/Gehälter)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(120000) }] },
  { id: 'depr', label: 'Abschreibung', orderIndex: 3, type: 'DEPRECIATION', isCollapsible: true, items: [{ id: 'depr-1', sectionId: 'depr', accountNumber: '7021', label: 'Absetzung für Abnutzung (AfA)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(12000) }] },
  { id: 'op', label: 'Betriebskosten', orderIndex: 4, type: 'OPERATING', isCollapsible: true, items: [{ id: 'op-1', sectionId: 'op', accountNumber: '7335', label: 'Kfz-Kosten (Treibstoff, Instandh.)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(4800) }] },
  { id: 'sales', label: 'Vertriebskosten', orderIndex: 5, type: 'SALES', isCollapsible: true, items: [{ id: 'sales-1', sectionId: 'sales', accountNumber: '7600', label: 'Werbeaufwand', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(12000) }] },
  { id: 'admin', label: 'Verwaltungskosten', orderIndex: 6, type: 'ADMIN', isCollapsible: true, items: [{ id: 'admin-1', sectionId: 'admin', accountNumber: '7700', label: 'Rechts- und Beratungskosten', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(6000) }] },
  { id: 'fin', label: 'Finanzierung', orderIndex: 7, type: 'FINANCE', isCollapsible: true, items: [{ id: 'fin-1', sectionId: 'fin', accountNumber: '8000', label: 'Zinsaufwand', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(3600) }] },
  { id: 'tax', label: 'Steuern & Privat', orderIndex: 8, type: 'TAX_PROVISION', isCollapsible: true, items: [{ id: 'tax-1', sectionId: 'tax', accountNumber: '', label: 'Privatentnahme (Unternehmerlohn)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(37755) }, { id: 'tax-2', sectionId: 'tax', accountNumber: '7780', label: 'Sozialversicherungsbeiträge SVS', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(17359) }, { id: 'tax-3', sectionId: 'tax', accountNumber: '', label: 'Einkommensteuer', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(10314) }] }
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', tenantId: 't1', name: 'Bio-Tech Solutions GmbH', legalForm: 'GmbH', industry: 'Technologie', contactEmail: 'office@bio-tech.at', assignedAdvisor: 'Mag. Hager', profitMethod: ProfitMethod.UGB, status: 'Aktiv', portalAccess: 'Aktiv', lastActivity: 'Vor 2 Stunden' },
  { id: '2', tenantId: 't1', name: 'Alpen-Gastronomie KG', legalForm: 'KG', industry: 'Tourismus', contactEmail: 'info@alpen-gastro.at', assignedAdvisor: 'Mag. Hager', profitMethod: ProfitMethod.UGB, status: 'Aktiv', portalAccess: 'Inaktiv', lastActivity: 'Gestern' }
];

const DEFAULT_SETTINGS: AppSettings = { theme: 'system', fontSize: 'medium', reducedMotion: false, highContrast: false, compactMode: false };
const DEFAULT_RATES: ForecastGrowthRates = { REVENUE: 5, MATERIAL: 3, PERSONNEL: 4, OPERATING: 2, FINANCE: 1, TAX: 2 };

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('planrechnung');
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>('1');
  const [forecastRates, setForecastRates] = useState<ForecastGrowthRates>(DEFAULT_RATES);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('plan4selbst_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [clientAnalyses, setClientAnalyses] = useState<Record<string, Analysis[]>>({
    '1': [{ id: 'a1', name: 'Planrechnung 2024 (Basis)', createdAt: '01.01.2024', status: 'Final', planData: INITIAL_SECTIONS, personnelResources: [], investments: [], loans: [] }]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    root.className = [isDark ? 'dark' : '', `font-${settings.fontSize}`, settings.compactMode ? 'compact-mode' : '', settings.reducedMotion ? 'reduced-motion' : '', settings.highContrast ? 'high-contrast' : ''].filter(Boolean).join(' ');
    localStorage.setItem('plan4selbst_settings', JSON.stringify(settings));
  }, [settings]);

  const activeClient = useMemo(() => clients.find(c => c.id === selectedClientId) || clients[0], [clients, selectedClientId]);
  const analyses = useMemo(() => clientAnalyses[selectedClientId] || [], [clientAnalyses, selectedClientId]);
  const activeAnalysis = useMemo(() => analyses[0], [analyses]);
  const keyFigures = useMemo(() => activeAnalysis ? calculateKeyFigures(activeAnalysis.planData) : calculateKeyFigures([]), [activeAnalysis]);

  const handleUpdateSections = useCallback((newSections: PlanSection[]) => {
    setClientAnalyses(prev => {
      const currentAnalyses = prev[selectedClientId] || [];
      return {
        ...prev,
        [selectedClientId]: currentAnalyses.map(a => a.id === (activeAnalysis?.id || '') ? { ...a, planData: newSections } : a)
      };
    });
  }, [selectedClientId, activeAnalysis?.id]);

  const handleCreateAnalysis = (name: string) => {
    const newAnalysis: Analysis = { id: `a-${Date.now()}`, name, createdAt: new Date().toLocaleDateString('de-AT'), status: 'Entwurf', planData: INITIAL_SECTIONS, personnelResources: [], investments: [], loans: [] };
    setClientAnalyses(prev => ({ ...prev, [selectedClientId]: [...(prev[selectedClientId] || []), newAnalysis] }));
  };

  const handleExport = (modules: string[], format: 'pdf' | 'excel') => {
    if (!activeAnalysis) return;
    if (format === 'excel') {
      generateExcelReport({ client: activeClient, analysis: activeAnalysis, selectedModules: modules });
    } else {
      triggerPdfExport();
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="text-blue-600 animate-spin" size={48} /></div>;
  if (!currentUser || !currentUser.emailVerified) return <AuthView />;

  const renderContent = () => {
    if (!activeAnalysis) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Keine Daten verfügbar</div>;
    switch (activeTab) {
      case 'dashboard': return <DashboardView clients={clients} onSelectClient={setSelectedClientId} onAddClient={(d) => setClients(prev => [...prev, { ...d, id: Date.now().toString(), tenantId: 't1', status: 'Neu', lastActivity: 'Gerade eben' } as Client])} onUpdateClient={(id, u) => setClients(prev => prev.map(c => c.id === id ? {...c, ...u} : c))} />;
      case 'planrechnung': return <div className="space-y-6 animate-in fade-in duration-300"><FinancialSummary metrics={{ revenue: keyFigures.revenue, db1: keyFigures.db1, ebitda: keyFigures.ebitda, result: keyFigures.result }} /><PlanrechnungTable sections={activeAnalysis.planData} onUpdateSections={handleUpdateSections} clientName={activeClient.name} year={2024} /></div>;
      case 'prognose': return <ForecastView sections={activeAnalysis.planData} allScenarios={{'Basisplan': activeAnalysis.planData}} baseYear={2024} rates={forecastRates} onUpdateRates={setForecastRates} />;
      case 'ressourcen': return <ResourcePlanningView />;
      case 'personal': return <PersonnelPlanningView />;
      case 'investition': return <InvestmentPlanningView />;
      case 'kredit': return <CreditCalculatorView />;
      case 'entrepreneur': return <EntrepreneurPlanningView />;
      case 'tax-calculator': return <TaxCalculatorView />;
      case 'auswertungen': return <ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} />;
      case 'kreditfaehigkeit': return <CreditCapacityView activeAnalysis={activeAnalysis} />;
      case 'einstellungen': return <SettingsView settings={settings} onUpdateSettings={(u) => setSettings(prev => ({...prev, ...u}))} currentUser={currentUser} />;
      default: return <div className="p-10 text-center text-slate-400">Modul wird geladen...</div>;
    }
  };

  return (
    <Layout activeClient={activeClient} activeTenant="Kanzlei-Portal" clients={clients} onSelectClient={setSelectedClientId}
      headerContent={
        <Header activeClient={activeClient} clients={clients} onSelectClient={setSelectedClientId} analyses={analyses} activeAnalysisId={activeAnalysis?.id || ''} onSelectAnalysis={() => {}} onCreateAnalysis={handleCreateAnalysis} onDuplicateAnalysis={() => {}} onDeleteAnalysis={() => {}} currentUser={currentUser} onExport={handleExport} />
      }
    >
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout} currentUser={currentUser} />
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print:hidden">
          {renderContent()}
        </div>
      </div>

      {/* --- PROFESSIONELLES REPORTING-DOSSIER (PRINT ONLY) --- */}
      <div className="hidden print:block print-only bg-white text-slate-900 min-h-screen">
        
        {/* PAGE 1: DECKBLATT */}
        <section className="h-[297mm] flex flex-col justify-between p-20 border-b border-slate-100">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-2xl text-white">
                  <Hexagon size={40} fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter">plan4selbst.at</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Business Intelligence Portal</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bericht-ID</p>
                <p className="text-sm font-mono font-bold">PR-2024-{activeClient.id}-{Date.now().toString().slice(-6)}</p>
             </div>
          </div>

          <div className="space-y-10">
             <div className="h-2 w-32 bg-blue-600 rounded-full" />
             <div className="space-y-4">
                <h2 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.4em]">Wirtschaftliches Gutachten</h2>
                <h3 className="text-7xl font-black tracking-tighter leading-none">{activeClient.name}</h3>
                <p className="text-2xl font-light text-slate-400 italic">Unternehmensplanung & Prognose für das Geschäftsjahr 2024</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-20 border-t border-slate-100 pt-16">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Mandantensitz</p>
                    <p className="text-sm font-bold">Österreich / {activeClient.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Prüfungsstatus</p>
                    <p className="text-sm font-bold">Vollständig kalkuliert (Auto-Compute)</p>
                  </div>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Erstellt durch</p>
                <p className="text-lg font-black">{currentUser?.displayName?.split('||')[1] || 'Fachkanzlei für BI'}</p>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
             </div>
          </div>
        </section>

        {/* PAGE 2: MANAGEMENT SUMMARY */}
        <section className="page-break p-16 space-y-12">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-8">
             <h2 className="text-2xl font-black uppercase tracking-tight">01. Management Summary</h2>
             <span className="text-xs font-bold text-slate-400">Werte in Euro (€)</span>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Proj. Jahresergebnis (EGT)</p>
                <p className="text-5xl font-black text-blue-600">{new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(keyFigures.result)}</p>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Dies entspricht einer prognostizierten Umsatzrendite von <span className="font-bold text-slate-900">{((keyFigures.result/keyFigures.revenue)*100).toFixed(1)}%</span> bezogen auf den geplanten Gesamtumsatz.</p>
             </div>
             <div className="p-10 bg-slate-900 rounded-[40px] text-white space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Operativer Cashflow (EBITDA)</p>
                <p className="text-5xl font-black text-emerald-400">{new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(keyFigures.ebitda)}</p>
                <p className="text-sm text-slate-400 leading-relaxed">Die Liquiditätsbasis vor Abschreibungen und Zinsen sichert die Schuldendienstfähigkeit des Unternehmens nachhaltig ab.</p>
             </div>
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-[40px] p-10 space-y-8">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
               <div className="w-2 h-2 bg-blue-600 rounded-full" /> Wesentliche Planungsprämissen
             </h3>
             <div className="grid grid-cols-3 gap-10">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Umsatzanteil Material</p>
                   <p className="text-xl font-bold">{((keyFigures.material/keyFigures.revenue)*100).toFixed(1)}%</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Personalkostenquote</p>
                   <p className="text-xl font-bold">{((keyFigures.personnel/keyFigures.revenue)*100).toFixed(1)}%</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Gesamt-Fixkostenlast</p>
                   <p className="text-xl font-bold">{new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(keyFigures.totalFixedCosts)}</p>
                </div>
             </div>
          </div>
        </section>

        {/* PAGE 3: DETAILPLANUNG (Scaled Table) */}
        <section className="page-break p-10 space-y-8">
           <div className="flex justify-between items-center border-b border-slate-200 pb-6">
              <h2 className="text-xl font-black uppercase tracking-tight">02. Detaillierte Planerfolgsrechnung 2024</h2>
              <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400">
                <span>Methodik: {activeClient.profitMethod}</span>
                <span>Analyse: {activeAnalysis.name}</span>
              </div>
           </div>

           <div className="print-table-scale">
             <ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} />
           </div>
        </section>

        <footer className="fixed bottom-10 left-0 right-0 px-20 flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
           <span>plan4selbst.at // Certified Reporting</span>
           <span>Seite 3 / 3</span>
        </footer>
      </div>
    </Layout>
  );
};

export default App;
