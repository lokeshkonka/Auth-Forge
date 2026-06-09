"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Loader2, 
  Mail,
  ShieldCheck,
  MoreVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  AlertCircle,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

interface UserRole {
  id: string;
  name: string;
}

interface AppUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
}

export function AppUsers() {
  const { currentOrg, currentApp } = useDashboard();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // Custom delete confirmation
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);

  const fetchUsers = async () => {
    if (!currentOrg || !currentApp) return;
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/users`),
        api.get(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles`)
      ]);
      setUsers(usersData.data);
      setAvailableRoles(rolesData);
    } catch (err) {
      console.error("Failed to fetch application users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentOrg, currentApp]);

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!currentOrg || !currentApp) return;
    try {
      await api.post(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles/assignments/${userId}`, {
        roleId
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to assign role");
    }
  };

  const handleUnassignRole = async (userId: string, roleId: string) => {
    if (!currentOrg || !currentApp) return;
    try {
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}/roles/assignments/${userId}/${roleId}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to unassign role");
    }
  };

  const handleRemoveUser = async () => {
    if (!currentOrg || !currentApp || !userToDelete) return;
    
    try {
      setIsRemovingUser(true);
      await api.delete(`/organizations/${currentOrg.id}/applications/${currentApp.id}/users/${userToDelete}`);
      setUsers(users.filter(u => u.id !== userToDelete));
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to remove user", err);
      alert("Failed to remove user. Make sure you have the required permissions.");
    } finally {
      setIsRemovingUser(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary-brand w-10 h-10" />
        <p className="text-xs text-text-secondary font-mono animate-pulse">Loading application users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Users className="text-primary-brand" size={24} />
            Application Users
          </h2>
          <p className="text-text-secondary text-sm">Manage end-users registered to {currentApp?.name}.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input 
            type="text" 
            placeholder="Search by email..."
            className="w-full bg-surface border border-border rounded-md pl-10 pr-4 py-2 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="auth-card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Users size={40} className="text-text-secondary mb-2" />
                      <p className="text-sm font-medium">
                        {searchTerm ? 'No matching users found' : 'No users found for this application.'}
                      </p>
                      {!searchTerm && <p className="text-xs">Users who sign up for your app will appear here.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-surface-hover/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-primary-brand border border-border group-hover:border-primary-brand/30 transition-all">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="font-medium text-text-primary">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <span key={role.id} className="px-2 py-0.5 rounded bg-surface border border-border text-text-secondary text-[10px] font-bold uppercase tracking-tighter">
                                {role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-text-secondary opacity-50 italic">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-xs">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary"
                          >
                            {expandedUser === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === user.id && (
                      <tr className="bg-surface-hover/10">
                        <td colSpan={4} className="px-8 py-6 border-b border-border">
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">User Details & Control</h4>
                                 <span className="text-[10px] font-mono text-text-secondary">UID: {user.id}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="p-4 bg-surface border border-border rounded-lg space-y-4">
                                    <p className="text-[10px] uppercase text-text-secondary font-bold">Role Management</p>
                                    <div className="flex flex-wrap gap-2">
                                       {availableRoles.map(role => {
                                          const isAssigned = user.roles.some(r => r.id === role.id);
                                          return (
                                             <button
                                                key={role.id}
                                                onClick={() => isAssigned ? handleUnassignRole(user.id, role.id) : handleAssignRole(user.id, role.id)}
                                                className={cn(
                                                   "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 border",
                                                   isAssigned 
                                                      ? "bg-primary-brand text-background border-primary-brand" 
                                                      : "bg-background text-text-secondary border-border hover:border-text-secondary"
                                                )}
                                             >
                                                {isAssigned && <Check size={12} />}
                                                {role.name}
                                             </button>
                                          );
                                       })}
                                       {availableRoles.length === 0 && (
                                          <p className="text-[10px] text-text-secondary italic">No roles defined for this application.</p>
                                       )}
                                    </div>
                                    <p className="text-[9px] text-text-secondary opacity-60">Click a role to assign or unassign it directly.</p>
                                 </div>
                                 <div className="p-4 bg-surface border border-border rounded-lg space-y-2 text-right">
                                    <p className="text-[10px] uppercase text-text-secondary font-bold">Management Actions</p>
                                    <div className="flex justify-end gap-4 pt-2">
                                       <button 
                                         disabled={isRemovingUser}
                                         onClick={() => setUserToDelete(user.id)}
                                         className="text-xs font-bold text-error hover:underline flex items-center gap-2 disabled:opacity-50"
                                       >
                                         <Trash2 size={12} />
                                         Delete User account
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleRemoveUser}
        isLoading={isRemovingUser}
        title="Remove User?"
        description="Are you sure you want to remove this user from the application? This action cannot be undone and will immediately revoke their access."
        confirmText="Yes, Remove User"
      />
    </div>
  );
}
