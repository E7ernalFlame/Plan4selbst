
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
  PlanSection, ProfitMethod, LineItemType, 
  AppTab, Client, AppSettings, Analysis, ForecastGrowthRates
} from './types';
import { calculateKeyFigures, distributeYearly, sumLineItem, calculateSectionTotal, KeyFigures } from './utils/calculations';
import { generateExcelReport } from './utils/export';
import { formatCurrency, formatNumber } from './utils/formatting';
import { MONTH_NAMES } from './constants';
import { Loader2, Hexagon, ShieldCheck, CheckCircle2, BarChart3, FileBadge } from 'lucide-react';

const INITIAL_PLAN: PlanSection[] = [
  { id: 'rev', label: 'Umsatzerlöse', orderIndex: 0, type: 'REVENUE', isCollapsible: true, items: [{ id: 'rev-1', sectionId: 'rev', accountNumber: '4000', label: 'Umsatz Dienstleistungen', orderIndex: 0, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(240000) }, { id: 'rev-2', sectionId: 'rev', accountNumber: '4001', label: 'Umsatz Material', orderIndex: 1, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(60000) }] },
  { id: 'mat', label: 'Materialaufwand', orderIndex: 1, type: 'MATERIAL', isCollapsible: true, items: [{ id: 'mat-1', sectionId: 'mat', accountNumber: '5000', label: 'Wareneinsatz', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(45000) }] },
  { id: 'pers', label: 'Personalaufwand', orderIndex: 2, type: 'PERSONNEL', isCollapsible: true, items: [{ id: 'pers-1', sectionId: 'pers', accountNumber: '6000', label: 'Gehälter (inkl. LNK)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(120000) }] },
  { id: 'op', label: 'Sonstige betriebliche Aufwendungen', orderIndex: 4, type: 'OPERATING', isCollapsible: true, items: [{ id: 'op-1', sectionId: 'op', accountNumber: '7335', label: 'Kfz-Kosten & Marketing', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(14800) }] },
  { id: 'tax', label: 'Steuern & Privat', orderIndex: 8, type: 'TAX_PROVISION', isCollapsible: true, items: [{ id: 'tax-1', sectionId: 'tax', accountNumber: '', label: 'Privatentnahme / GF-Bezug', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(42500) }] }
];

const DEFAULT_CLIENTS: Client[] = [
  { id: '1', tenantId: 't1', name: 'Bio-Tech Solutions GmbH', legalForm: 'GmbH', industry: 'Technologie', contactEmail: 'office@bio-tech.at', assignedAdvisor: 'Mag. Hager', profitMethod: ProfitMethod.UGB, status: 'Aktiv', portalAccess: 'Aktiv', lastActivity: 'Vor 2 Stunden' }
];

const INITIAL_FORECAST_RATES: ForecastGrowthRates = {
  REVENUE: 5, MATERIAL: 3, PERSONNEL: 4, OPERATING: 2, FINANCE: 0, TAX: 3
};

const MOCK_USER = { uid: 'test-user-id', email: 'test@plan4selbst.at', displayName: 'Max Mustermann||Test Kanzlei AT', emailVerified: true } as User;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTestSession, setIsTestSession] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('1');
  const [selectedExportModules, setSelectedExportModules] = useState<string[]>([]);
  
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('p4s_clients');
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
  });

  const [analyses, setAnalyses] = useState<Analysis[]>(() => {
    const saved = localStorage.getItem('p4s_analyses');
    if (saved) return JSON.parse(saved);
    return [{ id: 'a1', clientId: '1', name: 'Szenario 1 (Basis)', createdAt: '01.01.2024', status: 'Final', notes: '', planData: JSON.parse(JSON.stringify(INITIAL_PLAN)), personnelResources: [], investments: [], loans: [] }];
  });

  const [activeAnalysisId, setActiveAnalysisId] = useState<string>(analyses[0]?.id || '');
  const [forecastRates, setForecastRates] = useState<ForecastGrowthRates>(INITIAL_FORECAST_RATES);

  useEffect(() => { localStorage.setItem('p4s_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('p4s_analyses', JSON.stringify(analyses)); }, [analyses]);

  const activeClient = useMemo(() => clients.find(c => c.id === selectedClientId) || clients[0], [clients, selectedClientId]);
  const filteredAnalyses = useMemo(() => analyses.filter(a => a.clientId === activeClient.id), [analyses, activeClient]);
  
  const activeAnalysis = useMemo(() => {
    const found = filteredAnalyses.find(a => a.id === activeAnalysisId);
    return found || filteredAnalyses[0] || analyses[0];
  }, [filteredAnalyses, activeAnalysisId, analyses]);

  const allScenariosForForecast = useMemo(() => {
    return filteredAnalyses.reduce((acc, analysis) => {
      acc[analysis.name] = analysis.planData;
      return acc;
    }, {} as Record<string, PlanSection[]>);
  }, [filteredAnalyses]);

  const keyFigures = useMemo<KeyFigures>(() => calculateKeyFigures(activeAnalysis.planData), [activeAnalysis]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdatePlanData = useCallback((newSections: PlanSection[]) => {
    setAnalyses(prev => prev.map(a => a.id === activeAnalysis.id ? { ...a, planData: newSections } : a));
  }, [activeAnalysis.id]);

  const handleUpdateAnalysisNotes = (id: string, notes: string) => {
    setAnalyses(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
  };

  const handleCreateAnalysis = (name: string, clientId?: string) => {
    const targetClientId = clientId || activeClient.id;
    const newId = `a-${Date.now()}`;
    const newAnalysis: Analysis = { 
      id: newId, 
      clientId: targetClientId,
      name, 
      createdAt: new Date().toLocaleDateString('de-AT'), 
      status: 'Entwurf', 
      notes: '',
      planData: JSON.parse(JSON.stringify(INITIAL_PLAN)), 
      personnelResources: [], investments: [], loans: [] 
    };
    setAnalyses(prev => [...prev, newAnalysis]);
    setActiveAnalysisId(newId);
    setSelectedClientId(targetClientId);
    setActiveTab('planrechnung');
  };

  const handleAddClient = (clientData: Partial<Client>) => {
    const newId = `c-${Date.now()}`;
    const newClient: Client = {
      id: newId,
      tenantId: 't1',
      name: clientData.name || 'Unbenannt',
      legalForm: clientData.legalForm || 'GmbH',
      industry: clientData.industry || 'Allgemein',
      primaryContact: clientData.primaryContact || '',
      contactEmail: clientData.contactEmail || '',
      assignedAdvisor: 'StB Team',
      profitMethod: clientData.profitMethod || ProfitMethod.UGB,
      status: 'Neu',
      portalAccess: 'Inaktiv',
      lastActivity: 'Gerade angelegt',
      internalNotes: clientData.internalNotes || '',
      customFields: clientData.customFields || []
    };
    setClients(prev => [...prev, newClient]);
    handleCreateAnalysis('Basisplanung', newId);
    setSelectedClientId(newId);
  };

  const handleUpdateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDuplicateAnalysis = (id: string) => {
    const source = analyses.find(a => a.id === id);
    if (!source) return;
    const newId = `a-copy-${Date.now()}`;
    const duplicate: Analysis = { ...JSON.parse(JSON.stringify(source)), id: newId, name: `${source.name} (Kopie)`, status: 'Probe', createdAt: new Date().toLocaleDateString('de-AT') };
    setAnalyses(prev => [...prev, duplicate]);
    setActiveAnalysisId(newId);
  };

  const handleRenameAnalysis = (id: string, newName: string) => {
    setAnalyses(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  };

  const handleDeleteAnalysis = (id: string) => {
    if (analyses.length <= 1) return;
    setAnalyses(prev => prev.filter(a => a.id !== id));
    if (activeAnalysisId === id) setActiveAnalysisId(analyses.find(a => a.id !== id)?.id || '');
  };

  const handleExport = (modules: string[], format: 'pdf' | 'excel') => {
    if (format === 'excel') generateExcelReport({ client: activeClient, analysis: activeAnalysis, selectedModules: modules });
    else { setSelectedExportModules(modules); setTimeout(() => { window.print(); }, 500); }
  };

  const effectiveUser = isTestSession ? MOCK_USER : currentUser;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!effectiveUser || (!isTestSession && !effectiveUser.emailVerified)) return <AuthView onQuickLogin={() => setIsTestSession(true)} />;

  return (
    <Layout activeClient={activeClient} activeTenant="Kanzlei" clients={clients} onSelectClient={setSelectedClientId}
      headerContent={
        <Header 
          activeClient={activeClient} clients={clients} onSelectClient={setSelectedClientId} 
          analyses={filteredAnalyses} activeAnalysisId={activeAnalysis.id} onSelectAnalysis={setActiveAnalysisId} 
          onCreateAnalysis={handleCreateAnalysis} onDuplicateAnalysis={handleDuplicateAnalysis} 
          onRenameAnalysis={handleRenameAnalysis} onDeleteAnalysis={handleDeleteAnalysis} 
          currentUser={effectiveUser} onExport={handleExport} 
          onUpdateNotes={(notes) => handleUpdateAnalysisNotes(activeAnalysis.id, notes)}
        />
      }
    >
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={() => { signOut(auth); setIsTestSession(false); }} currentUser={effectiveUser} />
      
      <div className="flex-1 overflow-y-auto p-8 print:hidden">
        {isTestSession && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} /> Test-Modus aktiv - Daten lokal gespeichert
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <DashboardView 
            clients={clients} 
            analyses={analyses}
            onSelectClient={(id) => { setSelectedClientId(id); setActiveTab('planrechnung'); }} 
            onAddClient={handleAddClient} 
            onUpdateClient={handleUpdateClient} 
            onCreateAnalysis={handleCreateAnalysis}
          />
        )}
        
        {activeTab === 'planrechnung' && (
          <div className="space-y-6">
            <FinancialSummary metrics={{ revenue: keyFigures.revenue, db1: keyFigures.db1, ebitda: keyFigures.ebitda, result: keyFigures.result }} />
            <PlanrechnungTable sections={activeAnalysis.planData} onUpdateSections={handleUpdatePlanData} clientName={activeClient.name} year={2024} />
          </div>
        )}

        {activeTab === 'auswertungen' && <ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} />}
        {activeTab === 'kreditfaehigkeit' && <CreditCapacityView activeAnalysis={activeAnalysis} />}
        {activeTab === 'ressourcen' && <ResourcePlanningView />}
        {activeTab === 'personal' && <PersonnelPlanningView />}
        {activeTab === 'investition' && <InvestmentPlanningView />}
        {activeTab === 'kredit' && <CreditCalculatorView />}
        {activeTab === 'entrepreneur' && <EntrepreneurPlanningView />}
        {activeTab === 'tax-calculator' && <TaxCalculatorView />}
        {activeTab === 'prognose' && <ForecastView sections={activeAnalysis.planData} allScenarios={allScenariosForForecast} baseYear={2024} rates={forecastRates} onUpdateRates={setForecastRates} />}
        {activeTab === 'einstellungen' && <SettingsView settings={{ theme: 'light', fontSize: 'medium', reducedMotion: false, highContrast: false, compactMode: false }} onUpdateSettings={() => {}} currentUser={effectiveUser} />}
      </div>

      <div className="hidden print:block print-only bg-white text-slate-950 p-0 font-sans">
        <section className="h-[290mm] flex flex-col justify-between p-20 border-b-8 border-blue-600">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl"><Hexagon size={48} fill="currentColor" /></div>
                 <div><h1 className="text-4xl font-black tracking-tighter print-brand">plan4selbst.at</h1><p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">BI Portal</p></div>
              </div>
           </div>
           <div className="space-y-6">
              <h2 className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em]">Reporting</h2>
              <h3 className="text-8xl font-black tracking-tighter leading-none">{activeClient.name}</h3>
              <p className="text-3xl font-light text-slate-400 italic">Planung Dossier 2024</p>
           </div>
        </section>
      </div>
    </Layout>
  );
};

export default App;
