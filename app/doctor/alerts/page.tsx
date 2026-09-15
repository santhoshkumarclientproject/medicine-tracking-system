"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Bell,
  Activity,
} from "lucide-react";

interface EscalationAlert {
  id: string;
  type: string;
  message: string;
  sentAt: string | null;
  createdAt: string;
  status: string;
  recipientRole: string;
  medication?: {
    name: string;
    dosage: string;
    patient?: { id: string; name: string };
  };
}

export default function DoctorAlertsPage() {
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [lastEvalSummary, setLastEvalSummary] = useState<any>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const triggerEscalationCheck = async () => {
    try {
      setEvaluating(true);
      const res = await fetch("/api/cron/reminders");
      if (res.ok) {
        const data = await res.json();
        setLastEvalSummary(data.summary);
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Link
          href="/doctor/dashboard"
          className="bento-btn text-xs py-2 px-3 flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient Roster
        </Link>
      </div>

      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            Clinical Escalation Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Adherence Drops & Overdue Dose Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time feed of multi-tier escalations and chronic non-adherence flags.
          </p>
        </div>

        <button
          onClick={triggerEscalationCheck}
          disabled={evaluating}
          className="bento-btn bento-btn-primary text-xs py-2.5 px-4 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${evaluating ? "animate-spin" : ""}`} />
          {evaluating ? "Evaluating Engine..." : "Run Escalation Check"}
        </button>
      </div>

      {/* Evaluation Results Banner */}
      {lastEvalSummary && (
        <div className="clay-card p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 text-teal-800 dark:text-teal-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Escalation Check Completed:
          </div>
          <div className="flex items-center gap-3">
            <span>Primary Sent: {lastEvalSummary.primaryRemindersSent}</span>
            <span>Family Escalations: {lastEvalSummary.familyEscalationsSent}</span>
            <span>Doctor Escalations: {lastEvalSummary.doctorEscalationsSent}</span>
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="clay-card p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-500" />
          Escalations ({alerts.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-teal-500/50" />
            <span>No pending clinical escalations. All patients in adherence.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="clay-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-rose-500"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 uppercase">
                      {a.type} ESCALATION
                    </span>
                    {a.medication?.patient?.name && (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Patient: {a.medication.patient.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                    {a.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Logged: {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>

                {a.medication?.patient?.id && (
                  <Link
                    href={`/doctor/patients/${a.medication.patient.id}`}
                    className="bento-btn text-xs py-1.5 px-3 text-sky-600 dark:text-sky-400"
                  >
                    View Chart →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
