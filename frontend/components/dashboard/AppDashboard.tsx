"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Activity, 
  Loader2, 
  TrendingUp,
  ArrowUpRight,
  ShieldCheck
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

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentOrg || !currentApp) return;
      try {
        setIsLoading(true);
        const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/stats`);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch application stats", err);
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

  if (!stats) return null;

  const maxCount = Math.max(...stats.trends.map(t => t.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="auth-card p-6 border border-border flex flex-col gap-4 group hover:border-text-secondary transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-1">
              <ArrowUpRight size={12} />
              Live
            </span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-1">Total End Users</p>
            <h3 className="text-3xl font-black text-text-primary">{stats.userCount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="auth-card p-6 border border-border flex flex-col gap-4 group hover:border-text-secondary transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Key size={20} />
            </div>
            <span className="text-[10px] font-bold text-text-secondary">Active</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-1">API Keys</p>
            <h3 className="text-3xl font-black text-text-primary">{stats.apiKeyCount}</h3>
          </div>
        </div>

        <div className="auth-card p-6 border border-border flex flex-col gap-4 group hover:border-text-secondary transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-bold text-primary-brand">24h</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-1">Total Requests</p>
            <h3 className="text-3xl font-black text-text-primary">
              {stats.trends.reduce((acc, t) => acc + t.count, 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Request Trend Chart (CSS-based) */}
      <div className="auth-card p-8 border border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-brand" />
              Request Distribution
            </h3>
            <p className="text-[11px] text-text-secondary mt-1">Audit log activity over the last 7 days</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-brand" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter">Requests</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
          {stats.trends.map((day, idx) => {
            const height = (day.count / maxCount) * 100;
            const isToday = idx === stats.trends.length - 1;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-text-primary text-background px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-xl">
                  {day.count} requests
                </div>
                
                <div className="w-full bg-surface-hover/30 rounded-t-sm relative overflow-hidden h-full">
                  <div 
                    className={cn(
                      "absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out",
                      isToday ? "bg-primary-brand" : "bg-primary-brand/40 group-hover:bg-primary-brand/60"
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-tighter transition-colors",
                    isToday ? "text-primary-brand" : "text-text-secondary group-hover:text-text-primary"
                  )}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-[8px] text-text-secondary/50 font-mono">
                    {day.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              </div>
            );
          })}
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
              <span className="text-xs text-text-secondary">Last Security Audit</span>
              <span className="text-[10px] font-mono text-text-primary">Today, 14:22</span>
            </div>
          </div>
        </div>

        <div className="auth-card p-6 border border-border flex flex-col justify-center items-center text-center gap-4 group cursor-pointer hover:bg-surface-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand border border-primary-brand/20 group-hover:scale-110 transition-transform">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">View Full Logs</h4>
            <p className="text-[11px] text-text-secondary mt-1">Deep dive into every request and event for this app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
