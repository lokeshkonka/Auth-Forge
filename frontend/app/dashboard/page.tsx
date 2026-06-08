"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { AppDashboard } from '@/components/dashboard/AppDashboard';
import { AppUsers } from '@/components/dashboard/AppUsers';
import { AppRoles } from '@/components/dashboard/AppRoles';
import { AppPermissions } from '@/components/dashboard/AppPermissions';
import { AppAuditLogs } from '@/components/dashboard/AppAuditLogs';
import { AppApiKeys } from '@/components/dashboard/AppApiKeys';
import { AppDocs } from '@/components/dashboard/AppDocs';

interface Application {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg, setCurrentApp, currentApp, activeSubView } = useDashboard();
  const [applications, setApplications] = useState<Application[]>([]);
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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-brand" /></div>;

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
      default:
        return <AppDashboard />;
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Applications</h1>
          <p className="text-text-secondary text-sm">Manage your authentication environments.</p>
        </div>
        {applications.length > 0 && (
          <button className="btn-primary py-2 px-4 rounded-md text-xs flex items-center justify-center gap-2 self-start sm:self-auto">
            <Plus size={14} />
            Create New App
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
              className="auth-card p-8 border border-border group hover:border-primary-brand/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all cursor-pointer flex flex-col h-full bg-[#121212] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <ArrowUpRight size={24} className="text-primary-brand" />
              </div>

              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border shadow-lg">
                  <LayoutGrid size={28} />
                </div>
                <span className="text-[10px] px-3 py-1 bg-background border border-border rounded-full font-black text-text-secondary uppercase tracking-widest">{app.slug}</span>
              </div>
              
              <h3 className="text-lg font-black mb-3 text-text-primary tracking-tight uppercase group-hover:text-primary-brand transition-colors">{app.name}</h3>
              <p className="text-xs text-text-secondary mb-8 line-clamp-2 leading-relaxed flex-1 font-medium">{app.description || "Secure authentication environment for this application."}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Active</span>
                 </div>
                 <span className="text-[10px] font-black text-primary-brand uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">Manage App</span>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { /* Potential modal trigger */ }}
            className="auth-card p-8 border-dashed border-2 border-border flex flex-col items-center justify-center gap-4 hover:bg-surface-hover/30 hover:border-primary-brand/50 transition-all group min-h-[260px] bg-transparent"
          >
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-text-secondary group-hover:scale-110 group-hover:text-primary-brand transition-all border border-border"><Plus size={28} /></div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Create New App</span>
          </button>
        </div>
      )}
    </>
  );
}
