"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  X,
  Edit2,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

interface AppRole {
  id: string;
  name: string;
  description?: string;
  permissions?: {
    permission: {
      id: string;
      key: string;
      name: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export function AppRoles() {
  const { currentOrg, currentApp } = useDashboard();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  
  // Custom delete confirmation
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const fetchRoles = async () => {
    if (!currentOrg || !currentApp) return;
    try {
      setIsLoading(true);
      const data = await api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles`);
      setRoles(data);
    } catch (err) {
      console.error("Failed to fetch application roles", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [currentOrg, currentApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !currentApp) return;
    
    setError(null);
    setIsSaving(true);
    
    try {
      if (editingRole) {
        await api.patch(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles/${editingRole.id}`, {
          name: roleName,
          description: roleDescription
        });
      } else {
        await api.post(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles`, {
          name: roleName,
          description: roleDescription
        });
      }
      
      await fetchRoles();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (role: AppRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setIsInviteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!currentOrg || !currentApp || !roleToDelete) return;
    
    try {
      setIsDeletingRole(true);
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles/${roleToDelete}`);
      setRoles(roles.filter(r => r.id !== roleToDelete));
      setRoleToDelete(null);
    } catch (err) {
      console.error("Failed to delete role", err);
      alert("Failed to delete role.");
    } finally {
      setIsDeletingRole(false);
    }
  };

  const handleCloseModal = () => {
    setIsInviteModalOpen(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setError(null);
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Loading application roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <ShieldCheck className="text-primary-brand" size={24} />
            Application Roles
          </h2>
          <p className="text-text-secondary text-sm">Define and manage custom roles for {currentApp?.name}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
            <input 
              type="text" 
              placeholder="Search roles..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-4 py-2 text-xs text-text-primary focus:border-text-primary transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-primary py-2 px-4 rounded-md text-xs flex items-center justify-center gap-2 font-bold shrink-0"
          >
            <Plus size={14} />
            Create Role
          </button>
        </div>
      </div>

      <div className="auth-card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <ShieldCheck size={40} className="text-text-secondary mb-2" />
                      <p className="text-sm font-medium">
                        {searchTerm ? 'No matching roles found' : 'No custom roles found.'}
                      </p>
                      {!searchTerm && <p className="text-xs">Create roles to categorize your application users.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary uppercase tracking-tighter text-xs">{role.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-text-secondary font-mono truncate max-w-[200px]">{role.description || "No description provided"}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-[10px] font-medium">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(role)}
                          className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary hover:text-text-primary"
                          title="Edit Role"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setRoleToDelete(role.id)}
                          className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary hover:text-error"
                          title="Delete Role"
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

      {/* Create/Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center text-primary-brand">
                  {editingRole ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                  {editingRole ? 'Edit Role' : 'Create Application Role'}
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
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Role Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. PREMIUM_USER, BETA_TESTER"
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Description (Optional)</label>
                  <textarea 
                    rows={3}
                    placeholder="What does this role represent?"
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none resize-none"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
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
                  disabled={isSaving || !roleName}
                  className="flex-1 px-4 py-3 rounded-md bg-primary-brand text-background text-sm font-bold hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeletingRole}
        title="Delete Application Role?"
        description="Are you sure you want to delete this role? This action is permanent and may affect users currently assigned to this role."
        confirmText="Yes, Delete Role"
      />
    </div>
  );
}
