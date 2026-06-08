"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, LayoutGrid } from 'lucide-react';
import { AppDashboard } from '@/components/dashboard/AppDashboard';
import { AppUsers } from '@/components/dashboard/AppUsers';
import { AppRoles } from '@/components/dashboard/AppRoles';
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
        <div className="auth-card p-12 text-center max-w-2xl mx-auto border-dashed border-2 border-border mt-12">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
            <LayoutGrid size={32} className="text-text-secondary" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-text-primary">Deploy your first application</h2>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Applications hold your users, roles, and API keys. 
          </p>
          <form onSubmit={handleCreateApp} className="space-y-4 text-left max-w-md mx-auto">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2">App Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Production Cluster"
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isCreatingApp}
              className="btn-primary w-full py-3 rounded-md text-sm mt-4 flex items-center justify-center gap-2 font-bold"
            >
              {isCreatingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
              Create Application
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div 
              key={app.id} 
              onClick={() => setCurrentApp(app)}
              className="auth-card p-6 border border-border group hover:border-text-secondary transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-md bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-primary-brand transition-colors border border-border">
                  <LayoutGrid size={20} />
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded font-mono text-text-secondary">{app.slug}</span>
              </div>
              <h3 className="text-sm font-bold mb-2 text-text-primary group-hover:underline decoration-primary-brand underline-offset-4 decoration-2">{app.name}</h3>
              <p className="text-xs text-text-secondary mb-6 line-clamp-2 leading-relaxed flex-1">{app.description || "Auth environment for this app."}</p>
            </div>
          ))}
          <button className="auth-card p-6 border-dashed border-2 border-border flex flex-col items-center justify-center gap-3 hover:bg-surface-hover/30 transition-all group min-h-[200px]">
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary group-hover:scale-110 transition-transform border border-border"><Plus size={20} /></div>
            <span className="text-sm font-bold text-text-primary">Create App</span>
          </button>
        </div>
      )}
    </>
  );
}
