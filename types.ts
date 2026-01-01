
export enum UserRole {
  KanzleiAdmin = 'Kanzlei-Admin',
  Mitarbeiter = 'Mitarbeiter',
  Mandant = 'Mandant'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum ProfitMethod {
  UGB = 'Betriebsvermögensvergleich (UGB)',
  EAR = 'Einnahmen-Ausgaben-Rechnung (EAR)',
  Pauschalierung = 'Pauschalierung',
  Custom = 'Sonstiges'
}

export type LoanType = 'Immobilien' | 'Betriebsmittel' | 'Investition' | 'Förderung' | 'Sonstiges';

export interface LoanItem {
  id: string;
  name: string;
  type: LoanType;
  amount: number;
  interestRate: number;
  durationYears: number;
  installmentsPerYear: number;
  startDate: string;
}

export type AssetCategory = 'IT & Software' | 'Fuhrpark' | 'Maschinen' | 'Gebäude' | 'Büroausstattung' | 'GWG';

export interface InvestmentItem {
  id: string;
  label: string;
  category: AssetCategory;
  cost: number;
  usefulLife: number; 
  acquisitionDate: string; 
  type: 'Altbestand' | 'Neuzugang';
  isGWG?: boolean;
}

export type OnboardingStatus = 'Neu' | 'In Bearbeitung' | 'Aktiv' | 'Archiviert';

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  legalForm: string;
  industry: string;
  primaryContact?: string;
  taxId?: string;
  uidNumber?: string; 
  commercialRegisterNumber?: string;
  registeredAddress?: string;
  contactEmail: string;
  assignedAdvisor: string;
  profitMethod: ProfitMethod | string;
  status: OnboardingStatus;
  portalAccess: 'Inaktiv' | 'Eingeladen' | 'Aktiv';
  lastActivity: string;
  lastLogin?: string;
  internalNotes?: string;
  customFields?: CustomField[];
}

export interface Analysis {
  id: string;
  clientId: string; 
  name: string;
  createdAt: string;
  status: 'Entwurf' | 'Final' | 'Probe';
  notes?: string; // Neu: Notizen zur Dokumentation der Planungslogik
  planData: PlanSection[];
  personnelResources: PersonnelResourceItem[];
  investments: InvestmentItem[];
  loans: LoanItem[];
}

export interface ResourcePlanItem {
  id: string;
  nr: number;
  activity: string;
  salesperson: string;
  price: number;
  provisionPercent: number;
  months: number;
  avgAppointments: number;
  closingRate: number;
  salesPartner: string;
}

export interface PersonnelResourceItem {
  id: string;
  name: string;
  year: number;
  totalHoursYear: number;
  presentHours: number;
  productivityPercent: number;
  internalPercent: number;
  billablePercent: number;
  totalCostYear: number;
}

export interface EmployeePlanItem {
  id: string;
  nr: number;
  name: string;
  role: string;
  department: string;
  fte: number; 
  entryDate: string;
  exitDate?: string;
  vacationDays: number;
  sickDaysAvg: number;
  otherAbsences: number;
  monthlyGross: number;
  bonusFactor: number; 
  otherCostsMonthly: number; 
}

export enum LineItemType {
  Revenue = 'Revenue',
  Expense = 'Expense',
  Subtotal = 'Subtotal',
  Result = 'Result'
}

export interface PlanLineItem {
  id: string;
  sectionId: string;
  accountNumber?: string;
  label: string;
  orderIndex: number;
  type: LineItemType;
  isCustom: boolean;
  values: {
    [month: number]: number; 
  };
}

export type SectionType = 
  | 'REVENUE' 
  | 'MATERIAL' 
  | 'PERSONNEL' 
  | 'DEPRECIATION' 
  | 'OPERATING' 
  | 'ADMIN' 
  | 'SALES' 
  | 'FINANCE' 
  | 'TAX_PROVISION';

export interface PlanSection {
  id: string;
  label: string;
  orderIndex: number;
  type: SectionType;
  isCollapsible: boolean;
  items: PlanLineItem[];
}

export interface ForecastGrowthRates {
  REVENUE: number;
  MATERIAL: number;
  PERSONNEL: number;
  OPERATING: number;
  FINANCE: number;
  TAX: number;
}

export type ScenarioModifiers = Partial<Record<SectionType, number>>;

export type AppTab = 'dashboard' | 'planrechnung' | 'prognose' | 'ressourcen' | 'personal' | 'investition' | 'kredit' | 'entrepreneur' | 'tax-calculator' | 'auswertungen' | 'einstellungen' | 'kreditfaehigkeit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
  compactMode: boolean;
}
