"use client";

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Loader2, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  MoreVertical,
  Calendar,
  Activity,
  History,
  Lock,
  Globe
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  publishableKey?: string; 
  secretKey?: string;      
  note?: string;
}

export function AppApiKeys() {
  const { currentOrg, currentApp } = useDashboard();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Revoke state
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // View Details state
  const [viewingKey, setViewingKey] = useState<ApiKey | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Creation success state
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!currentOrg || !currentApp) return;
    try {
      setIsLoading(true);
      const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/api-keys`);
      setKeys(data);
    } catch (err) {
      console.error("Failed to fetch API keys", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = async (key: ApiKey) => {
    if (!currentOrg || !currentApp) return;
    try {
      setIsRevealing(true);
      const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/api-keys/${key.id}/reveal`);
      setViewingKey({ ...key, ...data });
    } catch (err) {
      console.error("Failed to reveal keys", err);
      alert("Failed to reveal keys. Ensure you have proper permissions.");
    } finally {
      setIsRevealing(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [currentOrg, currentApp]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !currentApp) return;
    
    setError(null);
    setIsCreating(true);
    
    try {
      const data = await api.post(`/organizations/${currentOrg.id}/applications/${currentApp.id}/api-keys`, {
        name: newKeyName
      });
      setCreatedKey(data);
      await fetchKeys();
    } catch (err: any) {
      setError(err.message || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || !currentApp || !revokingKeyId) return;
    
    try {
      setIsRevoking(true);
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}/api-keys/${revokingKeyId}`);
      setKeys(keys.filter(k => k.id !== revokingKeyId));
      setRevokingKeyId(null);
    } catch (err) {
      console.error("Failed to revoke key", err);
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCreatedKey(null);
    setNewKeyName("");
    setError(null);
    setShowSecret(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Retrieving secure credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Lock className="text-primary-brand" size={24} />
            API Credentials
          </h2>
          <p className="text-text-secondary text-sm">Authentication keys used to access {currentApp?.name} APIs.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-2.5 px-6 rounded-md text-xs flex items-center justify-center gap-2 font-black uppercase tracking-widest shrink-0 shadow-lg shadow-primary-brand/10 hover:shadow-primary-brand/20 transition-all"
        >
          <Plus size={14} />
          Create New Keypair
        </button>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg flex items-start gap-4">
        <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-tight">Access Control Warning</h4>
          <p className="text-[11px] text-text-secondary leading-relaxed max-w-2xl">
            Never expose your <span className="text-yellow-500 font-bold">Secret Key</span> in client-side code. Use it only for secure server-to-server communication. Publishable keys are safe for frontend use.
          </p>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="auth-card py-20 text-center border-dashed border-2 border-border flex flex-col items-center gap-4 bg-surface/20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-border">
            <Key size={32} className="text-text-secondary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-primary">No API keys found</h3>
            <p className="text-xs text-text-secondary">Generate your first keypair to start integrating.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keys.map((key) => (
            <div key={key.id} className="auth-card group border border-border hover:border-text-secondary/30 transition-all flex flex-col h-full bg-[#181818] relative overflow-visible shadow-lg">
              {/* Card Header */}
              <div className="p-6 border-b border-border/50 flex justify-between items-start bg-surface-hover/20">
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border text-text-secondary group-hover:text-primary-brand transition-colors shrink-0">
                     <Key size={18} />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate max-w-[150px]">{key.name}</h3>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Active & Secure</span>
                     </div>
                   </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === key.id ? null : key.id)}
                    className={cn(
                      "p-1.5 hover:bg-background rounded transition-all text-text-secondary border border-transparent",
                      activeMenuId === key.id && "bg-background border-border text-text-primary"
                    )}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenuId === key.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-2xl z-40 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => { handleReveal(key); setActiveMenuId(null); }}
                          disabled={isRevealing}
                          className="w-full px-4 py-2.5 text-[11px] font-bold text-text-primary hover:bg-surface-hover flex items-center gap-3 transition-colors text-left"
                        >
                          {isRevealing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} className="text-primary-brand" />}
                          View Key Details
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button 
                          onClick={() => { setRevokingKeyId(key.id); setActiveMenuId(null); }}
                          className="w-full px-4 py-2.5 text-[11px] font-bold text-error hover:bg-error/10 flex items-center gap-3 transition-colors text-left"
                        >
                          <Trash2 size={14} />
                          Revoke Keypair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-text-secondary opacity-70 tracking-widest flex items-center gap-1.5">
                      <Calendar size={10} className="text-primary-brand" />
                      Created On
                    </p>
                    <p className="text-xs text-text-primary font-bold">{new Date(key.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-text-secondary opacity-70 tracking-widest flex items-center gap-1.5">
                      <Activity size={10} className="text-success" />
                      Last Used
                    </p>
                    <p className="text-xs text-text-primary font-bold truncate">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                    </p>
                 </div>
              </div>

              {/* Card Footer / Quick ID */}
              <div className="mt-auto px-6 py-4 bg-background/50 border-t border-border flex justify-between items-center">
                 <span className="text-[10px] font-mono text-text-secondary/70 truncate pr-4">ID: {key.id}</span>
                 <div className="flex items-center gap-1.5">
                    <ShieldCheck size={10} className="text-primary-brand" />
                    <span className="text-[9px] font-black uppercase text-text-primary tracking-tighter">Production</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {viewingKey && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center text-primary-brand">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">{viewingKey.name}</h3>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">Secure Key Reveal</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingKey(null)}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Keys display */}
                <div className="space-y-4">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-text-secondary tracking-widest flex items-center gap-2">
                          <Globe size={10} className="text-success" />
                          Publishable Key
                        </label>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-success/10 text-success rounded border border-success/20">Client-Safe</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-background border border-border rounded px-3 py-2.5 text-[11px] font-mono text-text-primary truncate">
                          {viewingKey.publishableKey}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(viewingKey.publishableKey!, 'pk_v')}
                          className="p-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-all text-text-primary"
                        >
                          {copiedField === 'pk_v' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                        </button>
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-red-500 tracking-widest flex items-center gap-2">
                          <ShieldAlert size={10} />
                          Secret Key
                        </label>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded border border-red-500/20">Server-Side</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-background border border-border rounded px-3 py-2.5 text-[11px] font-mono text-text-primary relative overflow-hidden flex items-center">
                           <span className={cn(
                             "transition-all duration-300 w-full truncate",
                             showSecret ? "opacity-100 blur-0" : "opacity-40 blur-[4px] select-none"
                           )}>
                             {viewingKey.secretKey}
                           </span>
                           {!showSecret && <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                              <span className="text-[9px] font-black text-text-primary uppercase tracking-[0.2em]">••••••••••••</span>
                           </div>}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setShowSecret(!showSecret)}
                            className="p-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-all text-text-primary"
                          >
                            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(viewingKey.secretKey!, 'sk_v')}
                            className="p-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-all text-text-primary"
                          >
                            {copiedField === 'sk_v' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-lg space-y-3">
                   <p className="text-[10px] uppercase font-black text-text-secondary tracking-tighter opacity-50">Security Notice</p>
                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[11px]">
                         <span className="text-text-secondary">Key Visibility</span>
                         <span className="text-text-primary font-bold">Encrypted & Hashed</span>
                      </div>
                      <p className="text-[9px] text-text-secondary leading-relaxed bg-background/50 p-2 rounded border border-border/50">
                        {viewingKey.note || "For maximum security, secret keys are hashed and cannot be fully retrieved after generation. Create a new keypair if you lost your original secret."}
                      </p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setViewingKey(null)}
                className="w-full bg-text-primary text-background py-3 rounded-md text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
              >
                Finished Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Key Modal */}
      {isModalOpen && !createdKey && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center text-primary-brand">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">New Keypair</h3>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">Secure Credential Generation</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3 text-error">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-text-secondary mb-2">Internal Display Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. My Website Frontend, Analytics Backend"
                    className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <p className="text-[10px] text-text-secondary mt-2 italic opacity-60">This name helps you identify the key in your audit logs.</p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating || !newKeyName}
                  className="flex-1 px-4 py-3 rounded-md bg-primary-brand text-background text-sm font-bold hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Generate Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!revokingKeyId}
        onClose={() => setRevokingKeyId(null)}
        onConfirm={handleDelete}
        isLoading={isRevoking}
        title="Revoke API Key?"
        description="This action is permanent and cannot be undone. Any application or server using this keypair will lose access immediately."
        confirmText="Revoke Permanently"
      />
    </div>
  );
}
