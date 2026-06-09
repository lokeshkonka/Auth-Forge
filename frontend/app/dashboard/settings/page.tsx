"use client";

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Trash2, Shield, Bell, CreditCard, Loader2, Check } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { ConfirmModal } from '@/components/dashboard/ConfirmModal';

export default function SettingsPage() {
  const { currentOrg, refreshOrgs } = useDashboard();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name);
    }
  }, [currentOrg]);

  const handleSave = async () => {
    if (!currentOrg || !name) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await api.patch(`/organizations/${currentOrg.id}`, { name });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      await refreshOrgs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete organization' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!currentOrg) return null;

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Organization Settings</h1>
          <p className="text-text-secondary text-sm">Update your workspace configuration and policies.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || name === currentOrg.name}
          className="btn-primary py-2 px-6 rounded-md text-xs flex items-center justify-center gap-2 self-start sm:self-auto font-black uppercase tracking-widest disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={cn(
          "mb-6 p-4 rounded-lg border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
        )}>
          {message.type === 'success' ? <Check size={18} /> : <Trash2 size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="auth-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Organization Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Slug (Permanent)</label>
                <input 
                  type="text" 
                  value={currentOrg.slug}
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-secondary font-mono opacity-60 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="auth-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Security Policies
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-hover/30 rounded-lg border border-border opacity-60 grayscale cursor-not-allowed">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">Enforce Multi-Factor Authentication (MFA)</div>
                  <div className="text-xs text-text-secondary">Require all members to use MFA to access the organization.</div>
                </div>
                <div className="w-10 h-5 bg-border rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-text-secondary rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-hover/30 rounded-lg border border-border opacity-60 grayscale cursor-not-allowed">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">Restrict Member Invitations</div>
                  <div className="text-xs text-text-secondary">Only owners can invite new members.</div>
                </div>
                <div className="w-10 h-5 bg-border rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-text-secondary rounded-full shadow-sm" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary italic">Note: Security policy configuration is available for Enterprise plans.</p>
          </div>

          {/* Danger Zone */}
          <div className="auth-card p-6 md:p-8 border-error/20">
            <h3 className="text-lg font-bold text-error flex items-center gap-2 mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-text-secondary mb-6">Once you delete an organization, there is no going back. All applications and users will be permanently removed.</p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-md bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-all flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Organization
            </button>
          </div>
        </div>

        {/* Sidebar Settings Info */}
        <div className="space-y-4">
          <div className="auth-card p-6 border border-border">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Quick Links</h4>
            <div className="space-y-1">
              {['Usage Reports', 'Security Logs', 'API Status'].map(link => (
                <button key={link} className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-all">
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="auth-card p-6 border border-border bg-primary-brand/5 border-primary-brand/20">
            <div className="w-10 h-10 rounded-full bg-primary-brand flex items-center justify-center mb-4">
              <Shield size={20} className="text-background" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-2">Enterprise Security</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
              Unlock advanced security features like SAML SSO, IP whitelisting, and custom domain mapping.
            </p>
            <button className="text-[11px] font-bold text-primary-brand hover:underline">
              Upgrade to Enterprise →
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Organization?"
        description={`Are you sure you want to delete ${currentOrg.name}? This action is permanent and will delete all associated applications, keys, and audit logs.`}
        confirmText="Yes, Delete Organization"
      />
    </>
  );
}

import { cn } from '@/lib/utils';
