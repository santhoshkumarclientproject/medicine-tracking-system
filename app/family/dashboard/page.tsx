"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

interface LinkedPatientData {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  permissionLevel: "VIEW_ONLY" | "ALERTS" | "FULL_MANAGEMENT";
  isEmergencyContact: boolean;
  status: string;
}

export default function FamilyDashboard() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<LinkedPatientData[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientLogs, setPatientLogs] = useState<any[]>([]);
  const [patientStats, setPatientStats] = useState<any>({ adherenceRate: 94, currentStreak: 5 });
  const [loading, setLoading] = useState(true);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        const valid = data.connections || [];
        setConnections(valid);

        if (valid.length > 0 && !selectedPatientId) {
          const firstPatientId = valid[0].patient?.id;
          setSelectedPatientId(firstPatientId);
          fetchPatientDetails(firstPatientId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    try {
      const logsRes = await fetch(`/api/intake-logs?patientId=${patientId}`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setPatientLogs(data.todayLogs || []);
        if (data.stats) setPatientStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const handlePatientSelect = (pId: string) => {
    setSelectedPatientId(pId);
    fetchPatientDetails(pId);
  };

  const handleCaregiverLogIntake = async (logId: string, medicationId: string, scheduledAt: string, status: "TAKEN" | "SKIPPED") => {
    try {
      const res = await fetch("/api/intake-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId,
          medicationId,
          scheduledAt,
          status,
          source: "CAREGIVER",
        }),
      });

      if (res.ok) {
        fetchPatientDetails(selectedPatientId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeConnection = connections.find((c) => c.patient?.id === selectedPatientId);
  const canManage = activeConnection?.permissionLevel === "FULL_MANAGEMENT";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            <Heart className="w-4 h-4" />
            Family & Caregiver Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Caregiver Oversight & Support
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor your loved one&apos;s medication intake, track compliance streaks, and step in when needed.
          </p>
        </div>

        <button
          onClick={fetchFamilyData}
          className="bento-btn text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 text-teal-600" /> Refresh Stream
        </button>
      </div>

      {/* Loved One Profile & Emergency Contact Bento */}
      {activeConnection && (
        <div className="clay-card p-6 sm:p-8 border-l-4 border-l-rose-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 uppercase">
                  CARE RECIPIENT
                </span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  Permission: {activeConnection.permissionLevel}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeConnection.patient.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeConnection.patient.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/call?role=PATIENT&name=${encodeURIComponent(activeConnection.patient.name)}`}
                className="bento-btn text-xs py-2 px-4 flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60"
              >
                <Phone className="w-4 h-4 text-rose-500" /> Start In-App Call
              </Link>
              <Link
                href="/messages"
                className="bento-btn bento-btn-primary text-xs py-2 px-4"
              >
                Message Doctor / Patient
              </Link>
            </div>
          </div>

          {/* Quick Adherence Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="clay-inset p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Compliance</span>
              <p className="text-2xl font-black text-teal-600 mt-0.5">
                {patientStats.adherenceRate}%
              </p>
            </div>
            <div className="clay-inset p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Streak</span>
              <p className="text-2xl font-black text-amber-500 mt-0.5 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500" /> {patientStats.currentStreak}d
              </p>
            </div>
            <div className="clay-inset p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Missed Doses</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {patientStats.missedCount || 0}
              </p>
            </div>
            <div className="clay-inset p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Alert Tier</span>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Tier 1 Escalation Active
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule for Loved One */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Today&apos;s Regimen for {activeConnection?.patient?.name}
          </h3>
          {!canManage && (
            <span className="text-xs text-slate-500 italic">
              View-Only Mode (Patient has not granted write permissions)
            </span>
          )}
        </div>

        {patientLogs.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-400">
            No scheduled medications recorded for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientLogs.map((log) => {
              const isTaken = log.status === "TAKEN";
              const isMissed = log.status === "MISSED";
              const isPending = log.status === "PENDING";
              const timeString = new Date(log.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={log.id} className="clay-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-500" /> {timeString}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isTaken
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : isMissed
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {log.medication.name}
                    </h4>
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                      {log.medication.dosage}
                    </p>
                    {log.medication.notes && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl">
                        {log.medication.notes}
                      </p>
                    )}
                  </div>

                  {/* Caregiver Actions if Full Management */}
                  {canManage && isPending && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCaregiverLogIntake(log.id, log.medicationId, log.scheduledAt, "TAKEN")
                        }
                        className="bento-btn bento-btn-success text-xs py-1.5 px-3 flex-1"
                      >
                        Log as Taken
                      </button>
                      <button
                        onClick={() =>
                          handleCaregiverLogIntake(log.id, log.medicationId, log.scheduledAt, "SKIPPED")
                        }
                        className="bento-btn text-xs py-1.5 px-3 text-slate-500"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
