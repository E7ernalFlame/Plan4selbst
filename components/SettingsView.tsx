
import React from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Type, 
  Eye, 
  Zap, 
  Layout, 
  Check, 
  Smartphone,
  Info,
  RotateCcw,
  Sparkles,
  Command
} from 'lucide-react';
import { AppSettings, ThemeMode, FontSize } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const themes: { id: ThemeMode, label: string, icon: React.ReactNode }[] = [
    { id: 'light', label: 'Hell', icon: <Sun size={18} /> },
    { id: 'dark', label: 'Dunkel', icon: <Moon size={18} /> },
    { id: 'system', label: 'System', icon: <Monitor size={18} /> },
  ];

  const fontSizes: { id: FontSize, label: string, desc: string }[] = [
    { id: 'small', label: 'Informationsdichte (14px)', desc: 'Maximale Übersicht' },
    { id: 'medium', label: 'Standard (16px)', desc: 'Optimale Lesbarkeit' },
    { id: 'large', label: 'Komfort (18px)', desc: 'Größerer Text' },
    { id: 'xlarge', label: 'Barrierefrei (20px)', desc: 'Maximale Größe' },
  ];

  const resetSettings = () => {
    onUpdateSettings({
      theme: 'system',
      fontSize: 'medium',
      compactMode: false,
      reducedMotion: false,
      highContrast: false
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System-Einstellungen</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Personalisieren Sie Ihr TaxFlow Erlebnis global.</p>
        </div>
        <button 
          onClick={resetSettings}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase text-slate-400 hover:text-blue-600 transition-colors"
        >
          <RotateCcw size={14} /> Werkseinstellungen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Appearance Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* THEME SELECTOR */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Sun size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Interface Theme</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Farbwelt der Anwendung</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${
                    settings.theme === t.id 
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-lg shadow-blue-500/10' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`transition-transform duration-500 ${settings.theme === t.id ? 'scale-125' : 'group-hover:rotate-12'}`}>
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                  {settings.theme === t.id && (
                    <div className="absolute top-2 right-2">
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* FONT SIZES */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Type size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Schriftdarstellung</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lesbarkeit im gesamten Dashboard</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {fontSizes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateSettings({ fontSize: f.id })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group ${
                    settings.fontSize === f.id 
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 shadow-sm' 
                      : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${settings.fontSize === f.id ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {f.id === 'small' ? 'A' : f.id === 'medium' ? 'A' : f.id === 'large' ? 'A' : 'A'}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${settings.fontSize === f.id ? 'text-purple-900 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>{f.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{f.desc}</p>
                    </div>
                  </div>
                  {settings.fontSize === f.id && <div className="p-1 bg-purple-600 rounded-full text-white"><Check size={12} /></div>}
                </button>
              ))}
            </div>
          </section>

          {/* ACCESSIBILITY & LAYOUT */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Layout & Usability</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Interaktions-Verhalten der UI</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { id: 'compactMode', label: 'Kompakt-Modus (Experimental)', desc: 'Maximiert die Sichtbarkeit in großen Tabellen.', icon: <Layout size={18} /> },
                { id: 'reducedMotion', label: 'Reduced Motion', desc: 'Deaktiviert gleitende Übergänge.', icon: <Smartphone size={18} /> },
                { id: 'highContrast', label: 'Barrierefreier Kontrast', desc: 'Verstärkt Linien und Rahmen.', icon: <Eye size={18} /> },
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => onUpdateSettings({ [opt.id]: !settings[opt.id as keyof AppSettings] })}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                    settings[opt.id as keyof AppSettings] 
                    ? 'border-emerald-600 bg-emerald-50/20' 
                    : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`p-2 rounded-xl transition-colors ${settings[opt.id as keyof AppSettings] ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{opt.desc}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${settings[opt.id as keyof AppSettings] ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings[opt.id as keyof AppSettings] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl group-hover:bg-blue-600/40 transition-all" />
            
            <div className="flex items-center gap-3">
              <Command size={20} className="text-blue-500" />
              <h4 className="text-sm font-black tracking-widest uppercase">Echtzeit-Vorschau</h4>
            </div>

            <div className="space-y-4">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status: Aktiv</span>
                    </div>
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-2/3 h-1.5 bg-white/20 rounded-full" />
                    <div className="w-full h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1/2 h-1.5 bg-white/10 rounded-full" />
                  </div>
               </div>
               <p className="text-[11px] text-slate-400 leading-relaxed text-center px-2 italic">
                 "Alle Änderungen werden sofort im Browser synchronisiert und dauerhaft in Ihrem Profil hinterlegt."
               </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[32px] p-8 border border-blue-100 dark:border-blue-900/30 flex gap-4">
            <div className="shrink-0">
              <Info className="text-blue-600" size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Kanzlei-Standard</h4>
              <p className="text-[11px] text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                Diese Einstellungen beeinflussen nur Ihre persönliche Ansicht. Mandanten-Ansichten werden separat gesteuert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
