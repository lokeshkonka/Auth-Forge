"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  FileJson,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  ReceiptText
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  createdAt: string;
  oldValue: any;
  newValue: any;
}

interface AuditLogsTableProps {
  orgId: string;
  applicationId?: string;
  title: string;
  description: string;
}

export function AuditLogsTable({ orgId, applicationId, title, description }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortConfig, setSortSortConfig] = useState<{ key: keyof AuditLog, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        let url = `/organizations/${orgId}/audit-logs?limit=100`;
        if (applicationId) {
          url += `&applicationId=${applicationId}`;
        }
        const data = await api.get(url);
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [orgId, applicationId]);

  const handleSort = (key: keyof AuditLog) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortSortConfig({ key, direction });
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = 
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.actorId || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [logs, searchTerm, statusFilter, sortConfig]);

  const exportCSV = () => {
    const headers = ["ID", "Action", "Resource", "Status", "Actor", "IP", "Timestamp"];
    const rows = filteredLogs.map(log => [
      log.id,
      log.action,
      log.resourceType,
      log.status,
      log.actorId || "System",
      log.ipAddress || "N/A",
      new Date(log.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Retrieving secure audit trails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-primary">{title}</h1>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportJSON}
            className="bg-surface border border-border py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-hover transition-all text-text-secondary hover:text-text-primary"
          >
            <FileJson size={14} />
            JSON
          </button>
          <button 
            onClick={exportCSV}
            className="bg-primary-brand/10 border border-primary-brand/20 py-2 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-brand/20 transition-all text-primary-brand"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="auth-card overflow-hidden flex flex-col border-border">
        {/* Advanced Filters */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 items-center justify-between bg-surface/30">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input 
              type="text" 
              placeholder="Search by action, resource, or actor..."
              className="bg-background border border-border rounded-md pl-9 pr-4 py-2 text-xs w-full focus:border-text-primary transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-1.5">
              <Filter size={12} className="text-text-secondary" />
              <select 
                className="bg-transparent text-xs text-text-primary outline-none border-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failure</option>
              </select>
            </div>
            
            <div className="text-[10px] font-mono text-text-secondary">
              Showing {filteredLogs.length} of {logs.length} entries
            </div>
          </div>
        </div>

        {/* Excel-like Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface text-[10px] uppercase tracking-widest font-black text-text-secondary border-b border-border">
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center gap-2">
                    Action <ArrowUpDown size={10} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => handleSort('resourceType')}
                >
                  <div className="flex items-center gap-2">
                    Resource <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actor</th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors text-right"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Timestamp <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px] font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Calendar size={40} />
                      <p className="text-sm font-medium">No audit logs match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-hover/20 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-text-primary font-bold">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary group-hover:text-text-primary transition-colors">
                        {log.resourceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        log.status === 'SUCCESS' ? "text-success bg-success/10" : "text-error bg-error/10"
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-secondary truncate block max-w-[120px]" title={log.actorId}>
                        {log.actorId || "System"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-text-secondary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-primary-brand/10 rounded transition-all text-text-secondary hover:text-primary-brand"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-border rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border",
                  selectedLog.status === 'SUCCESS' ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
                )}>
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">{selectedLog.action}</h3>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">
                    {selectedLog.resourceType} • {selectedLog.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-text-secondary opacity-50">Actor</p>
                  <p className="text-xs text-text-primary font-mono truncate">{selectedLog.actorId || "System"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-text-secondary opacity-50">IP Address</p>
                  <p className="text-xs text-text-primary font-mono">{selectedLog.ipAddress || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-text-secondary opacity-50">Status</p>
                  <p className="text-xs text-text-primary font-mono">{selectedLog.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-text-secondary opacity-50">Timestamp</p>
                  <p className="text-xs text-text-primary font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] uppercase font-black text-text-secondary">Old Values</p>
                     <FileText size={12} className="text-text-secondary opacity-30" />
                   </div>
                   <pre className="bg-background border border-border p-4 rounded-md text-[10px] text-text-secondary font-mono overflow-x-auto min-h-[150px]">
                     {JSON.stringify(selectedLog.oldValue, null, 2) || "No previous values"}
                   </pre>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] uppercase font-black text-text-secondary">New Values</p>
                     <FileText size={12} className="text-text-secondary opacity-30" />
                   </div>
                   <pre className="bg-background border border-border p-4 rounded-md text-[10px] text-text-primary font-mono overflow-x-auto min-h-[150px]">
                     {JSON.stringify(selectedLog.newValue, null, 2) || "No new values"}
                   </pre>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black text-text-secondary">User Agent</p>
                <div className="bg-surface/30 p-3 rounded border border-border text-[10px] text-text-secondary font-mono break-all italic">
                  {selectedLog.userAgent || "No user agent data available"}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-surface/50 text-right">
               <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-text-primary text-background rounded text-xs font-bold hover:opacity-90 transition-all"
               >
                 Close Detail View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size: number, className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
