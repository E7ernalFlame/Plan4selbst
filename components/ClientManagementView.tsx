
import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, ExternalLink, ShieldCheck, X, Building, Target, FileText, CheckCircle2, Fingerprint, Stamp, MapPin, Hash } from 'lucide-react';
import { Client, ProfitMethod } from '../types';

interface ClientManagementViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onAddClient: (clientData: Omit<Client, 'id' | 'tenantId' | 'status' | 'lastActivity'>) => void;
}

export const ClientManagementView: React.FC<ClientManagementViewProps> = ({ clients, onSelectClient, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
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
    industry: 'Allgemein',
    contactEmail: '',
    assignedAdvisor: 'Mag. Hager',
    profitMethod: ProfitMethod.UGB,
    portalAccess: 'Inaktiv',
    uidNumber: '',
    commercialRegisterNumber: '',
    registeredAddress: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.uidNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.commercialRegisterNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    onAddClient(newClient);
    setShowAddModal(false);
    setNewClient({ 
      name: '', 
      legalForm: 'GmbH', 
      industry: 'Allgemein',
      contactEmail: '',
      assignedAdvisor: 'Mag. Hager',
      profitMethod: ProfitMethod.UGB,
      portalAccess: 'Inaktiv',
      uidNumber: '',
      commercialRegisterNumber: '',
      registeredAddress: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mandantenverwaltung</h2>
          <p className="text-sm text-slate-500 font-medium">Zentrale Steuerung Ihrer betreuten Unternehmen</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/25 transition-all active:scale-95"
        >
          <Plus size={18} /> Neuen Mandanten anlegen
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex gap-4 bg-slate-50/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Mandant suchen (Name, Branche, UID, Firmenbuch)..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mandant & UID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gewinnermittlung</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Letzte Aktivität</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-blue-50/20 transition-all group cursor-pointer" onClick={() => onSelectClient(client.id)}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        {client.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{client.legalForm}</span>
                          {client.uidNumber && <span className="text-[9px] font-bold text-blue-500">UID: {client.uidNumber}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${
                        client.profitMethod === ProfitMethod.UGB ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {client.profitMethod === ProfitMethod.UGB ? 'UGB' : 'EAR'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      client.status === 'Aktiv' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'Aktiv' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] text-slate-500 font-bold uppercase tracking-tight">{client.lastActivity}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2.5 text-blue-600 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-all"><ExternalLink size={18} /></button>
                      <button className="p-2.5 text-slate-400 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 transition-all"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Mandant anlegen</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Stammdaten & Registrierungsdetails</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vollständiger Name / Firma</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-Mail</label>
                  <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newClient.contactEmail}
                    onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">UID-Nummer</label>
                    <div className="relative">
                      <Fingerprint size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none"
                        placeholder="ATU..."
                        value={newClient.uidNumber}
                        onChange={(e) => setNewClient({...newClient, uidNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Firmenbuch</label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none"
                        placeholder="FN..."
                        value={newClient.commercialRegisterNumber}
                        onChange={(e) => setNewClient({...newClient, commercialRegisterNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Sitz / Adresse</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none"
                      placeholder="Adresse..."
                      value={newClient.registeredAddress}
                      onChange={(e) => setNewClient({...newClient, registeredAddress: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rechtsform</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    value={newClient.legalForm}
                    onChange={(e) => setNewClient({...newClient, legalForm: e.target.value})}
                  >
                    <option>GmbH</option><option>AG</option><option>KG</option><option>OG</option><option>e.U.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gewinnermittlung</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    value={newClient.profitMethod}
                    onChange={(e) => setNewClient({...newClient, profitMethod: e.target.value as ProfitMethod})}
                  >
                    <option value={ProfitMethod.UGB}>UGB / Bilanz</option>
                    <option value={ProfitMethod.EAR}>Einnahmen-Ausgaben</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-black text-slate-600 transition-all">Abbrechen</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-black text-white shadow-xl transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Mandant anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
