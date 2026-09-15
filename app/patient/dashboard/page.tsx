"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Flame,
  Activity,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  FileSpreadsheet,
  XCircle,
  ShieldAlert,
} from "lucide-react";

interface IntakeLogItem {
  id: string;
  medicationId: string;
  scheduledAt: string;
  takenAt: string | null;
  status: "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
  source: string;
  notes?: string | null;
  medication: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    notes?: string | null;
  };
}

interface StatsData {
  adherenceRate: number;
  currentStreak: number;
  totalScheduled: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
}

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<IntakeLogItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    adherenceRate: 100,
    currentStreak: 5,
    totalScheduled: 0,
    takenCount: 0,
    missedCount: 0,
    skippedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/intake-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.todayLogs || []);
        if (data.stats) setStats(data.stats);
        localStorage.setItem("medtrack_cached_logs", JSON.stringify(data.todayLogs));
      }
    } catch {
      // Load from offline cache if network fails
      const cached = localStorage.getItem("medtrack_cached_logs");
      if (cached) {
        setLogs(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
      fetchDashboardData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem("medtrack_offline_queue") || "[]");
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await fetch("/api/intake-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, source: "OFFLINE_SYNC" }),
        });
      } catch (err) {
        console.error("Failed to sync offline item:", err);
      }
    }
    localStorage.removeItem("medtrack_offline_queue");
  };

  const handleAction = async (
    log: IntakeLogItem,
    status: "TAKEN" | "MISSED" | "SKIPPED"
  ) => {
    setActionLoadingId(log.id);

    // Optimistic UI update
    const previousLogs = [...logs];
    const updated = logs.map((l) =>
      l.id === log.id
        ? { ...l, status, takenAt: status === "TAKEN" ? new Date().toISOString() : null }
        : l
    );
    setLogs(updated);

    if (!navigator.onLine) {
      // Store in offline sync queue
      const queue = JSON.parse(localStorage.getItem("medtrack_offline_queue") || "[]");
      queue.push({
        logId: log.id,
        medicationId: log.medicationId,
        scheduledAt: log.scheduledAt,
        status,
      });
      localStorage.setItem("medtrack_offline_queue", JSON.stringify(queue));
      setActionLoadingId(null);
      return;
    }

    try {
      const res = await fetch("/api/intake-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: log.id,
          medicationId: log.medicationId,
          scheduledAt: log.scheduledAt,
          status,
        }),
      });

      if (!res.ok) {
        setLogs(previousLogs);
      } else {
        // Refresh adherence stats
        const refreshRes = await fetch("/api/intake-logs");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.stats) setStats(data.stats);
        }
      }
    } catch {
      setLogs(previousLogs);
    } finally {
      setActionLoadingId(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userName = (session?.user as any)?.name || "Patient";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="clay-card p-3.5 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 flex items-center justify-between text-amber-800 dark:text-amber-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span>You are currently offline. Actions are queued locally and will sync once reconnected.</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/80 text-[11px]">
            Offline PWA Mode
          </span>
        </div>
      )}

      {/* Top Bento Header Card */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Good day, {userName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Here is your medication regimen and intake schedule for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/patient/medications"
              className="bento-btn bento-btn-primary shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Medication
            </Link>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="bento-btn text-slate-700 dark:text-slate-200 flex items-center gap-2"
              title="Refresh intake schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          {/* Adherence Rate */}
          <div className="clay-inset p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              7-Day Adherence
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                {stats.adherenceRate}%
              </span>
              <span className="text-xs text-slate-400">compliance</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="clay-inset p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Current Streak
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">
                {stats.currentStreak}
              </span>
              <span className="text-xs text-slate-400">Days</span>
            </div>
          </div>

          {/* Doses Taken */}
          <div className="clay-inset p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Doses Taken
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.takenCount}
              </span>
              <span className="text-xs text-slate-400">of {stats.totalScheduled}</span>
            </div>
          </div>

          {/* Escalation Status */}
          <div className="clay-inset p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Escalation Engine
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Active & Guarded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule - Bento Grid of Intake Slots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Today&apos;s Medication Schedule
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {logs.filter((l) => l.status === "TAKEN").length} of {logs.length} completed
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-teal-500" />
            Loading your schedule...
          </div>
        ) : logs.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-teal-500 mb-3" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No medications scheduled for today!
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add medications to your regimen to automatically generate daily intake slots.
            </p>
            <Link href="/patient/medications" className="bento-btn bento-btn-primary">
              <Plus className="w-4 h-4" /> Add Your First Medication
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs.map((log) => {
              const scheduledDate = new Date(log.scheduledAt);
              const timeString = scheduledDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isTaken = log.status === "TAKEN";
              const isMissed = log.status === "MISSED";
              const isSkipped = log.status === "SKIPPED";
              const isPending = log.status === "PENDING";
              const isBusy = actionLoadingId === log.id;

              return (
                <div
                  key={log.id}
                  className={`clay-card p-6 flex flex-col justify-between transition relative overflow-hidden ${
                    isTaken
                      ? "border-l-4 border-l-emerald-500"
                      : isMissed
                      ? "border-l-4 border-l-rose-500"
                      : isSkipped
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-teal-500"
                  }`}
                >
                  <div>
                    {/* Top Slot Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-teal-500" />
                        {timeString}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isTaken
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : isMissed
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                            : isSkipped
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            : "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 animate-pulse"
                        }`}
                      >
                        {isTaken ? "TAKEN" : isMissed ? "MISSED" : isSkipped ? "SKIPPED" : "DUE"}
                      </span>
                    </div>

                    {/* Drug Title & Dosage */}
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {log.medication.name}
                    </h3>
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                      Dosage: {log.medication.dosage} • {log.medication.frequency.replace(/_/g, " ")}
                    </p>

                    {/* Clinical Instructions */}
                    {log.medication.notes && (
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        💡 {log.medication.notes}
                      </p>
                    )}

                    {/* Taken timestamp if completed */}
                    {isTaken && log.takenAt && (
                      <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken at{" "}
                        {new Date(log.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {log.source === "CAREGIVER" && " (Logged by Caregiver)"}
                      </p>
                    )}
                  </div>

                  {/* Tactile Bento Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    {isPending ? (
                      <div className="grid grid-cols-3 gap-2">
                        {/* Primary Bento Button: Taken */}
                        <button
                          onClick={() => handleAction(log, "TAKEN")}
                          disabled={isBusy}
                          className="col-span-2 bento-btn bento-btn-success text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Taken
                        </button>

                        {/* Secondary Bento Button: Skip */}
                        <button
                          onClick={() => handleAction(log, "SKIPPED")}
                          disabled={isBusy}
                          className="bento-btn text-xs py-2 px-2 text-slate-600 hover:text-amber-600 dark:text-slate-300"
                          title="Skip this dose"
                        >
                          Skip
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Recorded</span>
                        {/* Change status toggle */}
                        <button
                          onClick={() => handleAction(log, isTaken ? "SKIPPED" : "TAKEN")}
                          disabled={isBusy}
                          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          Undo / Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Nav Bento Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/patient/adherence"
          className="clay-card-interactive p-6 flex items-center justify-between group"
        >
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Adherence Analytics & Reports
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download CSV & print PDF summaries for your doctor visits.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </Link>

        <Link
          href="/patient/family"
          className="clay-card-interactive p-6 flex items-center justify-between group"
        >
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Care Circle & Escalation Matrix
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage family caregivers, consent levels, and emergency contacts.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
