"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle,
  MoreVertical,
  Search,
  Check,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  name: string;
  key: string;
  action: string;
  resource: string;
  description: string | null;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystemRole: boolean;
  permissions: RolePermission[];
}


export default function RolesPage() {
  const { currentOrg } = useDashboard();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Form State
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const fetchRoles = async () => {
    if (!currentOrg) return;
    try {
      const rolesData = await api.get(`/organizations/${currentOrg.id}/roles`);
      setRoles(rolesData);
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const permsResponse = await api.get('/permissions');
      // The backend returns { success: true, data: { categories: ... } }
      const categories = permsResponse.data?.categories || permsResponse.categories || {};
      setAllPermissions(categories);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions()]);
      setIsLoading(false);
    };
    init();
  }, [currentOrg]);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRoleId(role.id);
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setSelectedPermissionIds(role.permissions.map(rp => rp.permission.id));
    } else {
      setEditingRoleId(null);
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissionIds([]);
    }
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingRoleId) {
        await api.patch(`/organizations/${currentOrg.id}/roles/${editingRoleId}`, {
          name: roleName,
          description: roleDescription,
          permissionIds: selectedPermissionIds
        });
      } else {
        await api.post(`/organizations/${currentOrg.id}/roles`, {
          name: roleName,
          description: roleDescription,
          permissionIds: selectedPermissionIds
        });
      }

      await fetchRoles();
      setIsModalOpen(false);
      setEditingRoleId(null);
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissionIds([]);
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!currentOrg || !deletingRoleId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/roles/${deletingRoleId}`);
      setRoles(roles.filter(r => r.id !== deletingRoleId));
      setDeletingRoleId(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePermission = (id: string) => {
    if (selectedPermissionIds.includes(id)) {
      setSelectedPermissionIds(selectedPermissionIds.filter(pid => pid !== id));
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, id]);
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
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-primary flex items-center gap-3">
            <ShieldCheck className="text-primary-brand" />
            Roles & Permissions
          </h1>
          <p className="text-text-secondary text-sm">Define and manage access control policies for your organization.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary py-2 px-6 rounded-md text-xs flex items-center justify-center gap-2 self-start sm:self-auto font-bold"
        >
          <Plus size={14} />
          Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="auth-card p-12 text-center max-w-2xl mx-auto border-dashed border-2 border-border mt-12">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
            <ShieldAlert size={32} className="text-text-secondary" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-text-primary">No Roles Created Yet</h2>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Roles allow you to group permissions together and assign them to your team members. 
            Get started by creating your first custom role.
          </p>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary py-3 px-8 rounded-md text-sm font-bold"
          >
            Create Your First Role
          </button>
        </div>
      ) : (
        <div className="auth-card overflow-visible">
          <div className="overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                  <th className="px-6 py-4">Role Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Permissions</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((role) => {
                  const isOwner = role.name.toLowerCase() === 'owner' || role.isSystemRole;
                  
                  return (
                    <React.Fragment key={role.id}>
                      <tr className="hover:bg-surface-hover/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{role.name}</span>
                            <span className="text-[10px] text-text-secondary truncate max-w-[200px]">
                              {role.description || "No description provided"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            isOwner
                              ? "bg-primary-brand/10 text-primary-brand border-primary-brand/20" 
                              : "bg-surface-hover text-text-secondary border-border"
                          )}>
                            {isOwner ? "System" : "Custom"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isOwner ? (
                            <div className="flex items-center gap-2 text-primary-brand text-xs font-bold uppercase tracking-wider">
                              <ShieldCheck size={14} />
                              Full Access
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-text-secondary text-xs">
                              <ShieldCheck size={14} className="text-primary-brand/60" />
                              {role.permissions.length} Permissions
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isOwner && (
                              <>
                                <button 
                                  onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                                  className="p-2 hover:bg-surface-hover rounded-md transition-all text-text-secondary hover:text-text-primary"
                                  title="View Permissions"
                                >
                                  {expandedRole === role.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveMenu(activeMenu === role.id ? null : role.id)}
                                    className={cn(
                                      "p-2 rounded-md transition-all",
                                      activeMenu === role.id 
                                        ? "bg-primary-brand/10 text-primary-brand" 
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                                    )}
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {activeMenu === role.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                      <div className="absolute right-0 mt-2 w-44 bg-[#1A1A1A] border border-border rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                                        <button 
                                          onClick={() => handleOpenModal(role)}
                                          className="w-full text-left px-4 py-2.5 text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2.5 transition-colors"
                                        >
                                          <Edit2 size={14} className="text-text-secondary" />
                                          Update Role Details
                                        </button>
                                        <div className="border-t border-border my-1 mx-2" />
                                        <button 
                                          onClick={() => {
                                            setDeletingRoleId(role.id);
                                            setActiveMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors"
                                        >
                                          <Trash2 size={14} />
                                          Delete Custom Role
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRole === role.id && (
                        <tr className="bg-surface-hover/10">
                          <td colSpan={4} className="px-8 py-6 border-b border-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {role.permissions.map((rp, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 bg-surface border border-border rounded-md">
                                  <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                                    <Check size={12} className="text-primary-brand" />
                                    {rp.permission.name}
                                  </span>
                                  <span className="text-[10px] text-text-secondary leading-relaxed italic">
                                    {rp.permission.description || `Grants access to ${rp.permission.key.replace('.', ' ')} operations.`}
                                  </span>
                                </div>
                              ))}
                              {role.permissions.length === 0 && (
                                <div className="col-span-full text-center py-4 text-xs text-text-secondary italic">
                                  No specific permissions assigned to this role.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Update Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center">
                  {editingRoleId ? <Edit2 size={20} className="text-primary-brand" /> : <Plus size={20} className="text-primary-brand" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">
                    {editingRoleId ? "Update Custom Role" : "Create Custom Role"}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Configure access level and permissions.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateOrUpdateRole} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3 text-error">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Role Details */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Role Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Product Manager"
                      className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Description</label>
                    <textarea 
                      rows={4}
                      placeholder="What can members with this role do?"
                      className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:border-text-primary transition-all outline-none resize-none"
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="p-4 bg-surface rounded-lg border border-border">
                    <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary-brand" />
                      Role Assignment
                    </h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Custom roles can be assigned to any team member. They do not replace system roles but can complement them for more granular access.
                    </p>
                  </div>
                </div>

                {/* Permissions Checklist */}
                <div className="space-y-6">
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">
                    Assign Permissions ({selectedPermissionIds.length} selected)
                  </label>
                  
                  <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                    {Object.entries(allPermissions)
                      .filter(([category]) => category !== 'System')
                      .map(([category, perms]) => (
                      <div key={category} className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-text-secondary border-b border-border pb-1 tracking-tighter opacity-50">
                          {category} Management
                        </h5>
                        <div className="space-y-2">
                          {perms.map((perm) => (
                            <div 
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all duration-200 group",
                                selectedPermissionIds.includes(perm.id) 
                                  ? "bg-primary-brand/5 border-primary-brand/30" 
                                  : "bg-background border-border hover:border-text-secondary"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-all",
                                selectedPermissionIds.includes(perm.id) 
                                  ? "bg-primary-brand border-primary-brand" 
                                  : "bg-surface border-border group-hover:border-text-secondary"
                              )}>
                                {selectedPermissionIds.includes(perm.id) && <Check size={10} className="text-background font-bold" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className={cn(
                                  "text-xs font-bold transition-colors",
                                  selectedPermissionIds.includes(perm.id) ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                                )}>
                                  {perm.name}
                                </p>
                                <p className="text-[10px] text-text-secondary leading-relaxed">
                                  {perm.description || `Permission to perform ${perm.key} actions.`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border bg-surface/50 flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">
                You can edit these permissions later.
              </span>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-md bg-transparent border border-border text-sm font-bold text-text-primary hover:bg-surface-hover transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateOrUpdateRole}
                  disabled={isSubmitting || !roleName}
                  className="px-8 py-2.5 rounded-md bg-primary-brand text-background text-sm font-bold hover:bg-primary-brand/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {editingRoleId ? "Update Role" : "Save Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRoleId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="auth-card p-6 max-w-sm w-full space-y-6 shadow-2xl border-error/20">
            <div className="flex items-center gap-3 text-error">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Delete Role?</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to delete this custom role? This action cannot be undone and may affect members currently assigned to this role.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingRoleId(null)}
                className="flex-1 px-4 py-2 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteRole}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-md bg-error text-white text-sm font-bold hover:bg-error/90 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
