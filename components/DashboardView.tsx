
import React, { useState } from 'react';
import { 
  Users, 
  FileBarChart, 
  Calendar, 
  ArrowUpRight, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Building, 
  Target, 
  X, 
  FileText, 
  CheckCircle2,
  ShieldCheck,
  Mail,
  UserCheck,
  Briefcase,
  Globe,
  Fingerprint,
  Send,
  Loader2,
  ShieldAlert,
  Info,
  MapPin,
  Stamp,
  Hash
} from 'lucide-react';
import { Client, ProfitMethod, OnboardingStatus } from '../types';

interface DashboardViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onAddClient: (clientData: Partial<Client>) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ clients, onSelectClient, onAddClient, onUpdateClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OnboardingStatus | 'All'>('All');
  
  // State für Portal-Freischaltung
  const [inviteClient, setInviteClient] = useState<Client | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  
  const [newClient, setNewClient] = useState<{
    name: string;
    legalForm: string;
    industry: string;
    contactEmail: string;
    assignedAdvisor: string;
    profitMethod: ProfitMethod;
    portalAccess: 'Inaktiv' | 'Eingeladen' | 'Aktiv';
    uidNumber: string;
    commercialRegisterNumber: string;
    registeredAddress: string;
  }>({
    name: '',
    legalForm: 'GmbH',
    industry: 'Technologie',
    contactEmail: '',
    assignedAdvisor: 'Mag. Hager',
    profitMethod: ProfitMethod.UGB,
    portalAccess: 'Inaktiv',
    uidNumber: '',
    commercialRegisterNumber: '',
    registeredAddress: ''
  });

  const filteredClients = clients.filter(c => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchString) ||
                         c.industry.toLowerCase().includes(searchString) ||
                         c.contactEmail.toLowerCase().includes(searchString) ||
                         (c.uidNumber?.toLowerCase().includes(searchString)) ||
                         (c.commercialRegisterNumber?.toLowerCase().includes(searchString));
    const matchesFilter = activeFilter === 'All' || c.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Mandanten gesamt', value: clients.length.toString(), icon: <Users size={20} className="text-blue-600" />, trend: 'Kanzlei-Wachstum' },
    { label: 'Onboarding offen', value: clients.filter(c => c.status === 'Neu').length.toString(), icon: <Target size={20} className="text-amber-600" />, trend: 'Priorität' },
    { label: 'Portal-Aktivität', value: clients.filter(c => c.portalAccess === 'Aktiv').length.toString(), icon: <Globe size={20} className="text-emerald-600" />, trend: 'Self-Service' },
    { label: 'Schnittstellen OK', value: '100%', icon: <ShieldCheck size={20} className="text-blue-600" />, trend: 'BMD / Datev' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    onAddClient({
      ...newClient,
      status: 'Neu',
      lastActivity: 'Gerade eben',
      lastLogin: '-'
    });
    setShowAddModal(false);
    setNewClient({
      name: '',
      legalForm: 'GmbH',
      industry: 'Technologie',
      contactEmail: '',
      assignedAdvisor: 'Mag. Hager',
      profitMethod: ProfitMethod.UGB,
      portalAccess: 'Inaktiv',
      uidNumber: '',
      commercialRegisterNumber: '',
      registeredAddress: ''
    });
  };

  const handleSendInvite = () => {
    if (!inviteClient) return;
    setIsInviting(true);
    
    // Simulierter E-Mail Versand & Freischaltung
    setTimeout(() => {
      onUpdateClient(inviteClient.id, { 
        portalAccess: 'Eingeladen', 
        lastActivity: `Einladung versendet an ${inviteClient.contactEmail}` 
      });
      setIsInviting(false);
      setInviteClient(null);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Kanzlei KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">{stat.icon}</div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* CRM Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mandanten-Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Zentrale Steuerung, Onboarding und Portalfreigaben</p>
          </div>
          <div className="flex gap-2">
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               {['All', 'Neu', 'Aktiv'].map((f) => (
                 <button 
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeFilter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                 >
                   {f === 'All' ? 'Alle' : f}
                 </button>
               ))}
             </div>
             <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Plus size={16} /> Mandant anlegen
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/20 dark:bg-slate-900/50">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Suche nach Name, UID, Firmenbuch, E-Mail..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mandant & Branche</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registrierung</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Portal-Zugriff</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group cursor-pointer" onClick={() => onSelectClient(client.id)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{client.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{client.legalForm}</span>
                             <span className="text-[9px] font-bold text-blue-500 uppercase">{client.industry}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {client.uidNumber && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            <Fingerprint size={12} className="text-slate-400" />
                            <span>UID: {client.uidNumber}</span>
                          </div>
                        )}
                        {client.commercialRegisterNumber && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            <Stamp size={12} className="text-slate-400" />
                            <span>FB: {client.commercialRegisterNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        {client.portalAccess === 'Inaktiv' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInviteClient(client); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all w-fit border border-blue-200 dark:border-blue-800"
                          >
                            <Mail size={12} /> Portal freischalten
                          </button>
                        ) : (
                          <>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              client.portalAccess === 'Aktiv' ? 'text-emerald-600' : 'text-purple-600'
                            }`}>
                              {client.portalAccess}
                            </span>
                            <p className="text-[9px] text-slate-400 font-medium italic">Login: {client.lastLogin || 'Nie'}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 text-blue-600 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:border-blue-200" title="E-Mail senden">
                          <Mail size={16} />
                        </button>
                        <button className="p-2 text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:border-slate-300">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Freischaltungs-Dialog (Invite Modal) */}
      {inviteClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={() => !isInviting && setInviteClient(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[32px] flex items-center justify-center text-blue-600 shadow-inner">
                   {isInviting ? <Loader2 size={40} className="animate-spin" /> : <ShieldCheck size={40} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Portal-Zugriff aktivieren</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Planrechnung freigeben für <span className="text-blue-600 font-bold">{inviteClient.name}</span></p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ziel E-Mail Adresse</label>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{inviteClient.contactEmail}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-800 dark:text-blue-400 font-medium">
                    Der Mandant erhält einen sicheren Link zur Registrierung. Alle in der Analyse "{inviteClient.profitMethod}" hinterlegten Daten werden sofort synchronisiert.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  disabled={isInviting}
                  onClick={() => setInviteClient(null)} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-400 transition-all"
                >
                  Abbrechen
                </button>
                <button 
                  disabled={isInviting}
                  onClick={handleSendInvite}
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black text-white shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isInviting ? 'Wird freigeschaltet...' : 'Jetzt Einladen'}
                  {!isInviting && <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mandanten-Onboarding</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Stammdaten & Registrierungsdetails</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              {/* Basisdaten Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Firma / Name</label>
                  <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                    placeholder="GmbH / AG / Einzelunternehmer"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Haupt-E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="email" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                      placeholder="buchhaltung@firma.at"
                      value={newClient.contactEmail}
                      onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Registrierungsdaten Card */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                    <Stamp size={16} className="text-blue-600" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Firmenbuch & Steuerdaten</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">UID-Nummer</label>
                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none dark:text-white"
                          placeholder="z.B. ATU12345678"
                          value={newClient.uidNumber}
                          onChange={(e) => setNewClient({...newClient, uidNumber: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Firmenbuchnummer</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none dark:text-white"
                          placeholder="z.B. FN 123456 x"
                          value={newClient.commercialRegisterNumber}
                          onChange={(e) => setNewClient({...newClient, commercialRegisterNumber: e.target.value})}
                        />
                      </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sitz / Registrierte Adresse</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none dark:text-white"
                        placeholder="StraBe 1, PLZ Ort"
                        value={newClient.registeredAddress}
                        onChange={(e) => setNewClient({...newClient, registeredAddress: e.target.value})}
                      />
                    </div>
                 </div>
              </div>

              {/* Konfiguration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branche</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none dark:text-white appearance-none"
                      value={newClient.industry}
                      onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                    >
                      <option>Technologie</option><option>Gastronomie</option><option>Bau / Gewerbe</option><option>Handel</option><option>Freie Berufe</option><option>Finanzen</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rechtsform</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none dark:text-white"
                      value={newClient.legalForm}
                      onChange={(e) => setNewClient({...newClient, legalForm: e.target.value})}
                    >
                      <option>GmbH</option><option>AG</option><option>e.U.</option><option>KG</option><option>OG</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gewinnermittlung</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none dark:text-white"
                      value={newClient.profitMethod}
                      onChange={(e) => setNewClient({...newClient, profitMethod: e.target.value as ProfitMethod})}
                    >
                      <option value={ProfitMethod.UGB}>UGB / Bilanz</option>
                      <option value={ProfitMethod.EAR}>EAR</option>
                    </select>
                 </div>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50 space-y-4">
                <div className="flex items-center gap-2">
                   <UserCheck size={18} className="text-blue-600" />
                   <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest">Portal & Einladung</h4>
                </div>
                <div className="flex items-center justify-between">
                   <p className="text-xs text-blue-800 dark:text-blue-400 font-medium italic">Sofortige Einladung zur Planrechnung senden?</p>
                   <button 
                    type="button"
                    onClick={() => setNewClient({...newClient, portalAccess: newClient.portalAccess === 'Inaktiv' ? 'Eingeladen' : 'Inaktiv'})}
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${newClient.portalAccess === 'Eingeladen' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${newClient.portalAccess === 'Eingeladen' ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-400 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Mandant erfassen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
