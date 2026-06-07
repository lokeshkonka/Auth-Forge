"use client";

import Link from "next/link";
import { ArrowRight, Fingerprint } from "lucide-react";

const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "NestJS",
  "PostgreSQL",
  "Redis",
  "Docker",
  "Kubernetes",
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-white font-jetbrains">

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative z-10 flex max-w-5xl flex-col items-center text-center">

        {/* Badge */}
        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
          <Fingerprint size={14} />
          <span className="text-[11px] font-bold uppercase tracking-[0.35em]">
            AuthForge
          </span>
        </div>

        {/* Hero */}
        <h1 className="text-5xl font-bold leading-none tracking-[-0.06em] md:text-7xl">
          Identity infrastructure
          <br />
          <span className="text-white/40">
            for modern applications.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/45 md:text-xl">
          Authentication, sessions, organizations,
          permissions, audit logs, and API keys.
        </p>

        {/* CTA */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link href="/auth">
            <button className="group flex items-center gap-2 rounded-md bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:opacity-90">
              Get Started
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </Link>

          <Link href="/docs">
            <button className="rounded-md border border-white/10 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:border-white/30 hover:bg-white/[0.03]">
              Documentation
            </button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
          <span>JWT</span>
          <span>•</span>
          <span>RBAC</span>
          <span>•</span>
          <span>Multi-Tenant</span>
          <span>•</span>
          <span>API Keys</span>
          <span>•</span>
          <span>Audit Logs</span>
        </div>

        {/* Trust */}
        <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-white/20">
          Built for developers who care about security
        </p>
      </main>

      {/* Tech Stack */}
      <footer className="absolute bottom-10 left-0 right-0 z-10">
        <div className="flex flex-wrap items-center justify-center gap-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/20">
          {TECH_STACK.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}