"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pill, ShieldCheck, User, Stethoscope, Heart, Lock, Mail, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push(callbackUrl === "/" ? "/" : callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("MedTrack123!");
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: demoEmail,
        password: "MedTrack123!",
        callbackUrl,
      });

      if (res?.error) {
        setError("Could not sign in with demo account.");
      } else {
        router.push(callbackUrl === "/" ? "/" : callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Error signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-3xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-white shadow-lg mb-4">
          <Pill className="w-8 h-8 -rotate-45" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome to <span className="text-teal-600 dark:text-teal-400">MedTrack</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Medicine Tracking CRM for Patients, Doctors, and Caregivers
        </p>
      </div>

      {/* 1-Click Quick Demo Bento Box */}
      <div className="clay-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              1-Click Demo Access
            </span>
          </div>
          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
            Password: MedTrack123!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Patient Demo */}
          <button
            type="button"
            onClick={() => handleQuickLogin("patient@medtrack.com")}
            disabled={loading}
            className="bento-btn p-3.5 flex flex-col items-start text-left bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/20 dark:to-slate-800 border-teal-200 dark:border-teal-900/50 hover:border-teal-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Sarah Connor
            </span>
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
              Patient Role
            </span>
          </button>

          {/* Doctor Demo */}
          <button
            type="button"
            onClick={() => handleQuickLogin("doctor@medtrack.com")}
            disabled={loading}
            className="bento-btn p-3.5 flex flex-col items-start text-left bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/20 dark:to-slate-800 border-sky-200 dark:border-sky-900/50 hover:border-sky-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Dr. House, MD
            </span>
            <span className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
              Doctor Role
            </span>
          </button>

          {/* Family Demo */}
          <button
            type="button"
            onClick={() => handleQuickLogin("family@medtrack.com")}
            disabled={loading}
            className="bento-btn p-3.5 flex flex-col items-start text-left bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-800 border-rose-200 dark:border-rose-900/50 hover:border-rose-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              John Connor
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
              Caregiver Role
            </span>
          </button>
        </div>
      </div>

      {/* Credentials Form */}
      <div className="clay-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@medtrack.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bento-btn bento-btn-primary py-3.5 text-base mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Signing In..."
            ) : (
              <>
                Sign In to MedTrack <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          <p>Protected by HIPAA-compliant access controls & audit trails.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-8 sm:py-12 flex flex-col items-center justify-center min-h-[80vh]">
      <Suspense fallback={<div className="text-slate-400">Loading MedTrack portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
