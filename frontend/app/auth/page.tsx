"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "org-setup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !isAuthLoading) {
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, isAuthLoading, router, searchParams]);

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
    
    // Check for tokens in URL (Google Auth Callback)
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const isNew = searchParams.get("new");

    if (token && refreshToken) {
      if (isNew === "true") {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        setMode("org-setup");
      } else {
        login(token, refreshToken);
      }
    }
  }, [searchParams, login]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.accessToken, response.data.refreshToken);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupInitial = (e: React.FormEvent) => {
    e.preventDefault();
    setMode("org-setup");
  };

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      if (token) {
        // User is already logged in (Google user), just create the org
        await api.post('/organizations', {
          name: orgName,
          slug: slug
        });
        // After creating org, check auth to update context and redirect
        login(token, localStorage.getItem("refreshToken") || "");
      } else {
        // New user (Email/Password), call signup
        await api.post('/auth/signup', {
          email,
          password,
          organizationName: orgName,
          organizationSlug: slug
        });
        
        // After signup, we need to login to get the tokens
        const loginResponse = await api.post('/auth/login', { email, password });
        login(loginResponse.data.accessToken, loginResponse.data.refreshToken);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="auth-card w-full max-w-[400px] p-8 relative z-10 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-brand animate-spin mb-4" />
          <p className="text-text-primary text-xs font-medium tracking-wide">Processing...</p>
        </div>
      )}

      {mode === "login" && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Sign in to AuthForge</h1>
            <p className="text-text-secondary text-sm">Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-[11px] text-text-secondary hover:text-text-primary transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="text-error text-[11px] font-medium mt-1">{error}</div>}

            <button type="submit" className="btn-primary w-full py-3 rounded-md text-sm mt-2 active:scale-[0.98]">
              Sign in
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="px-3 bg-surface text-text-secondary">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-secondary w-full py-3 rounded-md text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don't have an account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-text-primary hover:underline font-bold ml-1"
            >
              Sign up
            </button>
          </p>
        </>
      )}

      {mode === "signup" && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Create an account</h1>
            <p className="text-text-secondary text-sm">Start building your auth infrastructure today.</p>
          </div>

          <form onSubmit={handleSignupInitial} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 rounded-md text-sm mt-2 active:scale-[0.98]">
              Continue
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="px-3 bg-surface text-text-secondary">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-secondary w-full py-3 rounded-md text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <button
              onClick={() => setMode("login")}
              className="text-text-primary hover:underline font-bold ml-1"
            >
              Sign in
            </button>
          </p>
        </>
      )}

      {mode === "org-setup" && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Create Organization</h1>
            <p className="text-text-secondary text-sm">Set up your workspace to start managing auth.</p>
          </div>

          <form onSubmit={handleOrgSetup} className="space-y-6">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2" htmlFor="orgName">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                required
                placeholder="Acme Corp"
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-text-primary transition-all duration-200"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <p className="text-[10px] text-text-secondary mt-2 leading-relaxed">
                This will be used for your organization slug and dashboard branding.
              </p>
            </div>

            {error && <div className="text-error text-xs mt-1">{error}</div>}

            <button type="submit" className="btn-primary w-full py-3 rounded-md text-sm mt-2 active:scale-[0.98]">
              Complete Setup
            </button>
            
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="w-full py-2 text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              Go back
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground font-jetbrains">
      {/* Brand Logo */}
      <div className="mb-10 z-10 relative">
        <Image 
          src="/logo.svg" 
          alt="AuthForge Logo" 
          width={64} 
          height={64} 
          className="rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          priority
        />
      </div>

      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <AuthContent />
      </Suspense>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary-brand/5 blur-[140px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary-brand/5 blur-[140px] rounded-full"></div>
      </div>
    </main>
  );
}
