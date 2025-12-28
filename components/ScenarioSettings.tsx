
import React from 'react';
import { SectionType, ScenarioModifiers } from '../types';
import { Percent, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';

interface ScenarioSettingsProps {
  scenarioName: string;
  modifiers: ScenarioModifiers;
  onUpdateModifier: (type: SectionType, value: number) => void;
  onApplyToData: () => void;
}

export const ScenarioSettings: React.FC<ScenarioSettingsProps> = ({ 
  scenarioName, 
  modifiers, 
  onUpdateModifier,
  onApplyToData
}) => {
  if (scenarioName === 'Basisplan') {
    return (
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">Basis-Konfiguration aktiv</h4>
            <p className="text-xs text-blue-700 font-medium">Dies ist der Referenzplan. Alle anderen Szenarien leiten sich prozentual von diesen Werten ab.</p>
          </div>
        </div>
      </div>
    );
  }

  const sections: { type: SectionType, label: string }[] = [
    { type: 'REVENUE', label: 'Umsatz-Entwicklung' },
    { type: 'MATERIAL', label: 'Wareneinsatz' },
    { type: 'PERSONNEL', label: 'Personalkosten' },
    { type: 'OPERATING', label: 'Betriebsaufwand' }
  ];

  const isWorstCase = scenarioName === 'Worst Case';
  const isOptimistic = scenarioName === 'Optimistisch';

  return (
    <div className={`p-6 rounded-2xl border-2 shadow-sm space-y-6 animate-in slide-in-from-top-2 duration-300 ${
      isWorstCase ? 'bg-red-50/30 border-red-100' : isOptimistic ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isWorstCase ? 'bg-red-100 text-red-600' : isOptimistic ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              Szenario-Treiber: <span className={isWorstCase ? 'text-red-600' : isOptimistic ? 'text-emerald-600' : 'text-blue-600'}>{scenarioName}</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Relative Veränderung zum Basisplan in Prozent</p>
          </div>
        </div>
        <button 
          onClick={onApplyToData}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
            isWorstCase ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 
            isOptimistic ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 
            'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-500/20'
          }`}
        >
          Planung aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sections.map(section => {
          const multiplier = modifiers[section.type] || 1;
          const percentage = Math.round((multiplier - 1) * 100);
          const isNegative = percentage < 0;
          
          // Semantic coloring for drivers: Revenue down = bad, Cost down = good
          const isFavorable = (section.type === 'REVENUE' && !isNegative) || (section.type !== 'REVENUE' && isNegative);

          return (
            <div key={section.type} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-3 transition-all hover:border-slate-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{section.label}</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={percentage}
                    onChange={(e) => onUpdateModifier(section.type, (parseFloat(e.target.value) / 100) + 1)}
                  />
                  <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                <div className={`p-2 rounded-lg ${isFavorable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {!isNegative ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
