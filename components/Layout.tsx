
import React from 'react';
import { Client } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeClient: Client;
  activeTenant: string;
  clients: Client[];
  onSelectClient: (id: string) => void;
  headerContent?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, headerContent }) => {
  const childrenArray = React.Children.toArray(children);
  const sidebar = childrenArray[0];
  const content = childrenArray.slice(1);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {headerContent}
        <main className="flex-1 overflow-hidden flex flex-col">
          {content}
        </main>
      </div>
    </div>
  );
};
