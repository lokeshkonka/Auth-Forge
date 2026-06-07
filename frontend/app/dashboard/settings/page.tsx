"use client";

import React from 'react';
import { Settings as SettingsIcon, Save, Trash2, Shield, Bell, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Organization Settings</h1>
          <p className="text-text-secondary text-sm">Update your workspace configuration and billing.</p>
        </div>
        <button className="btn-primary py-2 px-6 rounded-md text-xs flex items-center justify-center gap-2 self-start sm:self-auto font-bold">
          <Save size={14} />
          Save Changes
        </button>
      </div>

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
                  defaultValue="Acme Corp"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Slug</label>
                <input 
                  type="text" 
                  defaultValue="acme-corp"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-secondary font-mono opacity-60 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Billing Email</label>
              <input 
                type="email" 
                defaultValue="billing@acme.com"
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="auth-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Security Policies
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-hover/30 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">Enforce Multi-Factor Authentication (MFA)</div>
                  <div className="text-xs text-text-secondary">Require all members to use MFA to access the organization.</div>
                </div>
                <div className="w-10 h-5 bg-primary-brand/20 rounded-full relative cursor-pointer border border-primary-brand/50">
                  <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 bg-primary-brand rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-hover/30 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">Restrict Member Invitations</div>
                  <div className="text-xs text-text-secondary">Only owners can invite new members.</div>
                </div>
                <div className="w-10 h-5 bg-border rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-text-secondary rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="auth-card p-6 md:p-8 border-error/20">
            <h3 className="text-lg font-bold text-error flex items-center gap-2 mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-text-secondary mb-6">Once you delete an organization, there is no going back. Please be certain.</p>
            <button className="px-4 py-2 rounded-md bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-all flex items-center gap-2">
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
              {['Billing History', 'Usage Reports', 'Security Logs', 'API Status'].map(link => (
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
    </>
  );
}
