"use client";

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  AlertCircle,
  X,
  Edit2,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

interface AppPermission {
  id: string;
  key: string;
  name: string;
  description?: string;
  createdAt: string;
}

export function AppPermissions() {
  const { currentOrg, currentApp } = useDashboard();
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [editingPermission, setEditingPermission] = useState<AppPermission | null>(null);
  const [permissionKey, setPermissionKey] = useState("");
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  
  // Custom delete confirmation
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);
  const [isDeletingPermission, setIsDeletingPermission] = useState(false);

  const fetchPermissions = async () => {
    if (!currentOrg || !currentApp) return;
    try {
      setIsLoading(true);
      const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/permissions`);
      setPermissions(data);
    } catch (err) {
      console.error("Failed to fetch application permissions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [currentOrg, currentApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !currentApp) return;
    
    setError(null);
    setIsSaving(true);
    
    try {
      const payload = {
        key: permissionKey,
        name: permissionName,
        description: permissionDescription
      };

      if (editingPermission) {
        await api.patch(`/organizations/${currentOrg.id}/applications/${currentApp.id}/permissions/${editingPermission.id}`, payload);
      } else {
        await api.post(`/organizations/${currentOrg.id}/applications/${currentApp.id}/permissions`, payload);
      }
      
      await fetchPermissions();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (permission: AppPermission) => {
    setEditingPermission(permission);
    setPermissionKey(permission.key);
    setPermissionName(permission.name);
    setPermissionDescription(permission.description || "");
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!currentOrg || !currentApp || !permissionToDelete) return;
    
    try {
      setIsDeletingPermission(true);
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}/permissions/${permissionToDelete}`);
      setPermissions(permissions.filter(p => p.id !== permissionToDelete));
      setPermissionToDelete(null);
    } catch (err) {
      console.error("Failed to delete permission", err);
    } finally {
      setIsDeletingPermission(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setPermissionKey("");
    setPermissionName("");
    setPermissionDescription("");
    setError(null);
  };

  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Loading application permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Lock className="text-primary-brand" size={24} />
            Application Permissions
          </h2>
          <p className="text-text-secondary text-sm">Manage the specific permission keys available for {currentApp?.name}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input 
              type="text" 
              placeholder="Search permissions..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-4 py-2 text-xs text-text-primary focus:border-text-primary transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2 px-4 rounded-md text-xs flex items-center justify-center gap-2 font-bold shrink-0"
          >
            <Plus size={14} />
            Add Permission
          </button>
        </div>
      </div>

      <div className="auth-card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                <th className="px-6 py-4">Name / Key</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Lock size={40} className="text-text-secondary mb-2" />
                      <p className="text-sm font-medium">No custom permissions found.</p>
                      <p className="text-xs">Add permissions that your app will check for.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary text-xs">{permission.name}</div>
                      <div className="text-[10px] text-primary-brand font-mono mt-0.5">{permission.key}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs max-w-xs truncate">
                      {permission.description || "No description"}
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-[10px] font-medium">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(permission)}
                          className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary hover:text-text-primary"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setPermissionToDelete(permission.id)}
                          className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center text-primary-brand">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                  {editingPermission ? 'Edit Permission' : 'Add Permission'}
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3 text-error">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Display Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Create Reports"
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                    value={permissionName}
                    onChange={(e) => setPermissionName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Permission Key</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. reports.create"
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm font-mono text-text-primary focus:border-text-primary transition-all outline-none"
                    value={permissionKey}
                    onChange={(e) => setPermissionKey(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="What does this allow?"
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none resize-none"
                    value={permissionDescription}
                    onChange={(e) => setPermissionDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || !permissionKey || !permissionName}
                  className="flex-1 px-4 py-3 rounded-md bg-primary-brand text-background text-sm font-bold hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!permissionToDelete}
        onClose={() => setPermissionToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeletingPermission}
        title="Delete Permission?"
        description="Are you sure you want to delete this permission? It will be removed from all roles it is currently assigned to."
        confirmText="Yes, Delete"
      />
    </div>
  );
}
