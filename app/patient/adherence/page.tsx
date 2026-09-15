"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface LogEntry {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  status: "TAKEN" | "MISSED" | "SKIPPED" | "PENDING";
  source: string;
  notes?: string | null;
  medication: {
    name: string;
    dosage: string;
  };
}

interface StatsSummary {
  adherenceRate: number;
  currentStreak: number;
  totalScheduled: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
}

export default function AdherencePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    adherenceRate: 100,
    currentStreak: 5,
    totalScheduled: 0,
    takenCount: 0,
    missedCount: 0,
    skippedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/intake-logs");
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
          if (data.recentLogs) setLogs(data.recentLogs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadCSV = () => {
    window.open("/api/reports?format=csv", "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const missedLogs = logs.filter((l) => l.status === "MISSED");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Activity className="w-4 h-4" />
            Clinical Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Adherence & Compliance
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Compliance rate tracking, missed dose ledger, and clinical export reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadCSV}
            className="bento-btn bento-btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="bento-btn text-xs py-2.5 px-4 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Bento Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Compliance Rate Dial */}
        <div className="clay-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              7-Day Adherence Rate
            </span>
            <h3 className="text-4xl font-black text-teal-600 dark:text-teal-400 mt-2">
              {stats.adherenceRate}%
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {stats.adherenceRate >= 85
                ? "Optimal Clinical Compliance"
                : "At-Risk: Review Regimen"}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Activity className="w-8 h-8" />
          </div>
        </div>

        {/* Current Streak */}
        <div className="clay-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Consecutive Streak
            </span>
            <h3 className="text-4xl font-black text-amber-500 mt-2">
              {stats.currentStreak} Days
            </h3>
            <p className="text-xs text-slate-500 mt-1">Consistent daily intake</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Flame className="w-8 h-8 fill-amber-500" />
          </div>
        </div>

        {/* Missed Doses Total */}
        <div className="clay-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Missed Doses (7 Days)
            </span>
            <h3 className={`text-4xl font-black mt-2 ${stats.missedCount >= 3 ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
              {stats.missedCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {stats.missedCount >= 3 ? "⚠️ Triggers Doctor Escalation" : "Within acceptable safety window"}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Missed Dose History Ledger */}
      {missedLogs.length > 0 && (
        <div className="clay-card p-6 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-extrabold text-sm uppercase tracking-wider mb-3">
            <XCircle className="w-4 h-4" /> Missed Dose Escalation History
          </div>
          <div className="space-y-2">
            {missedLogs.map((m) => (
              <div
                key={m.id}
                className="clay-card p-4 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {m.medication.name} ({m.medication.dosage})
                  </span>
                  <span className="text-slate-500 ml-2">
                    Scheduled: {new Date(m.scheduledAt).toLocaleString()}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold">
                  MISSED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intake History Table */}
      <div className="clay-card p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Intake Log History (Past 30 Days)
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading intake logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-slate-400">No logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Medication</th>
                  <th className="py-3 px-3">Scheduled Time</th>
                  <th className="py-3 px-3">Recorded Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {logs.map((log) => {
                  const isTaken = log.status === "TAKEN";
                  const isMissed = log.status === "MISSED";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.medication.name}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          ({log.medication.dosage})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                        {new Date(log.scheduledAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                        {log.takenAt
                          ? new Date(log.takenAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isTaken
                              ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                              : isMissed
                              ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {log.source === "CAREGIVER" ? "Caregiver Sync" : "Mobile App"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
