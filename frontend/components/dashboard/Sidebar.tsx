"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutGrid, 
  Users, 
  ReceiptText, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Plus,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  orgSlug: string;
}

export function Sidebar({ isCollapsed, setIsCollapsed, orgSlug }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutGrid, href: '/dashboard' },
    { name: 'Members', icon: Users, href: `/dashboard/members` },
    { name: 'Roles', icon: ShieldCheck, href: `/dashboard/roles` },
    { name: 'Audit Logs', icon: ReceiptText, href: `/dashboard/audit-logs` },
  ];

  const bottomItems = [
    { name: 'Settings', icon: Settings, href: `/dashboard/settings` },
    { name: 'Docs', icon: HelpCircle, href: '/docs' },
  ];

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-surface border-r border-border transition-all duration-300 z-30 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {/* Sidebar Header / Toggle */}
      <div className={cn(
        "h-16 flex items-center border-b border-border px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <Image src="/logo.svg" alt="AuthForge" width={28} height={28} className="shrink-0" />
              <span className="font-bold text-lg tracking-tight text-text-primary whitespace-nowrap">
                AuthForge
              </span>
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative whitespace-nowrap",
              pathname === item.href 
                ? "bg-surface-hover text-text-primary border-l-2 border-primary-brand" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
            )}
          >
            <item.icon size={20} className={cn(
              "shrink-0",
              pathname === item.href ? "text-primary-brand" : "group-hover:text-text-primary"
            )} />
            {!isCollapsed && <span className="text-sm font-medium transition-opacity duration-300">{item.name}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-background text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.name}
              </div>
            )}
          </Link>
        ))}

        <div className="mt-8 mb-2 px-3">
          {!isCollapsed ? (
            <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary opacity-50 whitespace-nowrap transition-opacity duration-300">Management</span>
          ) : (
            <div className="h-px bg-border mx-1" />
          )}
        </div>
      </nav>

      {/* Bottom Nav */}
      <div className="p-3 border-t border-border flex flex-col gap-1 overflow-x-hidden">
        {bottomItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative whitespace-nowrap",
              pathname === item.href 
                ? "bg-surface-hover text-text-primary" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
            )}
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium transition-opacity duration-300">{item.name}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-background text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.name}
              </div>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
}
