"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { AppNavbar } from '@/components/dashboard/AppNavbar';
import { useAuth } from '@/context/AuthContext';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { organizations, currentOrg, setCurrentOrg, currentApp, isLoading: isDashboardLoading } = useDashboard();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth');
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || (isDashboardLoading && organizations.length === 0 && !currentOrg)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-jetbrains">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        orgSlug={currentOrg?.slug || ''} 
      />
      
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col",
        isSidebarCollapsed ? "pl-[70px]" : "pl-0 md:pl-[240px]"
      )}>
        <Navbar 
          organizations={organizations} 
          currentOrg={currentOrg} 
          onOrgChange={setCurrentOrg}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <AppNavbar isSidebarCollapsed={isSidebarCollapsed} />

        <main className={cn(
          "flex-1 px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full transition-all duration-300",
          currentApp ? "pt-32" : "pt-24"
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-[240px] h-full bg-surface border-r border-border p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={() => {}} 
              orgSlug={currentOrg?.slug || ''} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>
  );
}
