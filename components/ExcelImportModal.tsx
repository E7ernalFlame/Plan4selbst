
import React, { useState, useCallback, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Layers,
  Database,
  Search,
  Zap,
  RefreshCw,
  FileWarning,
  FileText,
  ChevronRight,
  Settings2,
  Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
// Always use the recommended named import for GoogleGenAI and Type
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SectionType, PlanLineItem, LineItemType } from '../types';
import { distributeYearly } from '../utils/calculations';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mappedData: Partial<Record<SectionType, PlanLineItem[]>>) => void;
}

interface MappedRow {
  originalLabel: string;
  accountNumber: string;
  detectedValue: number;
  targetSection: SectionType;
  confidence: number;
  reason: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing'>('upload');
  const [importMode, setImportMode] = useState<'logic' | 'ai'>('logic');
  const [isDragging, setIsDragging] = useState(false);
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Regelbasierte Logik (Österreichischer Kontenrahmen) ---
  const mapAccountByNumber = (accountNo: string, label: string): SectionType => {
    const cleanNo = accountNo.trim();
    if (cleanNo.startsWith('4')) return 'REVENUE';
    if (cleanNo.startsWith('5')) return 'MATERIAL';
    if (cleanNo.startsWith('6')) return 'PERSONNEL';
    if (cleanNo.startsWith('70')) return 'DEPRECIATION';
    if (cleanNo.startsWith('733') || cleanNo.startsWith('74')) return 'OPERATING';
    if (cleanNo.startsWith('76')) return 'SALES';
    if (cleanNo.startsWith('77') || cleanNo.startsWith('78')) return 'ADMIN';
    if (cleanNo.startsWith('8')) return 'FINANCE';
    
    // Fallback auf Keyword-Suche im Label
    const l = label.toLowerCase();
    if (l.includes('umsatz') || l.includes('erlöse')) return 'REVENUE';
    if (l.includes('material') || l.includes('waren')) return 'MATERIAL';
    if (l.includes('lohn') || l.includes('gehalt') || l.includes('personal')) return 'PERSONNEL';
    if (l.includes('miete') || l.includes('leasing')) return 'OPERATING';
    if (l.includes('versicherung')) return 'ADMIN';
    
    return 'OPERATING'; // Standard Fallback
  };

  const processFileLogic = async (file: File) => {
    setStep('processing');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) throw new Error("Die Datei enthält zu wenig Daten.");

      const rows = jsonData.slice(1); // Header überspringen
      const results: MappedRow[] = rows
        .map(row => {
          // Annahme: Spalte 0=Konto, 1=Bezeichnung, 2=Wert (Oder ähnliche BMD/DATEV Logik)
          const acc = String(row[0] || '').trim();
          const lbl = String(row[1] || 'Unbenannt');
          const val = parseFloat(String(row[2]).replace(',', '.')) || 0;

          if (!val && !acc) return null;

          const section = mapAccountByNumber(acc, lbl);
          return {
            originalLabel: lbl,
            accountNumber: acc,
            detectedValue: val,
            targetSection: section,
            confidence: 1.0,
            reason: acc ? `Regel-Zuordnung (Konto ${acc.substring(0,2)}xx)` : 'Keyword-Treffer'
          };
        })
        .filter((r): r is MappedRow => r !== null && r.detectedValue !== 0);

