
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Search as SearchIcon, 
  FolderOpen, 
  Plus, 
  FileText,
  Download,
  Copy,
  Trash2,
  Edit2,
  X,
  StickyNote,
  NotebookPen,
  Save
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
  onRenameAnalysis: (id: string, newName: string) => void;
  onDeleteAnalysis: (id: string) => void;
  currentUser: User | null;
  onExport: (modules: string[], format: 'pdf' | 'excel') => void;
  onUpdateNotes: (notes: string) => void;
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
  onRenameAnalysis,
  onDeleteAnalysis,
  currentUser,
  onExport,
  onUpdateNotes
}) => {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAnalysisSwitcher, setShowAnalysisSwitcher] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const switcherRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const activeAnalysis = analyses.find(a => a.id === activeAnalysisId) || analyses[0];
  const [tempNotes, setTempNotes] = useState(activeAnalysis?.notes || '');

  const firmName = currentUser?.displayName?.split('||')[1] || 'Meine Kanzlei';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setShowSwitcher(false);
      if (analysisRef.current && !analysisRef.current.contains(event.target as Node)) setShowAnalysisSwitcher(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update tempNotes when analysis changes
  useEffect(() => {
    setTempNotes(activeAnalysis?.notes || '');
  }, [activeAnalysisId, analyses]);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const startRenaming = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) onRenameAnalysis(id, editName);
    setEditingId(null);
  };

  const handleSaveNotes = () => {
    onUpdateNotes(tempNotes);
    setShowNotesModal(false);
  };

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

          {/* Mandanten Switcher */}
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

          {/* Analyse Ordner Switcher */}
          <div className="relative flex items-center gap-2" ref={analysisRef}>
            <div 
              onClick={() => setShowAnalysisSwitcher(!showAnalysisSwitcher)} 
              className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border-2 group shadow-sm ${
                showAnalysisSwitcher 
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 shadow-amber-500/10' 
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg text-white shadow-md transition-colors ${showAnalysisSwitcher || activeAnalysisId ? 'bg-amber-600' : 'bg-blue-600'}`}>
                <FolderOpen size={14} />
              </div>
              <div className="flex flex-col min-w-[160px]">
                <span className="text-[9px] uppercase font-black text-slate-400 leading-none tracking-[0.2em] mb-0.5">Aktive Analyse</span>
                <span className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                  {activeAnalysis ? activeAnalysis.name : 'Keine Analyse'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showAnalysisSwitcher ? 'rotate-180 text-amber-600' : 'group-hover:text-blue-600'}`} />
            </div>

            {/* Memo Button */}
            {activeAnalysis && (
              <button 
                onClick={() => setShowNotesModal(true)}
                className={`p-2.5 rounded-xl transition-all relative group ${
                  activeAnalysis.notes ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-transparent hover:bg-slate-100'
                } border shadow-sm`}
                title="Analyse-Memo"
              >
                <NotebookPen size={16} />
                {activeAnalysis.notes && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                )}
              </button>
            )}

            {showAnalysisSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Berechnungs-Ordner</h4>
                    <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">{analyses.length}</span>
                  </div>
                  <button 
                    onClick={() => { onCreateAnalysis(`Szenario ${analyses.length + 1}`); setShowAnalysisSwitcher(false); }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                  >
                    <Plus size={12} /> Neu
                  </button>
                </div>

                <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                  {analyses.map(analysis => {
                    const isActive = analysis.id === activeAnalysisId;
                    const isEditing = editingId === analysis.id;

                    return (
                      <div 
                        key={analysis.id} 
                        onClick={() => { if(!isEditing) onSelectAnalysis(analysis.id); }} 
                        className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all relative ${
                          isActive 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <FileText size={16} />
                          </div>
                          
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 mr-2" onClick={e => e.stopPropagation()}>
                              <input 
                                autoFocus
                                className="flex-1 bg-white dark:bg-slate-950 border-2 border-blue-500 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveRename(analysis.id)}
                                onBlur={() => saveRename(analysis.id)}
                              />
                              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X size={14}/></button>
                            </div>
                          ) : (
                            <div className="flex flex-col min-w-0">
                              <p className={`text-xs font-black truncate ${isActive ? 'text-amber-800 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {analysis.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-black uppercase px-1 rounded ${isActive ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                  {analysis.status}
                                </span>
                                {analysis.notes && <StickyNote size={10} className="text-amber-500" />}
                                <span className="text-[8px] text-slate-400 font-bold">{analysis.createdAt}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button 
                              onClick={(e) => startRenaming(e, analysis.id, analysis.name)}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                              title="Umbenennen"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDuplicateAnalysis(analysis.id); }}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Kopieren / Duplizieren"
                            >
                              <Copy size={13} />
                            </button>
                            {analyses.length > 1 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteAnalysis(analysis.id); }}
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                title="Löschen"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* ANALYSIS NOTES MODAL */}
      {showNotesModal && activeAnalysis && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setShowNotesModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg">
                  <NotebookPen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Analyse-Memo</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Planungslogik für: {activeAnalysis.name}</p>
                </div>
              </div>
              <button onClick={() => setShowNotesModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800">
                <textarea 
                  autoFocus
                  className="w-full min-h-[300px] bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-300 resize-none leading-relaxed placeholder:text-slate-400 italic"
                  placeholder="Was sind die Kern-Annahmen dieser Planung? Welche Risiken wurden berücksichtigt? (z.B. Erhöhte Marketing-Ausgaben für Markteintritt, Konservatives Umsatzwachstum...)"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowNotesModal(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleSaveNotes}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Save size={18} /> Memo Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        clientName={activeClient.name} 
        onExport={onExport}
      />
    </>
  );
};
