
import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Check, 
  Download, 
  BarChart3, 
  Users2, 
  Users, 
  HardHat, 
  CreditCard, 
  ShieldCheck, 
  Coins,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ExportModule {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  initialModuleId?: string;
  onExport: (modules: string[], format: 'pdf' | 'excel') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, clientName, initialModuleId, onExport }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>(initialModuleId ? [initialModuleId] : ['planrechnung']);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const modules: ExportModule[] = [
    { id: 'planrechnung', label: 'Planrechnung GuV', sub: 'Monatliche Detailplanung inkl. Konten', icon: <BarChart3 size={18} />, color: 'bg-blue-600' },
    { id: 'ressourcen', label: 'Einsatz & Ressourcen', sub: 'Vertriebs- und Kapazitätsplanung', icon: <Users2 size={18} />, color: 'bg-indigo-600' },
    { id: 'personal', label: 'Personalplanung', sub: 'Lohnkosten & LNK (Österreich Standard)', icon: <Users size={18} />, color: 'bg-purple-600' },
    { id: 'investition', label: 'Investitionsplan', sub: 'Asset-Management & AfA-Prognose', icon: <HardHat size={18} />, color: 'bg-amber-600' },
    { id: 'kredit', label: 'Kredit-Portfolio', sub: 'Finanzierungen & Zinsaufwand', icon: <CreditCard size={18} />, color: 'bg-slate-700' },
    { id: 'kreditfaehigkeit', label: 'Kreditfähigkeit', icon: <ShieldCheck size={18} />, sub: 'DSCR & Banken-Rating (Basel III)', color: 'bg-emerald-600' },
    { id: 'tax', label: 'Steuervorschau 2025', icon: <Coins size={18} />, sub: 'SVS & ESt Hochrechnung', color: 'bg-blue-500' },
  ];

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedModules(modules.map(m => m.id));
  const deselectAll = () => setSelectedModules([]);

  const handleExportClick = () => {
    setIsExporting(true);
    // Wir geben der UI kurz Zeit den Ladezustand zu zeigen
    setTimeout(() => {
      onExport(selectedModules, format);
      setIsExporting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl shadow-xl">
              <Download size={24} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Export & Reporting Center</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Bericht für: {clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
          <div className="flex-1 p-8 border-r border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Module auswählen</label>
              <div className="flex gap-4">
                <button onClick={selectAll} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Alle wählen</button>
                <button onClick={deselectAll} className="text-[10px] font-black text-slate-400 uppercase hover:underline">Keine</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {modules.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`flex items-center justify-between p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                    selectedModules.includes(m.id) 
                      ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' 
                      : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl text-white shadow-sm ${m.color}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-black ${selectedModules.includes(m.id) ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{m.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">{m.sub}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedModules.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    {selectedModules.includes(m.id) && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[340px] bg-slate-50/50 dark:bg-slate-900/30 p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dateiformat</label>
              <div className="space-y-3">
                <button 
                  onClick={() => setFormat('pdf')}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 transition-all group ${
                    format === 'pdf' ? 'border-red-500 bg-white dark:bg-slate-900 shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${format === 'pdf' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-black ${format === 'pdf' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>PDF Bericht</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Management Ready</p>
                  </div>
                </button>

                <button 
                  onClick={() => setFormat('excel')}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 transition-all group ${
                    format === 'excel' ? 'border-emerald-600 bg-white dark:bg-slate-900 shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${format === 'excel' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-black ${format === 'excel' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Excel-Sheet</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Daten-Rohformat</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] border border-blue-100 dark:border-blue-800/50 space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <AlertCircle size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Info</h4>
              </div>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed italic">
                Wählen Sie PDF für Banken & Investoren oder Excel zur Weiterverarbeitung.
              </p>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zusammenfassung</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">{selectedModules.length} Module</span>
              </div>
              <button 
                onClick={handleExportClick}
                disabled={selectedModules.length === 0 || isExporting}
                className={`w-full py-5 rounded-[24px] text-xs font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 ${
                  format === 'pdf' ? 'bg-slate-900 dark:bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {isExporting ? (
                  <>
                    <Clock size={18} className="animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    {format === 'pdf' ? 'Bericht generieren' : 'Daten exportieren'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
