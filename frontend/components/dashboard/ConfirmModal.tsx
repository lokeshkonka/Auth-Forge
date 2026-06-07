"use client";

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorClass = variant === 'danger' ? 'text-error' : variant === 'warning' ? 'text-yellow-500' : 'text-primary-brand';
  const btnClass = variant === 'danger' ? 'bg-error hover:bg-error/90' : variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-primary-brand hover:bg-primary-brand/90';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="auth-card p-6 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`flex items-center gap-3 ${colorClass}`}>
          <AlertCircle size={24} />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>

        <div className="flex gap-3">
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md bg-surface-hover text-text-primary text-sm font-bold border border-border disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-white text-sm font-bold transition-all flex items-center justify-center gap-2 ${btnClass} disabled:opacity-50`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
