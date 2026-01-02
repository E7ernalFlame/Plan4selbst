
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
import { PrintPlanrechnung } from './components/PrintPlanrechnung';
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
  { 
    id: 'rev', label: 'Umsatzerlöse', orderIndex: 0, type: 'REVENUE', isCollapsible: true, 
    items: [
      { id: 'rev-1', sectionId: 'rev', accountNumber: '4000', label: 'Umsatz Dienstleistungen', orderIndex: 0, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-2', sectionId: 'rev', accountNumber: '4001', label: 'Umsatz Material', orderIndex: 1, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-3', sectionId: 'rev', accountNumber: '4100', label: 'Erlöse ig. Lieferungen (steuerfrei)', orderIndex: 2, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-4', sectionId: 'rev', accountNumber: '4113', label: 'Erlöse Provisionen EU', orderIndex: 3, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-5', sectionId: 'rev', accountNumber: '4800', label: 'Sonstige betriebliche Erträge', orderIndex: 4, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-6', sectionId: 'rev', accountNumber: '4881', label: 'Versicherungsvergütungen', orderIndex: 5, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-7', sectionId: 'rev', accountNumber: '8100', label: 'Zinserträge aus Bankguthaben', orderIndex: 6, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
      { id: 'rev-8', sectionId: 'rev', accountNumber: '4600', label: 'Anlagerträge', orderIndex: 7, type: LineItemType.Revenue, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'mat', label: 'Materialaufwand / Wareneinkauf', orderIndex: 1, type: 'MATERIAL', isCollapsible: true, 
    items: [
      { id: 'mat-1', sectionId: 'mat', accountNumber: '5000', label: 'Material', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'mat-2', sectionId: 'mat', accountNumber: '5320', label: 'Wareneinkauf ig. Erwerb 20 % (mit VSt)', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'mat-3', sectionId: 'mat', accountNumber: '5030', label: 'Wareneinkauf 10%', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'mat-4', sectionId: 'mat', accountNumber: '7500', label: 'Fremdpersonal und Fremdleistungen', orderIndex: 3, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'pers', label: 'Personalaufwand', orderIndex: 2, type: 'PERSONNEL', isCollapsible: true, 
    items: [
      { id: 'pers-1', sectionId: 'pers', accountNumber: '6000', label: 'Personalaufwand', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'pers-2', sectionId: 'pers', accountNumber: '6001', label: 'Sonstige Personalkosten', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'afa', label: 'Abschreibung (AfA)', orderIndex: 3, type: 'DEPRECIATION', isCollapsible: true, 
    items: [
      { id: 'afa-1', sectionId: 'afa', accountNumber: '7021', label: 'Absetzung für Abnutzung', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'op', label: 'Betriebskosten', orderIndex: 4, type: 'OPERATING', isCollapsible: true, 
    items: [
      { id: 'op-1', sectionId: 'op', accountNumber: '7335', label: 'Kfz-Kosten (Treibstoff, Instandhaltung)', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-2', sectionId: 'op', accountNumber: '7450', label: 'Kfz-Leasing', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-3', sectionId: 'op', accountNumber: '7330', label: 'Kfz-Versicherung', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-4', sectionId: 'op', accountNumber: '7201', label: 'Instandhaltungen (Erhaltungsaufwand) für Gebäude', orderIndex: 3, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-5', sectionId: 'op', accountNumber: '7200', label: 'Instandhaltung', orderIndex: 4, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-6', sectionId: 'op', accountNumber: '7400', label: 'Miete Leasing unbewegliche WG', orderIndex: 5, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-7', sectionId: 'op', accountNumber: '7700', label: 'Sachversicherungen', orderIndex: 6, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-8', sectionId: 'op', accountNumber: '7021', label: 'Geringfügige Wirtschaftsgüter', orderIndex: 7, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-9', sectionId: 'op', accountNumber: '7800', label: 'Schadensfälle', orderIndex: 8, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-10', sectionId: 'op', accountNumber: '7840', label: 'Sonstige Betriebskosten', orderIndex: 9, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'op-11', sectionId: 'op', accountNumber: '', label: 'Leasing', orderIndex: 10, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'admin', label: 'Verwaltungskosten', orderIndex: 5, type: 'ADMIN', isCollapsible: true, 
    items: [
      { id: 'adm-1', sectionId: 'admin', accountNumber: '7390', label: 'Postgebühren', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-2', sectionId: 'admin', accountNumber: '7470', label: 'Lizenzgebühren (ChatGPT, Google Workspace)', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-3', sectionId: 'admin', accountNumber: '7390', label: 'Miete Leasing bewegliche WG', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-4', sectionId: 'admin', accountNumber: '7630', label: 'Fachliteratur', orderIndex: 3, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-5', sectionId: 'admin', accountNumber: '7380', label: 'Telefon', orderIndex: 4, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-6', sectionId: 'admin', accountNumber: '7381', label: 'Internet', orderIndex: 5, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-7', sectionId: 'admin', accountNumber: '7382', label: 'Handykosten', orderIndex: 6, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-8', sectionId: 'admin', accountNumber: '7785', label: 'Mitgliedsbeiträge', orderIndex: 7, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-9', sectionId: 'admin', accountNumber: '7600', label: 'Büromaterial und Drucksorten', orderIndex: 8, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-10', sectionId: 'admin', accountNumber: '7770', label: 'Ausbildungskosten', orderIndex: 9, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-11', sectionId: 'admin', accountNumber: '7790', label: 'Spesen des Geldverkehrs', orderIndex: 10, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-12', sectionId: 'admin', accountNumber: '7795', label: 'Bankomatgebühren', orderIndex: 11, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-13', sectionId: 'admin', accountNumber: '7750', label: 'Rechtsberatung', orderIndex: 12, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-14', sectionId: 'admin', accountNumber: '7740', label: 'Steuerberatungskosten', orderIndex: 13, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-15', sectionId: 'admin', accountNumber: '7171', label: 'Interessentenbeitrag', orderIndex: 14, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-16', sectionId: 'admin', accountNumber: '8280', label: 'Zinsen und ähnliche Aufwendungen', orderIndex: 15, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-17', sectionId: 'admin', accountNumber: '7180', label: 'Sonstige Gebühren und Abgaben', orderIndex: 16, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-18', sectionId: 'admin', accountNumber: '7661', label: 'Bewirtung Büro intern', orderIndex: 17, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'adm-19', sectionId: 'admin', accountNumber: '7841', label: 'Sonstige Verwaltungskosten', orderIndex: 18, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'sales', label: 'Vertriebskosten', orderIndex: 6, type: 'SALES', isCollapsible: true, 
    items: [
      { id: 'sls-1', sectionId: 'sales', accountNumber: '7650', label: 'Werbeaufwendungen', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-2', sectionId: 'sales', accountNumber: '7660', label: 'Repräsentationsaufwendungen', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-3', sectionId: 'sales', accountNumber: '7690', label: 'Spenden', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-4', sectionId: 'sales', accountNumber: '7340', label: 'Reise- und Fahrtspesen', orderIndex: 3, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-5', sectionId: 'sales', accountNumber: '7540', label: 'Provisionen an Dritte, Lizenzgebühren', orderIndex: 4, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-6', sectionId: 'sales', accountNumber: '7300', label: 'Transporte durch Dritte', orderIndex: 5, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'sls-7', sectionId: 'sales', accountNumber: '7842', label: 'Sonstige Vertriebskosten', orderIndex: 6, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'fin', label: 'Finanzierungskosten', orderIndex: 7, type: 'FINANCE', isCollapsible: true, 
    items: [
      { id: 'fin-1', sectionId: 'fin', accountNumber: '7300', label: 'Zinsen', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  },
  { 
    id: 'tax', label: 'Steuern & Privat', orderIndex: 8, type: 'TAX_PROVISION', isCollapsible: true, 
    items: [
      { id: 'tax-1', sectionId: 'tax', accountNumber: '', label: 'Unternehmerlohn Netto - Privatentnahme', orderIndex: 0, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'tax-2', sectionId: 'tax', accountNumber: '7780', label: 'Sozialversicherungsbeiträge SVS', orderIndex: 1, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
      { id: 'tax-3', sectionId: 'tax', accountNumber: '', label: 'Einkommensteuer', orderIndex: 2, type: LineItemType.Expense, isCustom: false, values: distributeYearly(0) },
    ] 
  }
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
        {/* Pass activeAnalysis.planData to CreditCalculatorView's required 'sections' prop */}
        {activeTab === 'kredit' && <CreditCalculatorView sections={activeAnalysis.planData} />}
        {activeTab === 'entrepreneur' && <EntrepreneurPlanningView />}
        {activeTab === 'tax-calculator' && <TaxCalculatorView />}
        {activeTab === 'prognose' && <ForecastView sections={activeAnalysis.planData} allScenarios={allScenariosForForecast} baseYear={2024} rates={forecastRates} onUpdateRates={setForecastRates} />}
        {activeTab === 'einstellungen' && <SettingsView settings={{ theme: 'light', fontSize: 'medium', reducedMotion: false, highContrast: false, compactMode: false }} onUpdateSettings={() => {}} currentUser={effectiveUser} />}
      </div>

      <div className="hidden print:block print-only bg-white text-slate-950 p-0 font-sans">
        <section className="h-[290mm] flex flex-col justify-between p-20 border-b-8 border-blue-600 no-break">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl"><Hexagon size={48} fill="currentColor" /></div>
                 <div><h1 className="text-4xl font-black tracking-tighter print-brand">plan4selbst.at</h1><p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">BI Portal</p></div>
              </div>
           </div>
           <div className="space-y-6">
              <h2 className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em]">Finanz-Reporting & Planung</h2>
              <h3 className="text-8xl font-black tracking-tighter leading-none">{activeClient.name}</h3>
              <p className="text-3xl font-light text-slate-400 italic">Planungs-Dossier: {activeAnalysis.name}</p>
           </div>
        </section>
        
        {/* Hier wird die vollständige Berechnung eingefügt */}
        <div className="page-break p-10">
          <PrintPlanrechnung sections={activeAnalysis.planData} clientName={activeClient.name} analysisName={activeAnalysis.name} />
        </div>
      </div>
    </Layout>
  );
};

export default App;
