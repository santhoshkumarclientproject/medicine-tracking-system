"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  UserCheck,
  Mail,
  ShieldCheck,
  Plus,
  Phone,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

interface ConnectionItem {
  id: string;
  invitedEmail: string;
  permissionLevel: "VIEW_ONLY" | "ALERTS" | "FULL_MANAGEMENT";
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  isEmergencyContact: boolean;
  familyUser?: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

export default function CareCirclePage() {
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState<
    "VIEW_ONLY" | "ALERTS" | "FULL_MANAGEMENT"
  >("FULL_MANAGEMENT");
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedEmail: email,
          permissionLevel,
          isEmergencyContact,
        }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        setEmail("");
        fetchConnections();
      } else {
        const data = await res.json();
        setMsg(data.error || "Failed to send invitation");
      }
    } catch {
      setMsg("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePermission = async (connectionId: string, newLevel: string) => {
    try {
      const res = await fetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          permissionLevel: newLevel,
        }),
      });
      if (res.ok) fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            <Heart className="w-4 h-4" />
            Care Circle & Consent Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Family Caregivers & Doctor Link
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage who can view your intake, receive escalation alerts, or log doses on your behalf.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="bento-btn bento-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Invite Caregiver
        </button>
      </div>

      {/* Linked Doctor Box */}
      <div className="clay-card p-6 border-l-4 border-l-sky-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Dr. Gregory House, MD
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                PRIMARY ATTENDING PHYSICIAN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Metro General Internal Medicine • Active Clinical Consent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/call?role=DOCTOR&name=Dr.%20Gregory%20House,%20MD"
            className="bento-btn bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5" /> Call Dr. House
          </Link>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Active Data Sharing
          </span>
        </div>
      </div>

      {/* Family Connections Bento Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-rose-500" />
          Approved Caregivers ({connections.length})
        </h2>

        {loading ? (
          <div className="clay-card p-8 text-center text-slate-400">Loading care circle...</div>
        ) : connections.length === 0 ? (
          <div className="clay-card p-8 text-center text-slate-500">
            No family caregivers connected yet. Invite a loved one to receive escalation alerts!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map((c) => (
              <div key={c.id} className="clay-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.status}
                    </span>
                    {c.isEmergencyContact && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> EMERGENCY CONTACT
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {c.familyUser?.name || c.invitedEmail}
                  </h3>
                  <p className="text-xs text-slate-500">{c.invitedEmail}</p>

                  {c.familyUser?.phone && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-600" /> {c.familyUser.phone}
                    </p>
                  )}

                  {/* Permission Tier Selector */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Permission Level
                    </label>
                    <select
                      value={c.permissionLevel}
                      onChange={(e) => updatePermission(c.id, e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="VIEW_ONLY">VIEW_ONLY (Read Adherence Only)</option>
                      <option value="ALERTS">ALERTS (Receives Missed Dose Alerts)</option>
                      <option value="FULL_MANAGEMENT">FULL_MANAGEMENT (Can Log Doses & Edit Meds)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Escalation Tier: Priority 1</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">Consent Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card max-w-md w-full p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Invite Caregiver
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {msg}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Caregiver Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caregiver@family.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Permission Level
                </label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="FULL_MANAGEMENT">Full Management (Can record intake & update)</option>
                  <option value="ALERTS">Alerts Only (Receives missed dose notifications)</option>
                  <option value="VIEW_ONLY">View Only (Inspect adherence records only)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={isEmergencyContact}
                  onChange={(e) => setIsEmergencyContact(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="emergency" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mark as Primary Emergency Contact
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="bento-btn text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bento-btn bento-btn-primary text-xs py-2 px-6"
                >
                  {submitting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
