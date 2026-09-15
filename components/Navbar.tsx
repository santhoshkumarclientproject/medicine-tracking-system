"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { usePreferences } from "@/components/PreferencesProvider";
import NotificationCenter from "@/components/NotificationCenter";
import {
  Pill,
  Sun,
  Moon,
  Type,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { darkMode, largeText, toggleDarkMode, toggleLargeText } = usePreferences();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const role = user?.role || "GUEST";

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-8 py-3 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-white/50 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={
              role === "PATIENT"
                ? "/patient/dashboard"
                : role === "DOCTOR"
                ? "/doctor/dashboard"
                : role === "FAMILY"
                ? "/family/dashboard"
                : "/"
            }
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <Pill className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-slate-100">
                  Med<span className="text-teal-600 dark:text-teal-400">Track</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                Clinical Adherence & Escalations
              </p>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          {session && (
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
              {role === "PATIENT" && (
                <>
                  <Link
                    href="/patient/dashboard"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname === "/patient/dashboard"
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Today&apos;s Intake
                  </Link>
                  <Link
                    href="/patient/medications"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname.startsWith("/patient/medications")
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    My Medications
                  </Link>
                  <Link
                    href="/patient/adherence"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname.startsWith("/patient/adherence")
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Adherence & Reports
                  </Link>
                  <Link
                    href="/patient/family"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname.startsWith("/patient/family")
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Care Circle
                  </Link>
                </>
              )}

              {role === "DOCTOR" && (
                <>
                  <Link
                    href="/doctor/dashboard"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname === "/doctor/dashboard"
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Patient Roster
                  </Link>
                  <Link
                    href="/doctor/alerts"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname.startsWith("/doctor/alerts")
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Clinical Escalations
                  </Link>
                </>
              )}

              {role === "FAMILY" && (
                <>
                  <Link
                    href="/family/dashboard"
                    className={`px-3.5 py-1.5 rounded-xl transition ${
                      pathname === "/family/dashboard"
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                    }`}
                  >
                    Care Dashboard
                  </Link>
                </>
              )}

              <Link
                href="/messages"
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  pathname.startsWith("/messages")
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                }`}
              >
                Clinical Chat
              </Link>
              <Link
                href="/call"
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  pathname.startsWith("/call")
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                }`}
              >
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Telehealth Call
              </Link>
            </nav>
          )}
        </div>

        {/* Right Accessibility & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Accessibility Toggle: Large Text Mode */}
          <button
            onClick={toggleLargeText}
            className={`bento-btn p-2.5 rounded-2xl transition ${
              largeText
                ? "bg-teal-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-300"
            }`}
            aria-label="Toggle large-text accessible mode"
            title="Toggle Large-Text Mode (Elderly Usability)"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Accessibility Toggle: Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="bento-btn p-2.5 rounded-2xl text-slate-600 dark:text-slate-300"
            aria-label="Toggle theme"
            title="Toggle Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>

          {/* Notification Center */}
          {session && <NotificationCenter />}

          {/* User Profile / Auth State */}
          {session ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  {role}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="bento-btn p-2.5 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="bento-btn bento-btn-primary text-sm py-2 px-4">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
