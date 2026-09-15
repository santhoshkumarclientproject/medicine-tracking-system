"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Activity,
  Plus,
  RefreshCw,
} from "lucide-react";

interface LinkedPatient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  adherenceRate: number;
  missedCount: number;
  activeMedsCount: number;
  status: string;
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <Stethoscope className="w-4 h-4" />
            Physician Clinical Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Patient Roster & Adherence Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track linked patients, review compliance benchmarks, and adjust clinical regimens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/doctor/alerts"
            className="bento-btn bento-btn-warning text-xs py-2.5 px-4 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Clinical Alerts
          </Link>
          <button
            onClick={fetchDoctorData}
            disabled={loading}
            className="bento-btn text-xs py-2.5 px-3"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="clay-card p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient by name or email..."
          className="w-full bg-transparent border-none text-sm focus:outline-none text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Patients Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Active Linked Patients ({filteredPatients.length})
          </h2>
        </div>

        {loading ? (
          <div className="clay-card p-12 text-center text-slate-400">Loading patient roster...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-500">
            No patients match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => {
              const isAtRisk = patient.adherenceRate < 80 || patient.missedCount >= 3;

              return (
                <div key={patient.id} className="clay-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Adherence Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isAtRisk
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {patient.adherenceRate}% Adherence
                      </span>

                      <span className="text-xs text-slate-400 font-medium">
                        {patient.activeMedsCount} Active Meds
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-slate-500">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Tel: {patient.phone}
                      </p>
                    )}

                    {/* Risk alert banner */}
                    {isAtRisk && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Adherence Drop: {patient.missedCount} Missed Doses
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Consent Active</span>
                    <Link
                      href={`/doctor/patients/${patient.id}`}
                      className="bento-btn bento-btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      View Chart <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
