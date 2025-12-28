
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
import { PersonnelResourcePlanningView } from './components/PersonnelResourcePlanningView';
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
import { Loader2 } from 'lucide-react';

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
      // Wichtig: Nur Benutzer mit verifizierter E-Mail zulassen
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Abmeldung fehlgeschlagen:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="text-blue-600 animate-spin" size={48} />
      </div>
    );
  }

  // ZUGRIFFSSCHUTZ: Nur eingeloggte UND verifizierte Benutzer kommen rein
  if (!currentUser || !currentUser.emailVerified) {
    return <AuthView />;
  }

  const renderContent = () => {
    if (!activeAnalysis) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Keine Daten verfügbar</div>;

    switch (activeTab) {
      case 'dashboard': return (
        <DashboardView 
          clients={clients} 
          onSelectClient={setSelectedClientId} 
          onAddClient={(d) => setClients(prev => [...prev, { ...d, id: Date.now().toString(), tenantId: 't1', status: 'Neu', lastActivity: 'Gerade eben' } as Client])} 
          onUpdateClient={(id, u) => setClients(prev => prev.map(c => c.id === id ? {...c, ...u} : c))} 
        />
      );
      case 'planrechnung': return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <FinancialSummary metrics={{ revenue: keyFigures.revenue, db1: keyFigures.db1, ebitda: keyFigures.ebitda, result: keyFigures.result }} />
          <PlanrechnungTable sections={activeAnalysis.planData} onUpdateSections={handleUpdateSections} clientName={activeClient.name} year={2024} />
        </div>
      );
      case 'prognose': return (
        <ForecastView 
          sections={activeAnalysis.planData} 
          allScenarios={{'Basisplan': activeAnalysis.planData}} 
          baseYear={2024} 
          rates={forecastRates} 
          onUpdateRates={setForecastRates} 
        />
      );
      case 'ressourcen': return <ResourcePlanningView />;
      case 'personal': return <PersonnelPlanningView />;
      case 'investition': return <InvestmentPlanningView />;
      case 'kredit': return <CreditCalculatorView />;
      case 'entrepreneur': return <EntrepreneurPlanningView />;
      case 'tax-calculator': return <TaxCalculatorView />;
      case 'auswertungen': return <ReportsView activeClient={activeClient} activeAnalysis={activeAnalysis} />;
      case 'kreditfaehigkeit': return <CreditCapacityView activeAnalysis={activeAnalysis} />;
      case 'einstellungen': return <SettingsView settings={settings} onUpdateSettings={(u) => setSettings(prev => ({...prev, ...u}))} />;
      default: return <div className="p-10 text-center text-slate-400">Modul wird geladen...</div>;
    }
  };

  return (
    <Layout activeClient={activeClient} activeTenant="Hager & Partner StB" clients={clients} onSelectClient={setSelectedClientId}
      headerContent={
        <Header 
          activeClient={activeClient} 
          activeTenant="Hager & Partner StB" 
          clients={clients} 
          onSelectClient={setSelectedClientId} 
          analyses={analyses} 
          activeAnalysisId={activeAnalysis?.id || ''} 
          onSelectAnalysis={() => {}} 
          onCreateAnalysis={handleCreateAnalysis} 
          onDuplicateAnalysis={() => {}} 
          onDeleteAnalysis={() => {}}
          onLogout={handleLogout}
        />
      }
    >
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
};

export default App;
