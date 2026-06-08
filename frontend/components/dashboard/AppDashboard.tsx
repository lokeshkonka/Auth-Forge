"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Activity, 
  Loader2, 
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings,
  UserPlus,
  LayoutGrid
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';

interface Stats {
  userCount: number;
  apiKeyCount: number;
  trends: { date: string; count: number }[];
}

export function AppDashboard() {
  const { currentOrg, currentApp } = useDashboard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrg || !currentApp) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/stats`);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch application stats", err);
        setError("Unable to load application metrics. Please ensure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [currentOrg, currentApp]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Aggregating application metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-card p-12 text-center flex flex-col items-center gap-4 border-dashed border-2 border-border">
        <AlertCircle size={40} className="text-error opacity-50" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text-primary">Operational Error</h3>
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.trends.map(t => t.count), 1);

  const checklistItems = [
    { name: 'handle permissions', status: 'ready', icon: Key },
    { name: 'handle roles', status: 'ready', icon: ShieldCheck },
    { name: 'view audit', status: 'ready', icon: Activity },
    { name: 'handle members', status: 'ready', icon: Users },
    { name: 'handle applications', status: 'ready', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="auth-card p-8 border border-border flex flex-col gap-4 group hover:border-text-primary transition-all bg-[#121212]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
              <ArrowUpRight size={12} />
              LIVE
            </span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary mb-2">Total End Users</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter">{stats.userCount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="auth-card p-8 border border-border flex flex-col gap-4 group hover:border-text-primary transition-all bg-[#121212]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Key size={24} />
            </div>
            <span className="text-[10px] font-black text-text-secondary bg-surface px-2 py-1 rounded border border-border">STABLE</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary mb-2">API Keys</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter">{stats.apiKeyCount}</h3>
          </div>
        </div>

        <div className="auth-card p-8 border border-border flex flex-col gap-4 group hover:border-text-primary transition-all bg-[#121212]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-black text-primary-brand bg-primary-brand/10 px-2 py-1 rounded border border-primary-brand/20">24H</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary mb-2">Total Requests</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter">
              {stats.trends.reduce((acc, t) => acc + t.count, 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Trend Chart */}
        <div className="lg:col-span-2 auth-card p-8 border border-border bg-[#121212]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
                <TrendingUp size={20} className="text-primary-brand" />
                Traffic Overview
              </h3>
              <p className="text-xs text-text-secondary mt-1">Real-time distribution of application requests.</p>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
            {stats.trends.map((day, idx) => {
              const height = (day.count / maxCount) * 100;
              const isToday = idx === stats.trends.length - 1;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group relative">
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 bg-text-primary text-background px-3 py-1.5 rounded-md text-[11px] font-black whitespace-nowrap shadow-2xl border border-white/20">
                    {day.count} requests
                  </div>
                  
                  <div className="w-full bg-surface/50 rounded-t-lg relative overflow-hidden h-full border-x border-t border-border/30">
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out",
                        isToday ? "bg-primary-brand shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-primary-brand/30 group-hover:bg-primary-brand/50"
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      isToday ? "text-primary-brand" : "text-text-secondary group-hover:text-text-primary"
                    )}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permission Checklist */}
        <div className="auth-card p-8 border border-border flex flex-col gap-8 bg-[#121212]">
          <div>
            <h3 className="text-base font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
              <CheckCircle2 size={20} className="text-success" />
              Checklist
            </h3>
            <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-[0.3em] font-black opacity-60">System Ready</p>
          </div>
          
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border group hover:border-primary-brand/30 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
                    <item.icon size={18} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-text-primary">{item.name}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success border border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                  <CheckCircle2 size={14} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-5 bg-background border border-border rounded-xl">
             <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={16} className="text-primary-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Owner Verified</span>
             </div>
            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
              You are the authorized creator. All administrative functions are unlocked and available for immediate use.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="auth-card p-6 border border-border bg-surface-hover/20">
          <h4 className="text-[11px] uppercase tracking-widest font-black text-text-secondary mb-4 flex items-center gap-2">
            <ShieldCheck size={14} />
            Security Overview
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-text-secondary">Publishable Key Status</span>
              <span className="text-[10px] font-bold text-success uppercase tracking-widest bg-success/10 px-2 py-0.5 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-text-secondary">Secret Key Status</span>
              <span className="text-[10px] font-bold text-success uppercase tracking-widest bg-success/10 px-2 py-0.5 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-text-secondary">Organization Ownership</span>
              <span className="text-[10px] font-bold text-primary-brand uppercase tracking-widest bg-primary-brand/10 px-2 py-0.5 rounded">Verified</span>
            </div>
          </div>
        </div>

        <div className="auth-card p-6 border border-border flex flex-col justify-center items-center text-center gap-4 group cursor-pointer hover:bg-surface-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand border border-primary-brand/20 group-hover:scale-110 transition-transform">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">View Global Audit Logs</h4>
            <p className="text-[11px] text-text-secondary mt-1">Deep dive into every request and event for this organization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

