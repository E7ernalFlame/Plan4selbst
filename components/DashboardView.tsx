
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  X, 
  CheckCircle2,
  ShieldCheck,
  Mail,
  Briefcase,
  Loader2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  User,
  Lock,
  Tag,
  Trash2,
  Database,
  Layers,
  Edit2,
  Settings,
  StickyNote
} from 'lucide-react';
import { Client, ProfitMethod, OnboardingStatus, Analysis, CustomField } from '../types';

interface DashboardViewProps {
  clients: Client[];
  analyses: Analysis[];
  onSelectClient: (clientId: string) => void;
  onAddClient: (clientData: Partial<Client>) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onCreateAnalysis: (name: string, clientId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  clients, 
  analyses, 
  onSelectClient, 
  onAddClient, 
  onUpdateClient,
  onCreateAnalysis 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<OnboardingStatus | 'All'>('All');
  const [selectedDetailsClientId, setSelectedDetailsClientId] = useState<string | null>(null);
  
  const [inviteClient, setInviteClient] = useState<Client | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  
  // Sonder-States für "Sonstiges" Freifelder im Modal
  const [customLegalForm, setCustomLegalForm] = useState(false);
  const [customIndustry, setCustomIndustry] = useState(false);
  const [customProfitMethod, setCustomProfitMethod] = useState(false);

  const [clientForm, setClientForm] = useState<Partial<Client>>({
    name: '',
    legalForm: 'GmbH',
    industry: 'Technologie',
    primaryContact: '',
    contactEmail: '',
    profitMethod: ProfitMethod.UGB,
    internalNotes: '',
    customFields: []
  });

  // Wenn wir in den Edit-Modus wechseln, Formular befüllen
  const openEditModal = (client: Client) => {
    setEditingClientId(client.id);
    setClientForm({
      name: client.name,
      legalForm: client.legalForm,
      industry: client.industry,
      primaryContact: client.primaryContact || '',
      contactEmail: client.contactEmail,
      profitMethod: client.profitMethod,
      internalNotes: client.internalNotes || '',
      customFields: client.customFields ? [...client.customFields] : []
    });
    // Check if values are in standard lists or custom
    const standardLegal = ['GmbH', 'KG', 'OG', 'e.U.', 'AG'];
    const standardIndustry = ['Technologie', 'Handel', 'Baugewerbe', 'Gastronomie', 'Dienstleistung'];
    const standardProfit = [ProfitMethod.UGB, ProfitMethod.EAR, ProfitMethod.Pauschalierung];

    setCustomLegalForm(!standardLegal.includes(client.legalForm));
    setCustomIndustry(!standardIndustry.includes(client.industry));
    setCustomProfitMethod(!standardProfit.includes(client.profitMethod as ProfitMethod));
    
    setShowClientModal(true);
  };

  const openAddModal = () => {
    setEditingClientId(null);
    setClientForm({
      name: '',
      legalForm: 'GmbH',
      industry: 'Technologie',
      primaryContact: '',
      contactEmail: '',
      profitMethod: ProfitMethod.UGB,
      internalNotes: '',
      customFields: []
    });
    setCustomLegalForm(false);
    setCustomIndustry(false);
    setCustomProfitMethod(false);
    setShowClientModal(true);
  };

  const addCustomField = () => {
    const fields = clientForm.customFields || [];
    setClientForm({
      ...clientForm,
      customFields: [...fields, { id: Date.now().toString(), label: '', value: '' }]
    });
  };

  const removeCustomField = (id: string) => {
    setClientForm({
      ...clientForm,
      customFields: (clientForm.customFields || []).filter(f => f.id !== id)
    });
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setClientForm({
      ...clientForm,
      customFields: (clientForm.customFields || []).map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const filteredClients = clients.filter(c => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchString) ||
                         (c.industry || '').toLowerCase().includes(searchString) ||
                         c.contactEmail.toLowerCase().includes(searchString) ||
                         (c.primaryContact || '').toLowerCase().includes(searchString);
    const matchesFilter = activeFilter === 'All' || c.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalCalculations = analyses.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name) return;
    
    if (editingClientId) {
      onUpdateClient(editingClientId, clientForm);
    } else {
      onAddClient(clientForm);
    }
    
    setShowClientModal(false);
    setEditingClientId(null);
  };

  const handleSendInvite = () => {
    if (!inviteClient) return;
    setIsInviting(true);
    setTimeout(() => {
      onUpdateClient(inviteClient.id, { portalAccess: 'Eingeladen' });
      setIsInviting(false);
      setInviteClient(null);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* KANZLEI KPI HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mandantenstamm</span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Aktive Mandanten</p>
          <h4 className="text-4xl font-black text-slate-900 dark:text-white relative z-10">{clients.length}</h4>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <Database size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Processing</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Gesamte Berechnungen</p>
          <h4 className="text-4xl font-black text-white relative z-10">{totalCalculations}</h4>
        </div>
      </div>

      {/* MANDANTEN MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Mandanten-Management</h2>
            <p className="text-sm text-slate-500 font-medium italic">Zentrale Steuerung, Onboarding und Portalfreigaben</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/25 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Mandant anlegen
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 bg-slate-50/20 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Suche nach Name, UID, Firmenbuch, E-Mail..." 
                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0">
               {['All', 'Neu', 'Aktiv'].map((f) => (
                 <button 
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFilter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                 >
                   {f === 'All' ? 'Alle' : f}
                 </button>
               ))}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-8 py-5">Mandant & Branche</th>
                  <th className="px-6 py-5">Ansprechpartner</th>
                  <th className="px-6 py-5 text-center">Berechnungen</th>
                  <th className="px-6 py-5">Portal-Zugriff</th>
                  <th className="px-8 py-5 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredClients.map((client) => {
                  const clientAnalyses = analyses.filter(a => a.clientId === client.id);
                  const isExpanded = selectedDetailsClientId === client.id;

                  return (
                    <React.Fragment key={client.id}>
                      <tr className={`hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shadow-inner uppercase">
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{client.name}</p>
                              <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{client.industry} • {client.legalForm}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          {client.primaryContact ? (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <User size={14} className="text-slate-400" />
                              <span className="text-sm font-bold">{client.primaryContact}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Nicht angegeben</span>
                          )}
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button 
                            onClick={() => setSelectedDetailsClientId(isExpanded ? null : client.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                              clientAnalyses.length > 0 ? 'bg-white dark:bg-slate-800 border-blue-200 text-blue-600' : 'bg-slate-50 text-slate-400 border-transparent'
                            }`}
                          >
                            <FileText size={14} />
                            {clientAnalyses.length}
                            <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col gap-2">
                            {client.portalAccess === 'Inaktiv' ? (
                              <button 
                                onClick={() => setInviteClient(client)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all w-fit border border-blue-200 dark:border-blue-800"
                              >
                                <Mail size={12} /> Portal freischalten
                              </button>
                            ) : (
                              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                client.portalAccess === 'Aktiv' ? 'text-emerald-600' : 'text-purple-600'
                              }`}>
                                <CheckCircle2 size={12} /> {client.portalAccess}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditModal(client)}
                              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
                              title="Mandant bearbeiten"
                            >
                              <Settings size={16} />
                            </button>
                            <button 
                              onClick={() => onSelectClient(client.id)}
                              className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                            >
                              Öffnen
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* AUSKLAPPBARE BERECHNUNGS-ANSICHT */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-y border-slate-200 dark:border-slate-800">
                          <td colSpan={5} className="p-10">
                             <div className="space-y-8">
                               {/* Admin Zusatzinfos */}
                               {(client.internalNotes || (client.customFields && client.customFields.length > 0)) && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   {client.internalNotes && (
                                     <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-[32px] group/notes relative">
                                       <button 
                                          onClick={() => openEditModal(client)}
                                          className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-lg text-amber-600 opacity-0 group-hover/notes:opacity-100 transition-opacity shadow-sm"
                                       >
                                          <Edit2 size={12} />
                                       </button>
                                       <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">
                                         <Lock size={12} /> Interne Kanzlei-Notizen
                                       </div>
                                       <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                                         "{client.internalNotes}"
                                       </p>
                                     </div>
                                   )}
                                   {client.customFields && client.customFields.length > 0 && (
                                     <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-[32px]">
                                       <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                                         <Tag size={12} /> Stammdaten-Freifelder
                                       </div>
                                       <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                         {client.customFields.map(f => (
                                           <div key={f.id} className="border-b border-blue-100/50 pb-2">
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{f.label}</p>
                                             <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.value}</p>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               )}

                               {/* Grid der Berechnungen */}
                               <div className="space-y-4">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Alle Berechnungen dieses Mandanten</h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {clientAnalyses.map(analysis => (
                                      <div 
                                        key={analysis.id} 
                                        onClick={() => { onSelectClient(client.id); }}
                                        className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all group/card cursor-pointer"
                                      >
                                         <div className="flex justify-between items-start mb-6">
                                           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover/card:bg-blue-600 group-hover/card:text-white transition-all">
                                             <LayoutDashboard size={20} />
                                           </div>
                                           <div className="flex flex-col items-end gap-1">
                                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                analysis.status === 'Final' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                             }`}>
                                               {analysis.status}
                                             </span>
                                             {analysis.notes && (
                                               <div className="p-1 bg-amber-50 text-amber-600 rounded" title="Enthält Memo">
                                                  <StickyNote size={10} />
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                         <p className="text-sm font-black text-slate-800 dark:text-white mb-1 group-hover/card:text-blue-600 transition-colors">{analysis.name}</p>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase">Erstellt: {analysis.createdAt}</p>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => onCreateAnalysis(`Szenario ${clientAnalyses.length + 1}`, client.id)}
                                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                                    >
                                       <Plus size={32} />
                                       <span className="text-[10px] font-black uppercase tracking-widest">Neue Planung</span>
                                    </button>
                                 </div>
                               </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PORTAL INVITE MODAL */}
      {inviteClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isInviting && setInviteClient(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-10 space-y-8 text-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[40px] flex items-center justify-center text-blue-600 mx-auto shadow-inner">
                   {isInviting ? <Loader2 size={48} className="animate-spin" /> : <ShieldCheck size={48} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Portal aktivieren</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Sende eine sichere Einladung zur Kollaboration an <br/>
                    <span className="text-blue-600 font-black">{inviteClient.contactEmail}</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setInviteClient(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-600 transition-all">Abbrechen</button>
                  <button onClick={handleSendInvite} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                    {isInviting ? 'Verarbeitung...' : 'Einladung senden'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MANDANTEN FORMULAR MODAL (ADD & EDIT) */}
      {showClientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowClientModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 my-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl">
                  {editingClientId ? <Edit2 size={24} /> : <Briefcase size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingClientId ? 'Mandant bearbeiten' : 'Mandanten erfassen'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Globales Stammdatenblatt</p>
                </div>
              </div>
              <button onClick={() => setShowClientModal(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Kerndaten</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Firmenname</label>
                    <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="z.B. Musterholding GmbH"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">E-Mail (Login)</label>
                    <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="office@mandant.at"
                      value={clientForm.contactEmail}
                      onChange={(e) => setClientForm({...clientForm, contactEmail: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Hauptansprechpartner</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        placeholder="Name der Geschäftsführung / Ansprechperson"
                        value={clientForm.primaryContact}
                        onChange={(e) => setClientForm({...clientForm, primaryContact: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Steuerliche Merkmale</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Rechtsform</label>
                      {!customLegalForm ? (
                        <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none"
                          value={clientForm.legalForm}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') setCustomLegalForm(true);
                            else setClientForm({...clientForm, legalForm: e.target.value});
                          }}
                        >
                          <option>GmbH</option><option>KG</option><option>OG</option><option>e.U.</option><option>AG</option>
                          <option value="CUSTOM">Sonstiges...</option>
                        </select>
                      ) : (
                        <input autoFocus placeholder="Freie Eingabe..." className="w-full bg-slate-50 dark:bg-slate-950 border border-blue-500 rounded-2xl px-4 py-4 text-sm font-bold outline-none" 
                          value={clientForm.legalForm}
                          onBlur={(e) => { if(!e.target.value) setCustomLegalForm(false); }}
                          onChange={(e) => setClientForm({...clientForm, legalForm: e.target.value})}
                        />
                      )}
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Branche</label>
                      {!customIndustry ? (
                        <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none"
                          value={clientForm.industry}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') setCustomIndustry(true);
                            else setClientForm({...clientForm, industry: e.target.value});
                          }}
                        >
                          <option>Technologie</option><option>Handel</option><option>Baugewerbe</option><option>Gastronomie</option><option>Dienstleistung</option>
                          <option value="CUSTOM">Sonstiges...</option>
                        </select>
                      ) : (
                        <input autoFocus placeholder="Freie Eingabe..." className="w-full bg-slate-50 dark:bg-slate-950 border border-blue-500 rounded-2xl px-4 py-4 text-sm font-bold outline-none" 
                          value={clientForm.industry}
                          onBlur={(e) => { if(!e.target.value) setCustomIndustry(false); }}
                          onChange={(e) => setClientForm({...clientForm, industry: e.target.value})}
                        />
                      )}
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">System</label>
                      {!customProfitMethod ? (
                        <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold outline-none"
                          value={clientForm.profitMethod}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') setCustomProfitMethod(true);
                            else setClientForm({...clientForm, profitMethod: e.target.value as ProfitMethod});
                          }}
                        >
                          <option value={ProfitMethod.UGB}>UGB</option>
                          <option value={ProfitMethod.EAR}>EAR</option>
                          <option value={ProfitMethod.Pauschalierung}>Pauschalierung</option>
                          <option value="CUSTOM">Sonstiges...</option>
                        </select>
                      ) : (
                        <input autoFocus placeholder="Freie Eingabe..." className="w-full bg-slate-50 dark:bg-slate-950 border border-blue-500 rounded-2xl px-4 py-4 text-sm font-bold outline-none" 
                          value={clientForm.profitMethod}
                          onBlur={(e) => { if(!e.target.value) setCustomProfitMethod(false); }}
                          onChange={(e) => setClientForm({...clientForm, profitMethod: e.target.value})}
                        />
                      )}
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-l-4 border-purple-600 pl-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Individuelle Freifelder</h4>
                  <button type="button" onClick={addCustomField} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Feld hinzufügen
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(clientForm.customFields || []).map((field) => (
                    <div key={field.id} className="flex gap-2 animate-in slide-in-from-left-2">
                      <input placeholder="Label (z.B. UID)" className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold"
                        value={field.label} onChange={(e) => updateCustomField(field.id, { label: e.target.value })} />
                      <input placeholder="Wert" className="flex-[1.5] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold"
                        value={field.value} onChange={(e) => updateCustomField(field.id, { value: e.target.value })} />
                      <button type="button" onClick={() => removeCustomField(field.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {(!clientForm.customFields || clientForm.customFields.length === 0) && (
                    <p className="text-[11px] text-slate-400 italic md:col-span-2 py-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-800">Keine Freifelder definiert</p>
                  )}
                </div>
              </div>

              <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-[40px] border border-amber-200 dark:border-amber-900/30 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest ml-1">
                  <Lock size={14} /> Interne Kanzlei-Notizen (Nur Admin)
                </div>
                <textarea 
                  className="w-full bg-white/70 dark:bg-slate-950/70 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/10 min-h-[120px] resize-none shadow-inner transition-all"
                  placeholder="Hintergrundinfos zum Mandanten, besondere Absprachen, Compliance-Hinweise..."
                  value={clientForm.internalNotes}
                  onChange={(e) => setClientForm({...clientForm, internalNotes: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowClientModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-500 transition-all uppercase tracking-widest">Abbrechen</button>
                <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest">
                   {editingClientId ? 'Änderungen speichern' : 'Mandant erfassen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
