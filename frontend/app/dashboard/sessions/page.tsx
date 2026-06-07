"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { 
  Monitor, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/sessions');
      setSessions(response.data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  const handleRevoke = async (sessionId: string) => {
    try {
      setIsRevoking(sessionId);
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to revoke session", err);
    } finally {
      setIsRevoking(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-text-primary flex items-center gap-3">
          <ShieldCheck className="text-primary-brand" />
          Active Sessions
        </h1>
        <p className="text-text-secondary text-sm">
          Manage and revoke your active sessions across different devices and browsers.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className={cn(
              "auth-card p-6 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6",
              session.current ? "border-primary-brand/30 bg-primary-brand/[0.02]" : "border-border hover:border-text-secondary"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center border",
                session.current ? "bg-primary-brand text-background border-primary-brand" : "bg-surface-hover text-text-secondary border-border"
              )}>
                <Monitor size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary text-sm sm:text-base">
                    {session.userAgent.includes('Chrome') ? 'Chrome' : 
                     session.userAgent.includes('Firefox') ? 'Firefox' : 
                     session.userAgent.includes('Safari') ? 'Safari' : 'Browser'} on Windows
                  </h3>
                  {session.current && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-brand text-background text-[10px] font-bold">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary font-mono">
                  <span className="flex items-center gap-1">
                    <Globe size={12} /> {session.ipAddress}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Last active: {new Date(session.lastUsedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                disabled={session.current || isRevoking === session.id}
                onClick={() => setConfirmDelete(session.id)}
                className={cn(
                  "p-2 rounded-md transition-all",
                  session.current 
                    ? "text-text-secondary/20 cursor-not-allowed" 
                    : "text-text-secondary hover:text-error hover:bg-error/10"
                )}
                title={session.current ? "You cannot revoke your current session" : "Revoke Session"}
              >
                {isRevoking === session.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="auth-card p-6 max-w-sm w-full space-y-6 shadow-2xl border-error/20">
            <div className="flex items-center gap-3 text-error">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Revoke Session?</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to end this session? The user will be immediately logged out of that device.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => handleRevoke(confirmDelete)}
                className="flex-1 px-4 py-2 rounded-md bg-error text-white text-sm font-bold hover:bg-error/90 transition-all"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
