
import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, Check, Download, Layers, LineChart, Table, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, clientName }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>(['plan']);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate generation time
    setTimeout(() => {
      setIsExporting(false);
      onClose();
      alert(`Export für ${clientName} (${format.toUpperCase()}) wurde gestartet.`);
    }, 1500);
  };

  const modules = [
    { id: 'plan', label: 'Detailplan (Monatlich)', sub: 'Vollständige GuV-Tabelle inkl. Konten', icon: <Table size={18} /> },
    { id: 'forecast', label: '5-Jahres Forecast', sub: 'Trendanalysen und Wachstumsprojektionen', icon: <LineChart size={18} /> },
    { id: 'scenarios', label: 'Szenarien-Vergleich', sub: 'Basis vs. Optimistisch vs. Worst-Case', icon: <Layers size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Export & Berichtswesen</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Module Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Module auswählen</label>
            <div className="grid grid-cols-1 gap-3">
              {modules.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedModules.includes(m.id) 
                      ? 'border-blue-600 bg-blue-50/50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${selectedModules.includes(m.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${selectedModules.includes(m.id) ? 'text-blue-900' : 'text-slate-700'}`}>{m.label}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.sub}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedModules.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'
                  }`}>
                    {selectedModules.includes(m.id) && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zielformat</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                  format === 'pdf' ? 'border-red-500 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${format === 'pdf' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-red-500 transition-colors'}`}>
                  <FileText size={24} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${format === 'pdf' ? 'text-red-900' : 'text-slate-700'}`}>PDF Bericht</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Druckoptimiert</p>
                </div>
              </button>

              <button 
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                  format === 'excel' ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${format === 'excel' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-emerald-600 transition-colors'}`}>
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${format === 'excel' ? 'text-emerald-900' : 'text-slate-700'}`}>Excel Sheet</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Daten-Rohformat</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button 
                onClick={onClose}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-black text-slate-600 transition-all flex-1"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleExport}
                disabled={selectedModules.length === 0 || isExporting}
                className={`px-8 py-4 rounded-2xl text-sm font-black text-white shadow-xl transition-all flex-[2] flex items-center justify-center gap-3 disabled:opacity-50 ${
                  format === 'pdf' ? 'bg-slate-900 hover:bg-black shadow-slate-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    {format === 'pdf' ? 'Bericht generieren' : 'Excel exportieren'}
                  </>
                )}
              </button>
          </div>
          
          <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
            <AlertCircle size={12} />
            Mandantendaten sind verschlüsselt nach AT-UGB Standard
          </div>
        </div>
      </div>
    </div>
  );
};
