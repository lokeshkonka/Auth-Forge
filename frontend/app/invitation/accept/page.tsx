"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const acceptInvite = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage("Invalid invitation link. Token missing.");
        return;
      }

      if (isAuthLoading) return;

      if (!user) {
        // Redirect to login but keep the token so we can come back
        router.push(`/auth?mode=signup&returnTo=/invitation/accept?token=${token}`);
        return;
      }

      try {
        await api.post('/invitations/accept', { token });
        setStatus('success');
        setMessage("You have successfully joined the organization.");
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || "Failed to accept invitation. It may have expired or already been used.");
      }
    };

    acceptInvite();
  }, [searchParams, user, isAuthLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="auth-card p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary-brand/10 flex items-center justify-center border border-primary-brand/20">
            <ShieldCheck size={32} className="text-primary-brand" />
          </div>
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-brand" />
            <h2 className="text-xl font-bold text-text-primary">Processing Invitation</h2>
            <p className="text-sm text-text-secondary">Please wait while we verify your access...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-text-primary">Welcome Aboard!</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
            <p className="text-[10px] text-text-secondary opacity-60 pt-4">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="w-12 h-12 mx-auto text-error" />
            <h2 className="text-xl font-bold text-text-primary">Invitation Error</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full py-2.5 rounded-md text-sm mt-6"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-brand" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
