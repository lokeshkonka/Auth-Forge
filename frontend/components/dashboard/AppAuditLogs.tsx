"use client";

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AuditLogsTable } from './AuditLogsTable';

export function AppAuditLogs() {
  const { currentOrg, currentApp } = useDashboard();

  if (!currentOrg || !currentApp) return null;

  return (
    <AuditLogsTable 
      orgId={currentOrg.id}
      applicationId={currentApp.id}
      title="Application Audit Logs"
      description={`Security trail and event history for ${currentApp.name}.`}
    />
  );
}
