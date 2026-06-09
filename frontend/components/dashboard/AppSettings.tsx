"use client";

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Trash2, Loader2, Check, AlertCircle, LayoutGrid } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

export function AppSettings() {
  const { currentOrg, currentApp, setCurrentApp, refreshOrgs } = useDashboard();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (currentApp) {
      setName(currentApp.name);
      setDescription(currentApp.description || "");
    }
  }, [currentApp]);

  const handleSave = async () => {
    if (!currentOrg || !currentApp || !name) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await api.patch(`/organizations/${currentOrg.id}/applications/${currentApp.id}`, { 
        name,
        description
      });
      setMessage({ type: 'success', text: 'Application updated successfully!' });
      // Update local state in context if needed, or just let refresh handle it
      setCurrentApp(updated);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update application' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || !currentApp) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}`);
      setCurrentApp(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete application' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!currentApp) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <SettingsIcon className="text-primary-brand" size={24} />
            Application Settings
          </h2>
          <p className="text-text-secondary text-sm">Update metadata and environment lifecycle for {currentApp.name}.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || (name === currentApp.name && description === (currentApp.description || ""))}
          className="btn-primary py-2.5 px-6 rounded-md text-xs flex items-center justify-center gap-2 font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-primary-brand/10"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-lg border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
        )}>
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
          {/* General Configuration */}
          <div className="auth-card p-6 md:p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
               <div className="w-8 h-8 rounded-lg bg-primary-brand/10 flex items-center justify-center text-primary-brand">
                  <LayoutGrid size={16} />
               </div>
               <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">General Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Cluster"
                  className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Identifier (Slug)</label>
                <div className="w-full bg-background/50 border border-border rounded-md px-4 py-3 text-sm text-text-secondary font-mono flex items-center gap-2">
                   <span className="opacity-50">/</span>
                   {currentApp.slug}
                </div>
                <p className="text-[9px] text-text-secondary italic">This is used in your API URLs and cannot be changed.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Environment Description</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this application for?"
                className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:border-text-primary transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="auth-card p-6 md:p-8 border-error/20 bg-error/5">
            <div className="flex items-center gap-3 mb-6">
               <Trash2 size={18} className="text-error" />
               <h3 className="text-sm font-black uppercase tracking-widest text-error">Danger Zone</h3>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 bg-background border border-error/20 rounded-xl">
               <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary">Delete Application</h4>
                  <p className="text-xs text-text-secondary">Permanently remove this environment, including all users, roles, and keys.</p>
               </div>
               <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2.5 rounded-lg bg-error text-white text-xs font-black uppercase tracking-widest hover:bg-error/90 transition-all shrink-0"
              >
                Delete {currentApp.slug}
              </button>
            </div>
          </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Application?"
        description={`Are you sure you want to delete ${currentApp.name}? This action is irreversible. All associated end-users, roles, and API keys will be permanently destroyed.`}
        confirmText="Yes, Delete Application"
      />
    </div>
  );
}
