"use client";

import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  ReceiptText, 
  Key, 
  FileText,
  ChevronRight,
  ArrowLeft,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/context/DashboardContext';

interface AppNavbarProps {
  isSidebarCollapsed: boolean;
  className?: string;
}

export function AppNavbar({ isSidebarCollapsed, className }: AppNavbarProps) {
  const { currentApp, setCurrentApp, activeSubView, setActiveSubView } = useDashboard();

  if (!currentApp) return null;

  const navItems = [
    { name: 'Overview', icon: LayoutGrid, id: 'overview' },
    { name: 'Users', icon: Users, id: 'users' },
    { name: 'Roles', icon: ShieldCheck, id: 'roles' },
    { name: 'Audit Logs', icon: ReceiptText, id: 'audit-logs' },
    { name: 'API Keys', icon: Key, id: 'api-keys' },
    { name: 'Docs', icon: FileText, id: 'docs' },
  ];

  return (
    <div className={cn(
      "bg-surface border-b border-border fixed top-16 right-0 z-20 flex items-center px-4 md:px-8 h-12 gap-6 overflow-x-auto scrollbar-none transition-all duration-300",
      isSidebarCollapsed ? "left-[70px]" : "left-0 md:left-[240px]",
      className
    )}>
      <button 
        onClick={() => setCurrentApp(null)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors pr-4 border-r border-border h-6"
      >
        <ArrowLeft size={14} />
        <span className="text-xs font-medium">Apps</span>
      </button>

      <div className="flex items-center gap-2 text-text-secondary shrink-0 ml-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-brand">{currentApp.name}</span>
        <ChevronRight size={12} />
      </div>

      <nav className="flex items-center gap-1 h-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubView(item.id)}
            className={cn(
              "px-3 h-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all relative group",
              activeSubView === item.id 
                ? "text-primary-brand" 
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <item.icon size={14} className={cn(
              "transition-colors",
              activeSubView === item.id ? "text-primary-brand" : "group-hover:text-primary-brand"
            )} />
            <span>{item.name}</span>
            {activeSubView === item.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
