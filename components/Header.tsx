
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Search as SearchIcon, 
  FolderOpen, 
  Plus, 
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { Client, Analysis } from '../types';
import { User } from 'firebase/auth';
import { ExportModal } from './ExportModal';

interface HeaderProps {
  activeClient: Client;
  clients: Client[];
  onSelectClient: (id: string) => void;
  analyses: Analysis[];
  activeAnalysisId: string;
  onSelectAnalysis: (id: string) => void;
  onCreateAnalysis: (name: string) => void;
  onDuplicateAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  currentUser: User | null;
  onExport: (modules: string[], format: 'pdf' | 'excel') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeClient, 
  clients, 
  onSelectClient,
  analyses,
  activeAnalysisId,
  onSelectAnalysis,
  onCreateAnalysis,
  onDuplicateAnalysis,
  onDeleteAnalysis,
  currentUser,
  onExport
}) => {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAnalysisSwitcher, setShowAnalysisSwitcher] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const switcherRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const firmName = currentUser?.displayName?.split('||')[1] || 'Meine Kanzlei';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setShowSwitcher(false);
      if (analysisRef.current && !analysisRef.current.contains(event.target as Node)) setShowAnalysisSwitcher(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAnalysis = analyses.find(a => a.id === activeAnalysisId) || analyses[0];
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold dark:text-slate-300">KZ</div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 leading-none tracking-widest">Kanzlei</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{firmName}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="relative" ref={switcherRef}>
            <div onClick={() => setShowSwitcher(!showSwitcher)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all group ${showSwitcher ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Mandant</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{activeClient.name}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
            </div>
            {showSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800"><div className="relative"><SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus type="text" placeholder="Mandanten suchen..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs outline-none dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div></div>
                <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => { onSelectClient(client.id); setShowSwitcher(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${client.id === activeClient.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${client.id === activeClient.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{client.name.charAt(0)}</div><div><p className={`text-xs font-bold ${client.id === activeClient.id ? 'text-blue-700' : 'text-slate-700 dark:text-slate-300'}`}>{client.name}</p></div></div>
                      {client.id === activeClient.id && <Check size={14} className="text-blue-600" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="relative" ref={analysisRef}>
            <div onClick={() => setShowAnalysisSwitcher(!showAnalysisSwitcher)} className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border-2 border-transparent group ${showAnalysisSwitcher ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <div className={`p-1.5 rounded-lg text-white shadow-md ${showAnalysisSwitcher ? 'bg-amber-600' : 'bg-blue-600'}`}><FolderOpen size={14} /></div>
              <div className="flex flex-col min-w-[140px]"><span className="text-[9px] uppercase font-black text-slate-400 leading-none tracking-widest mb-0.5">Aktive Analyse</span><span className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">{activeAnalysis ? activeAnalysis.name : 'Keine Analyse'}</span></div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showAnalysisSwitcher ? 'rotate-180 text-amber-600' : 'group-hover:text-blue-600'}`} />
            </div>
            {showAnalysisSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysen</h4><button onClick={() => { onCreateAnalysis(`Neu ${new Date().toLocaleDateString('de-AT')}`); setShowAnalysisSwitcher(false); }} className="p-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase px-2">+ Neu</button></div>
                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                  {analyses.map(analysis => (
                    <div key={analysis.id} onClick={() => { onSelectAnalysis(analysis.id); setShowAnalysisSwitcher(false); }} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${analysis.id === activeAnalysisId ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-3"><FileText size={16} className={analysis.id === activeAnalysisId ? 'text-amber-600' : 'text-slate-400'} /><p className={`text-xs font-black ${analysis.id === activeAnalysisId ? 'text-amber-700' : 'text-slate-700 dark:text-slate-300'}`}>{analysis.name}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-black dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
          >
            <Download size={16} /> Export
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
          <div className="hidden lg:flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest italic opacity-50">Business Intelligence Portal</div>
        </div>
      </header>

      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        clientName={activeClient.name} 
        onExport={onExport}
      />
    </>
  );
};
