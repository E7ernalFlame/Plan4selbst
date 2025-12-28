
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { Hexagon, LogOut, UserCircle2 } from 'lucide-react';
import { AppTab } from '../types';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onLogout: () => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, onLogout, currentUser }) => {
  // Extrahiere Name und Kanzlei (Format: Name||Kanzlei)
  const [userName, firmName] = currentUser?.displayName?.split('||') || ['Benutzer', 'Meine Kanzlei'];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full hidden lg:flex transition-colors duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Hexagon fill="currentColor" size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">plan4selbst.at</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as AppTab)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Profil & Logout Bereich */}
      <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div 
          onClick={() => onNavigate('einstellungen')}
          className="flex items-center gap-3 p-2 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
        >
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profil" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
              <UserCircle2 size={24} />
            </div>
          )}
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-xs font-black text-slate-900 dark:text-white truncate">{userName}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{firmName}</span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
};
