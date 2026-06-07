"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronDown, 
  LogOut, 
  User, 
  Bell, 
  Search, 
  Menu,
  Building2,
  Settings,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavbarProps {
  organizations: any[];
  currentOrg: any;
  onOrgChange: (org: any) => void;
  onMenuClick: () => void;
}

export function Navbar({ organizations, currentOrg, onOrgChange, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  let menuTimer: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(menuTimer);
    setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    menuTimer = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 300);
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  return (
    <header className="h-16 border-b border-border bg-surface fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Org Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surface-hover border border-transparent hover:border-border transition-all"
          >
            <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center border border-border">
              <Building2 size={14} className="text-primary-brand" />
            </div>
            <span className="text-sm font-semibold text-text-primary hidden sm:block whitespace-nowrap">
              {currentOrg?.name || 'Select Organization'}
            </span>
            <ChevronDown size={14} className={cn("text-text-secondary transition-transform", isOrgMenuOpen && "rotate-180")} />
          </button>

          {isOrgMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border rounded-md shadow-xl py-1 z-50">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-text-secondary opacity-50 border-b border-border mb-1">
                Organizations
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    onOrgChange(org);
                    setIsOrgMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-surface-hover transition-colors",
                    currentOrg?.id === org.id ? "text-text-primary font-medium" : "text-text-secondary"
                  )}
                >
                  {org.name}
                  {currentOrg?.id === org.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Animated Search Bar */}
        <div className={cn(
          "relative flex items-center transition-all duration-300 ease-in-out",
          isSearchExpanded ? "w-48 lg:w-64" : "w-10"
        )}>
          <button 
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className={cn(
              "p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors z-10",
              isSearchExpanded && "absolute left-0"
            )}
          >
            <Search size={18} />
          </button>
          <input 
            type="text" 
            placeholder="Search..."
            onBlur={() => !isSearchExpanded && setIsSearchExpanded(false)}
            className={cn(
              "bg-background border border-border rounded-md py-1.5 text-xs transition-all duration-300 ease-in-out focus:border-text-primary outline-none",
              isSearchExpanded ? "w-full pl-9 pr-8 opacity-100" : "w-0 opacity-0 border-none"
            )}
            autoFocus={isSearchExpanded}
          />
          {isSearchExpanded && (
            <button 
              onClick={() => setIsSearchExpanded(false)}
              className="absolute right-2 text-text-secondary hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={20} />
        </button>

        {/* User Menu */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-hover transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center border border-border overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-text-secondary" />
              )}
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-0 pt-2 w-48 z-50">
              <div className="bg-surface border border-border rounded-md shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-border mb-1 bg-surface-hover/30">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                  </p>
                  <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
                </div>
                
                <Link href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors">
                  <Settings size={14} />
                  Settings
                </Link>
                
                <Link href="/dashboard/sessions" className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors">
                  <ShieldCheck size={14} />
                  Sessions
                </Link>

                <div className="border-t border-border mt-1 pt-1">
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="auth-card p-6 max-w-sm w-full space-y-6 shadow-2xl border-error/20">
            <div className="flex items-center gap-3 text-error">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Sign Out?</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to log out of your account? You will need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border"
              >
                Cancel
              </button>
              <button 
                onClick={() => logout()}
                className="flex-1 px-4 py-2 rounded-md bg-error text-white text-sm font-bold hover:bg-error/90 transition-all"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Plus({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
