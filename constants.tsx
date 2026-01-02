
import React from 'react';
import { 
  BarChart3, 
  Settings, 
  LayoutDashboard, 
  PieChart,
  Zap,
  Users2,
  Users,
  CreditCard,
  HardHat,
  UserCircle2,
  Coins,
  ShieldCheck
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'planrechnung', label: 'Planrechnung', icon: <BarChart3 size={20} />, path: '/planning' },
  { id: 'prognose', label: 'Prognose', icon: <Zap size={20} />, path: '/simulation' },
  { id: 'investition', label: 'Investitionsplanung', icon: <HardHat size={20} />, path: '/investments' },
  { id: 'kredit', label: 'Kreditrechner', icon: <CreditCard size={20} />, path: '/credit' },
  { id: 'ressourcen', label: 'Einsatz & Ressourcen', icon: <Users2 size={20} />, path: '/resources' },
  { id: 'personal', label: 'Personaleinsatz', icon: <Users size={20} />, path: '/hr' },
  { id: 'entrepreneur', label: 'Unternehmer-Kalk.', icon: <UserCircle2 size={20} />, path: '/entrepreneur' },
  { id: 'tax-calculator', label: 'Steuerrechner 2025', icon: <Coins size={20} />, path: '/tax' },
  { id: 'kreditfaehigkeit', label: 'Kreditfähigkeit', icon: <ShieldCheck size={20} />, path: '/credit-capacity' },
  { id: 'auswertungen', label: 'Auswertungen', icon: <PieChart size={20} />, path: '/reports' },
  { id: 'einstellungen', label: 'Einstellungen', icon: <Settings size={20} />, path: '/settings' },
];

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export const VAT_RATES = [0, 10, 13, 20];

export const DEFAULT_CURRENCY_FORMAT = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});
