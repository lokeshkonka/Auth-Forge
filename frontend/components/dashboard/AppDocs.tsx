"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Send, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Database,
  Globe,
  Users,
  Settings
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';

export function AppDocs() {
  const { currentOrg, currentApp } = useDashboard();
  const [activeTab, setActiveSubTab] = useState<'client' | 'server' | 'playground'>('client');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Playground State
  const [method, setMethod] = useState<'POST' | 'GET'>('POST');
  const [endpoint, setEndpoint] = useState('/auth/signup');
  const [requestBody, setRequestBody] = useState('{\n  "email": "user@example.com",\n  "password": "password123"\n}');
  const [apiKey, setApiKey] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const executePlayground = async () => {
    if (!currentApp) return;
    setIsExecuting(true);
    setResponse(null);
    
    try {
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${currentApp.slug}${endpoint}`;
      
      const headers: any = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      };

      if (authHeader) {
        headers['Authorization'] = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;
      }

      const res = await fetch(fullUrl, {
        method,
        headers,
        body: method === 'POST' ? requestBody : undefined
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!currentApp) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-jetbrains">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Code2 className="text-primary-brand" size={24} />
            Developer Documentation
          </h2>
          <p className="text-text-secondary text-sm">Integration guides and API playground for {currentApp.name}.</p>
        </div>
      </div>

      <div className="flex border-b border-border gap-8 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setActiveSubTab('client')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'client' ? "text-primary-brand" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Client-Side Auth
          {activeTab === 'client' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('server')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'server' ? "text-primary-brand" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Server-Side Management
          {activeTab === 'server' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('playground')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2",
            activeTab === 'playground' ? "text-primary-brand" : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Play size={10} />
          API Playground
          {activeTab === 'playground' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />}
        </button>
      </div>

      {activeTab === 'client' && (
        <div className="space-y-12 max-w-4xl">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <Globe size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">User Signup</h3>
            </div>
            <p className="text-xs text-text-secondary">Register new users directly from your frontend using a **Publishable Key**.</p>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">POST /{currentApp.slug}/auth/signup</span>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/${currentApp.slug}/auth/signup \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\\n  -d '{"email": "user@example.com", "password": "password123"}'`, 'c1')}
                  className="p-1 hover:bg-background rounded transition-all text-text-secondary"
                >
                  {copiedField === 'c1' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X POST ${baseUrl}/${currentApp.slug}/auth/signup \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">User Login</h3>
            </div>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">POST /{currentApp.slug}/auth/login</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X POST ${baseUrl}/${currentApp.slug}/auth/login \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">User Profile</h3>
            </div>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">GET /{currentApp.slug}/auth/profile</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X GET ${baseUrl}/${currentApp.slug}/auth/profile \\
  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\
  -H "Authorization: Bearer YOUR_ENDUSER_JWT"`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary-brand">
              <Users size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Assign Role to User</h3>
            </div>
            <p className="text-xs text-text-secondary">Assign a predefined role to an end-user using your **Publishable Key**.</p>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">POST /{currentApp.slug}/assign-roles</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X POST ${baseUrl}/${currentApp.slug}/assign-roles \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\
  -d '{
    "userId": "user_id_here",
    "roleId": "role_id_here"
  }'`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary-brand">
              <Settings size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Update Role</h3>
            </div>
            <p className="text-xs text-text-secondary">Update role metadata using your **Publishable Key**.</p>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">PATCH /{currentApp.slug}/update-role</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X PATCH ${baseUrl}/${currentApp.slug}/update-role \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_PUBLISHABLE_KEY" \\
  -d '{
    "roleId": "role_id_here",
    "name": "Updated Name",
    "description": "Updated Description"
  }'`}
              </pre>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'server' && (
        <div className="space-y-12 max-w-4xl">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <Database size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Fetch All Application Roles</h3>
            </div>
            <p className="text-xs text-text-secondary">Retrieve all available roles for your application using a **Secret Key**.</p>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">GET /{currentApp.slug}/all-roles</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X GET ${baseUrl}/${currentApp.slug}/all-roles \\
  -H "x-api-key: YOUR_SECRET_KEY"`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <Database size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Fetch Application Users</h3>
            </div>
            <p className="text-xs text-text-secondary">Retrieve user data securely on your server using a **Secret Key**.</p>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">GET /{currentApp.slug}/users</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X GET ${baseUrl}/${currentApp.slug}/users \\
  -H "x-api-key: YOUR_SECRET_KEY"`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <ShieldAlert size={16} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Delete Application User</h3>
            </div>
            <div className="auth-card p-0 overflow-hidden border-border">
              <div className="bg-surface p-2 border-b border-border flex justify-between items-center px-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase">DELETE /{currentApp.slug}/users/:id</span>
              </div>
              <pre className="p-4 text-[11px] text-text-primary font-mono overflow-x-auto bg-background/50">
{`curl -X DELETE ${baseUrl}/${currentApp.slug}/users/USER_ID \\
  -H "x-api-key: YOUR_SECRET_KEY"`}
              </pre>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Request Panel */}
          <div className="auth-card p-6 border-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Request Builder</h3>
              <div className="flex items-center gap-2 bg-surface p-1 rounded-md border border-border">
                <button 
                  onClick={() => { setMethod('POST'); setEndpoint('/auth/signup'); }}
                  className={cn("px-3 py-1 rounded text-[9px] font-bold transition-all", method === 'POST' ? "bg-primary-brand text-background" : "text-text-secondary")}
                >
                  POST
                </button>
                <button 
                  onClick={() => { setMethod('GET'); setEndpoint('/users'); }}
                  className={cn("px-3 py-1 rounded text-[9px] font-bold transition-all", method === 'GET' ? "bg-primary-brand text-background" : "text-text-secondary")}
                >
                  GET
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-2">Endpoint</label>
                <div className="flex items-center bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-text-secondary">
                  <span>/{currentApp.slug}</span>
                  <input 
                    className="bg-transparent border-none outline-none text-text-primary flex-1 ml-1"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-primary-brand/5 border border-primary-brand/10 rounded-md">
                <p className="text-[9px] text-primary-brand font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                  <AlertCircle size={10} />
                  Secret Key Required
                </p>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Management APIs (e.g. /users, /all-roles) require your <strong>Secret Key</strong>.
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-2">x-api-key Header</label>
                <input 
                  type="password"
                  placeholder="pk_live_... or sk_live_..."
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-xs text-text-primary font-mono focus:border-text-primary transition-all outline-none"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-2">Authorization Header (Optional)</label>
                <input 
                  type="text"
                  placeholder="Bearer your_jwt_token"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-xs text-text-primary font-mono focus:border-text-primary transition-all outline-none"
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                />
              </div>

              {method === 'POST' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary block mb-2">Request Body (JSON)</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-background border border-border rounded-md px-4 py-3 text-xs text-text-primary font-mono focus:border-text-primary transition-all outline-none resize-none"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button 
              onClick={executePlayground}
              disabled={isExecuting || !apiKey}
              className="w-full bg-primary-brand text-background py-4 rounded-md text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary-brand/90 transition-all disabled:opacity-50"
            >
              {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Request
            </button>
          </div>

          {/* Response Panel */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary px-2">Server Response</h3>
            <div className="auth-card p-0 border-border flex-1 min-h-[400px] overflow-hidden flex flex-col">
              <div className="bg-surface p-3 border-b border-border flex items-center justify-between px-4">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-[10px] font-mono font-bold text-text-secondary">READY</span>
                </div>
                {response && (
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(response, null, 2), 'res')}
                    className="text-text-secondary hover:text-text-primary transition-all"
                  >
                    {copiedField === 'res' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              <div className="flex-1 bg-[#0a0a0a] p-6 font-mono text-xs overflow-auto">
                {response ? (
                  <pre className="text-text-primary leading-relaxed">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                    <Terminal size={48} />
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Awaiting execution...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
