"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Loader2, 
  Mail,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Copy,
  History,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/dashboard/ConfirmModal';

// ... (keep interface definitions)

export default function MembersPage() {
  const { user } = useAuth();
  const { currentOrg } = useDashboard();
  const [members, setMembers] = useState<Member[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Expand State
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Custom delete confirmation
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const fetchData = async () => {
    if (!currentOrg) return;
    try {
      const [membersResponse, rolesResponse, invitesResponse] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/members`),
        api.get(`/organizations/${currentOrg.id}/roles`),
        api.get(`/organizations/${currentOrg.id}/invitations`)
      ]);

      setMembers(membersResponse.data);
      setAvailableRoles(rolesResponse);
      setInvitations(invitesResponse);
      
      if (rolesResponse.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesResponse.find((r: any) => r.name === 'Administrator')?.id || rolesResponse[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    init();
  }, [currentOrg]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setError(null);
    setIsInviting(true);
    setGeneratedLink(null);

    try {
      const response = await api.post(`/organizations/${currentOrg.id}/invitations`, {
        email: inviteEmail,
        roleId: selectedRoleId
      });

      const token = response.data.token;
      const frontendUrl = window.location.origin;
      const link = `${frontendUrl}/invitation/accept?token=${token}`;
      setGeneratedLink(link);
      
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!currentOrg) return;
    try {
      await api.delete(`/organizations/${currentOrg.id}/invitations/${inviteId}`);
      setInvitations(invitations.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error("Failed to revoke invite", err);
    }
  };

  const handleUpdateStatus = async (membershipId: string, newStatus: string) => {
    if (!currentOrg) return;
    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${membershipId}`, {
        status: newStatus
      });
      setMembers(members.map(m => m.id === membershipId ? { ...m, status: newStatus } : m));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleRemoveMember = async () => {
    if (!currentOrg || !memberToRemove) return;
    
    try {
      setIsRemovingMember(true);
      await api.delete(`/organizations/${currentOrg.id}/members/${memberToRemove}`);
      setMembers(members.filter(m => m.id !== memberToRemove));
      setMemberToRemove(null);
    } catch (err) {
      console.error("Failed to remove member", err);
    } finally {
      setIsRemovingMember(false);
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
            <Users className="text-primary-brand" />
            Team Members
          </h1>
          <p className="text-text-secondary text-sm">Manage access and roles for your organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="btn-secondary py-2 px-4 rounded-md text-xs flex items-center justify-center gap-2 font-bold"
          >
            <History size={14} />
            Previous Invites
          </button>
          <button 
            onClick={() => {
              setIsInviteModalOpen(true);
              setGeneratedLink(null);
              setInviteEmail("");
            }}
            className="btn-primary py-2 px-6 rounded-md text-xs flex items-center justify-center gap-2 font-bold"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="auth-card overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {members.map((member) => (
                <React.Fragment key={member.id}>
                  <tr className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-xs font-bold text-text-secondary border border-border">
                          {member.firstName ? member.firstName[0].toUpperCase() : member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary">
                            {member.firstName ? `${member.firstName} ${member.lastName || ''}` : 'Team Member'}
                          </div>
                          <div className="text-[10px] text-text-secondary font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.isOwner && (
                          <span className="px-2 py-0.5 rounded bg-primary-brand/10 text-primary-brand text-[10px] font-bold border border-primary-brand/20">
                            Owner
                          </span>
                        )}
                        {member.roles.map(role => (
                          <span key={role.id} className="px-2 py-0.5 rounded bg-surface border border-border text-text-secondary text-[10px] font-medium">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        member.status === 'ACTIVE' 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      )}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!member.isOwner && (
                          <>
                            <button 
                              onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                              className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary"
                            >
                              {expandedMember === member.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-secondary">
                              <MoreVertical size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedMember === member.id && (
                    <tr className="bg-surface-hover/10">
                      <td colSpan={4} className="px-8 py-6 border-b border-border">
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Membership Details</h4>
                               <span className="text-[10px] text-text-secondary italic">Joined on {new Date(member.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="p-4 bg-surface border border-border rounded-lg space-y-2">
                                  <p className="text-[10px] uppercase text-text-secondary font-bold">Permissions Overview</p>
                                  <p className="text-xs text-text-primary">Member has access based on their assigned roles. Revoke roles to limit access.</p>
                               </div>
                               <div className="p-4 bg-surface border border-border rounded-lg space-y-2 text-right">
                                  <p className="text-[10px] uppercase text-text-secondary font-bold">Quick Actions</p>
                                  <div className="flex justify-end gap-3 pt-2">
                                     <button 
                                       onClick={() => handleUpdateStatus(member.id, member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                       className={cn(
                                         "text-xs font-bold hover:underline",
                                         member.status === 'ACTIVE' ? "text-yellow-500" : "text-green-500"
                                       )}
                                     >
                                       {member.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                     </button>
                                     <span className="text-border">|</span>
                                     <button
                                       disabled={member.isOwner || isRemovingMember}
                                       onClick={() => setMemberToRemove(member.id)}
                                       className="text-xs font-bold text-error hover:underline disabled:opacity-50"
                                     >
                                       Remove Member
                                     </button>                                  </div>
                               </div>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center">
                  <UserPlus size={20} className="text-primary-brand" />
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">Invite Team Member</h3>
              </div>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {generatedLink ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                    <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Invitation Link Generated</h4>
                      <p className="text-xs text-text-secondary mt-1">Copy and send this link to your team member.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-text-secondary">Invitation URL</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly
                        value={generatedLink}
                        className="flex-1 bg-background border border-border rounded-md px-4 py-2.5 text-xs text-text-primary font-mono focus:border-text-primary outline-none"
                      />
                      <button 
                        onClick={() => copyToClipboard(generatedLink)}
                        className="p-2.5 bg-surface border border-border rounded-md hover:bg-surface-hover text-text-primary transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setGeneratedLink(null);
                    }}
                    className="w-full btn-primary py-3 rounded-md text-sm font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3 text-error">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <input 
                          type="email" 
                          required
                          placeholder="colleague@company.com"
                          className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary mb-2">Assign Initial Role</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <select 
                          className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all outline-none appearance-none"
                          value={selectedRoleId}
                          onChange={(e) => setSelectedRoleId(e.target.value)}
                        >
                          {availableRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isInviting || !inviteEmail}
                      className="flex-1 px-4 py-3 rounded-md bg-primary-brand text-background text-sm font-bold hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isInviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Create Link
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center">
                  <History size={20} className="text-primary-brand" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-text-primary tracking-tight">Previous Invites</h3>
                   <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">Pending Invitations</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-0 max-h-[60vh] overflow-y-auto">
               {invitations.length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                    <Mail className="mx-auto text-text-secondary/20 w-12 h-12" />
                    <p className="text-sm text-text-secondary font-medium">No pending invitations found.</p>
                 </div>
               ) : (
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface text-[10px] uppercase tracking-widest font-bold text-text-secondary border-b border-border">
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3">Expires</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                       {invitations.map((invite) => (
                         <tr key={invite.id} className="hover:bg-surface-hover/30 transition-colors">
                           <td className="px-6 py-4 text-text-primary font-bold">{invite.email}</td>
                           <td className="px-6 py-4 text-text-secondary">{new Date(invite.createdAt).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-text-secondary">{new Date(invite.expiresAt).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => {
                                      const frontendUrl = window.location.origin;
                                      copyToClipboard(`${frontendUrl}/invitation/accept?token=${invite.token}`);
                                   }}
                                   className="p-1.5 hover:bg-surface-hover rounded text-text-secondary hover:text-text-primary transition-all"
                                   title="Copy Link"
                                 >
                                    <Copy size={14} />
                                 </button>
                                 <button 
                                   onClick={() => handleRevokeInvite(invite.id)}
                                   className="p-1.5 hover:bg-surface-hover rounded text-text-secondary hover:text-error transition-all"
                                   title="Revoke Invite"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               )}
            </div>
            
            <div className="p-6 border-t border-border bg-surface/50 text-center">
                <p className="text-[10px] text-text-secondary">Invitations expire after 7 days for security reasons.</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        isLoading={isRemovingMember}
        title="Remove Member?"
        description="Are you sure you want to remove this member from the organization? They will immediately lose all access to organization resources."
        confirmText="Yes, Remove Member"
      />
    </>
  );
}
