"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, LayoutGrid, ArrowUpRight, ShieldCheck, Globe, Activity } from 'lucide-react';
import { AppDashboard } from '@/components/dashboard/AppDashboard';
import { AppUsers } from '@/components/dashboard/AppUsers';
import { AppRoles } from '@/components/dashboard/AppRoles';
import { AppPermissions } from '@/components/dashboard/AppPermissions';
import { AppAuditLogs } from '@/components/dashboard/AppAuditLogs';
import { AppApiKeys } from '@/components/dashboard/AppApiKeys';
import { AppDocs } from '@/components/dashboard/AppDocs';
import { AppSettings } from '@/components/dashboard/AppSettings';

export default function DashboardPage() {
  const router = useRouter();
...
  const { currentOrg, setCurrentApp, currentApp, activeSubView } = useDashboard();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      if (!currentOrg) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const apps = await api.get(`/organizations/${currentOrg.id}/applications`);
        setApplications(apps);
      } catch (err) {
        console.error("Failed to fetch applications", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, [currentOrg]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    try {
      setIsCreatingApp(true);
      const slug = newAppName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newApp = await api.post(`/organizations/${currentOrg.id}/applications`, {
        name: newAppName,
        slug,
        description: newAppDescription
      });
      setApplications([...applications, newApp]);
      setNewAppName("");
      setNewAppDescription("");
    } catch (err) {
      console.error("Failed to create application", err);
    } finally {
      setIsCreatingApp(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-primary-brand w-12 h-12" />
      <p className="text-xs text-text-secondary font-mono animate-pulse uppercase tracking-[0.2em]">Synchronizing Environments...</p>
    </div>
  );

  if (currentApp) {
    switch (activeSubView) {
      case 'users':
        return <AppUsers />;
      case 'roles':
        return <AppRoles />;
      case 'permissions':
        return <AppPermissions />;
      case 'audit-logs':
        return <AppAuditLogs />;
      case 'api-keys':
        return <AppApiKeys />;
      case 'docs':
        return <AppDocs />;
      case 'settings':
        return <AppSettings />;
      default:
        return <AppDashboard />;
    }
  }

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Applications</h1>
          <p className="text-text-secondary text-sm font-medium">Isolated secure environments for your users and keys.</p>
        </div>
        {applications.length > 0 && (
          <button 
            onClick={() => {/* trigger modal logic if any */}}
            className="btn-primary py-2.5 px-6 rounded-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 self-start sm:self-auto shadow-lg shadow-primary-brand/10 transition-all hover:scale-105"
          >
            <Plus size={14} />
            Create Application
          </button>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="auth-card p-16 text-center max-w-2xl mx-auto border-dashed border-2 border-border mt-12 bg-[#121212]">
          <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border shadow-2xl">
            <LayoutGrid size={40} className="text-text-secondary" />
          </div>
          <h2 className="text-2xl font-black mb-4 text-text-primary uppercase tracking-tight">Deploy your first application</h2>
          <p className="text-text-secondary text-sm mb-10 leading-relaxed font-medium">
            Applications are secure environments that hold your users, roles, and API keys. Create one to start integrating AuthForge.
          </p>
          <form onSubmit={handleCreateApp} className="space-y-6 text-left max-w-md mx-auto">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary mb-3">Internal App Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Production Cluster"
                className="w-full bg-background border border-border rounded-xl px-5 py-4 text-sm text-text-primary focus:border-primary-brand transition-all outline-none font-bold shadow-inner"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isCreatingApp}
              className="btn-primary w-full py-4 rounded-xl text-xs mt-4 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] shadow-xl"
            >
              {isCreatingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
              Initialize Application
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {applications.map((app) => (
            <div 
              key={app.id} 
              onClick={() => setCurrentApp(app)}
              className="group relative flex flex-col h-full"
            >
              <div className="absolute inset-0 bg-primary-brand/20 blur-[100px] opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none" />
              
              <div className="auth-card flex-1 p-8 border border-border group-hover:border-primary-brand/50 transition-all duration-300 cursor-pointer flex flex-col bg-[#0c0c0c] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                   <div className="w-10 h-10 rounded-full bg-primary-brand flex items-center justify-center text-background shadow-xl">
                      <ArrowUpRight size={20} />
                   </div>
                </div>

                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-all duration-500 border border-border shadow-lg group-hover:rotate-[10deg] group-hover:scale-110">
                    <LayoutGrid size={32} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] px-3 py-1 bg-background border border-border rounded-full font-black text-text-secondary uppercase tracking-widest group-hover:text-primary-brand group-hover:border-primary-brand/30 transition-colors">
                      {app.slug}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-success/5 border border-success/10">
                       <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                       <span className="text-[8px] font-black text-success uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-black mb-4 text-text-primary tracking-tighter uppercase group-hover:text-primary-brand transition-colors duration-300">
                  {app.name}
                </h3>
                <p className="text-xs text-text-secondary mb-10 line-clamp-2 leading-relaxed flex-1 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                  {app.description || "Production-grade authentication environment."}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-black text-text-secondary/50 uppercase tracking-widest">Environment</span>
                         <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">Production</span>
                      </div>
                      <div className="w-px h-6 bg-border" />
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-black text-text-secondary/50 uppercase tracking-widest">Region</span>
                         <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">Global</span>
                      </div>
                   </div>
                   <div className="text-[9px] font-black text-primary-brand uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                      Inspect Environment
                   </div>
                </div>
              </div>
            </div>
          ))}
          
          <div 
            className="auth-card p-8 border-dashed border-2 border-border/40 flex flex-col items-center justify-center gap-6 hover:bg-surface-hover/30 hover:border-primary-brand/50 transition-all group min-h-[340px] bg-transparent cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-text-secondary group-hover:scale-110 group-hover:text-primary-brand transition-all border border-border group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <Plus size={40} strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
               <span className="block text-xs font-black uppercase tracking-[0.2em] text-text-primary">Deploy New App</span>
               <span className="block text-[10px] font-medium text-text-secondary uppercase tracking-widest opacity-50">Create Isolated Context</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
