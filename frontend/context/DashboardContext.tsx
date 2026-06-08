"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Application {
  id: string;
  name: string;
  slug: string;
}

interface DashboardContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  currentApp: Application | null;
  setCurrentApp: (app: Application | null) => void;
  activeSubView: string;
  setActiveSubView: (view: string) => void;
  isLoading: boolean;
  refreshOrgs: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  const [activeSubView, setActiveSubView] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrgs = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const memberships = await api.get('/organizations');
      const orgs = memberships.map((m: any) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug
      }));
      setOrganizations(orgs);
      
      if (orgs.length > 0) {
        const cachedOrgId = localStorage.getItem('lastOrgId');
        const cachedOrg = orgs.find((o: any) => o.id === cachedOrgId);
        const selectedOrg = cachedOrg || orgs[0];
        setCurrentOrg(selectedOrg);
        localStorage.setItem('lastOrgId', selectedOrg.id);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshOrgs();
  }, [refreshOrgs]);

  const handleSetCurrentOrg = (org: Organization) => {
    setCurrentOrg(org);
    setCurrentApp(null); // Reset current app when changing org
    setActiveSubView('overview');
    localStorage.setItem('lastOrgId', org.id);
  };

  const handleSetCurrentApp = (app: Application | null) => {
    setCurrentApp(app);
    setActiveSubView('overview');
  };

  return (
    <DashboardContext.Provider value={{ 
      organizations, 
      currentOrg, 
      setCurrentOrg: handleSetCurrentOrg, 
      currentApp,
      setCurrentApp: handleSetCurrentApp,
      activeSubView,
      setActiveSubView,
      isLoading,
      refreshOrgs
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
