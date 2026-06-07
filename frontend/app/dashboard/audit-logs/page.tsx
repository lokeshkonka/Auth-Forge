"use client";

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AuditLogsTable } from '@/components/dashboard/AuditLogsTable';

export default function AuditLogsPage() {
  const { currentOrg } = useDashboard();

  if (!currentOrg) return null;

  return (
    <AuditLogsTable 
      orgId={currentOrg.id}
      title="Organization Audit Logs"
      description="Detailed history of all actions performed in this organization."
    />
  );
}