      setMappedRows(results);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message);
      setStep('upload');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const processFileAI = async (file: File) => {
    setStep('processing');
    setError(null);

    try {
      // Create a new GoogleGenAI instance right before making an API call following strict guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any;

      if (file.type === 'application/pdf') {
        const base64Data = await fileToBase64(file);
        contents = {
          parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Data } },
          { text: `Extrahiere Kontonummer, Bezeichnung und Jahreswert aus diesem PDF. Mappe jeden Posten auf eine der folgenden Kategorien: REVENUE, MATERIAL, PERSONNEL, DEPRECIATION, OPERATING, ADMIN, SALES, FINANCE, TAX_PROVISION.` }]
        };
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        const sampleData = jsonData.slice(0, 200).map(row => row.join(' | ')).join('\n');
        contents = `Analysiere die folgenden Excel-Datenzeilen und mappe sie auf ein österreichisches UGB-Planungs-Schema. Gib Kontonummer, Bezeichnung, Wert und Ziel-Kategorie (REVENUE, MATERIAL, PERSONNEL, DEPRECIATION, OPERATING, ADMIN, SALES, FINANCE, TAX_PROVISION) zurück.\n\nDaten:\n${sampleData}`;
      }

      // Generate content using Gemini 3 Pro for complex extraction
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalLabel: { type: Type.STRING },
                accountNumber: { type: Type.STRING },
                detectedValue: { type: Type.NUMBER },
                targetSection: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ["originalLabel", "detectedValue", "targetSection", "confidence"],
              propertyOrdering: ["originalLabel", "accountNumber", "detectedValue", "targetSection", "confidence", "reason"]
            }
          }
        }
      });

      // Extract text output correctly from the GenerateContentResponse object
      const results = JSON.parse(response.text?.trim() || '[]') as MappedRow[];
      setMappedRows(results.filter(r => r.detectedValue !== 0 && r.originalLabel));
      setStep('mapping');
    } catch (err: any) {
      console.error('AI Error:', err);
      setError(err.message || "Fehler bei der KI-Analyse.");
      setStep('upload');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (importMode === 'ai' || file.type === 'application/pdf') {
      processFileAI(file);
    } else {
      processFileLogic(file);
    }
  };

  const executeImport = () => {
    const finalData: Partial<Record<SectionType, PlanLineItem[]>> = {};
    mappedRows.forEach(row => {
      const section = row.targetSection;
      if (!finalData[section]) finalData[section] = [];
      finalData[section]!.push({
        id: `import-${Date.now()}-${Math.random()}`,
        sectionId: section.toLowerCase(),
        label: row.originalLabel,
        accountNumber: row.accountNumber || '',
        orderIndex: 99,
        type: section === 'REVENUE' ? LineItemType.Revenue : LineItemType.Expense,
        isCustom: true,
        values: distributeYearly(row.detectedValue)
      });
    });
    onImport(finalData);
    onClose();
    setStep('upload');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl">
              <TableIcon size={24} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Smart Import Engine</h3>
              <div className="flex gap-4 mt-1">
                <button 
                  onClick={() => setImportMode('logic')}
                  className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${importMode === 'logic' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Standard-Logik (Konto-Regeln)
                </button>
                <button 
                  onClick={() => setImportMode('ai')}
                  className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded flex items-center gap-1 ${importMode === 'ai' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Zap size={10} className="fill-current" /> KI-Semantic Mapping
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {step === 'upload' && (
            <div className="h-full min-h-[450px] border-4 border-dashed rounded-[40px] border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-12 transition-all group">
              {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-bounce"><FileWarning size={20} /> {error}</div>}
              
              <div className="flex gap-4 mb-8">
                <div className={`w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700 ${importMode === 'logic' ? 'text-emerald-500 scale-110' : 'text-slate-300'}`}>
                  <FileSpreadsheet size={32} />
                </div>
                {importMode === 'ai' && (
                   <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-blue-500 shadow-xl border border-slate-100 dark:border-slate-700 scale-110">
                     <FileText size={32} />
                   </div>
                )}
              </div>

              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                {importMode === 'logic' ? 'Standard Excel Import (Spalten-Mapping)' : 'PDF/Excel KI-Analyse'}
              </h4>
              <p className="text-sm text-slate-400 font-medium text-center max-w-md mb-8 leading-relaxed">
                {importMode === 'logic' 
                  ? 'Verwendet feste Regeln für Kontenklassen (4=Umsatz, 5=Material, 7=Kosten). Ideal für BMD/RZ-Export.' 
                  : 'Extrahiert semantisch Daten aus unstrukturierten PDFs und Excel-Listen via Gemini Pro.'}
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept={importMode === 'ai' ? ".xlsx,.xls,.csv,.pdf" : ".xlsx,.xls,.csv"} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3">
                <Upload size={18} /> Datei wählen
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="h-full flex flex-col items-center justify-center py-24">
               <div className="relative mb-10">
                  <RefreshCw size={80} className={`animate-spin ${importMode === 'ai' ? 'text-blue-500' : 'text-emerald-500'}`} />
               </div>
               <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Analysiere Datei-Inhalt...</h4>
               <p className="text-sm text-slate-400 font-medium italic">Mapping-Logik wird angewendet.</p>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-200 dark:border-slate-800">
                      <th className="p-6 text-left">Original Daten</th>
                      <th className="p-6 text-right">Wert (€)</th>
                      <th className="p-6 text-left">Ziel-Kategorie</th>
                      <th className="p-6 text-left">Grund / Sicherheit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mappedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            {row.accountNumber && <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-mono text-[10px] text-slate-500 font-bold">{row.accountNumber}</span>}
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{row.originalLabel}</p>
                          </div>
                        </td>
                        <td className="p-6 text-right font-black text-slate-900 dark:text-white">
                          {row.detectedValue.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="p-6">
                          <select 
                            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-black text-blue-600 outline-none w-full shadow-sm"
                            value={row.targetSection}
                            onChange={(e) => {
                              const newRows = [...mappedRows];
                              newRows[idx].targetSection = e.target.value as SectionType;
                              setMappedRows(newRows);
                            }}
                          >
                            <option value="REVENUE">Umsatzerlöse</option>
                            <option value="MATERIAL">Wareneinsatz</option>
                            <option value="PERSONNEL">Personalaufwand</option>
                            <option value="DEPRECIATION">Abschreibung</option>
                            <option value="OPERATING">Betriebsaufwand</option>
                            <option value="ADMIN">Verwaltung</option>
                            <option value="SALES">Vertrieb</option>
                            <option value="FINANCE">Finanzen</option>
                            <option value="TAX_PROVISION">Steuern/Privat</option>
                          </select>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${row.confidence > 0.9 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                             <p className="text-[10px] text-slate-400 font-medium italic">{row.reason}</p>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 bg-slate-200 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-300">Abbrechen</button>
          {step === 'mapping' && (
            <button onClick={executeImport} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
              <CheckCircle2 size={20} /> {mappedRows.length} Posten übernehmen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
