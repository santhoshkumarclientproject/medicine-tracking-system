"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  ArrowLeft,
  Pill,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldAlert,
  Calendar,
  X,
  Video,
} from "lucide-react";

interface PatientDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile?: {
    dob: string | null;
    bloodGroup: string | null;
    allergies: string | null;
  } | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timesOfDay: string;
  status: "ACTIVE" | "DISCONTINUED" | "PAUSED";
  notes?: string | null;
  startDate: string;
  prescribedBy?: { name: string } | null;
}

interface IntakeLog {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  status: string;
  medication: { name: string; dosage: string };
}

export default function DoctorPatientChartPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Prescription Form Modal
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("ONCE_DAILY");
  const [timesOfDay, setTimesOfDay] = useState(["08:00"]);
  const [notes, setNotes] = useState("");
  const [liveWarnings, setLiveWarnings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const [medsRes, logsRes] = await Promise.all([
        fetch(`/api/medications?patientId=${patientId}`),
        fetch(`/api/intake-logs?patientId=${patientId}`),
      ]);

      if (medsRes.ok) {
        const medsData = await medsRes.json();
        setMedications(medsData.medications || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.todayLogs || []);
      }

      // Fetch patient basic details
      const reportRes = await fetch(`/api/reports?patientId=${patientId}&format=json`);
      if (reportRes.ok) {
        const rData = await reportRes.json();
        setPatient(rData.patient);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [patientId]);

  // Drug Interaction check when prescribing
  useEffect(() => {
    if (name.trim().length < 3) {
      setLiveWarnings([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateDrug: name, patientId }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiveWarnings(data.warnings || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [name, patientId]);

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dosage,
          frequency,
          timesOfDay,
          notes,
          patientId,
        }),
      });

      if (res.ok) {
        setShowPrescribeModal(false);
        setName("");
        setDosage("");
        setNotes("");
        setLiveWarnings([]);
        fetchChart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscontinue = async (medId: string, currentStatus: string) => {
    const reason = prompt("Enter clinical reason for discontinuing/changing medication:") || "Clinical review";
    try {
      const res = await fetch("/api/medications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: medId,
          status: currentStatus === "ACTIVE" ? "DISCONTINUED" : "ACTIVE",
          reason,
        }),
      });
      if (res.ok) fetchChart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: patientId,
          patientId,
          body: messageText,
        }),
      });

      if (res.ok) {
        setMessageText("");
        setMessageSentSuccess(true);
        setTimeout(() => setMessageSentSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const activeMeds = medications.filter((m) => m.status === "ACTIVE");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/doctor/dashboard"
          className="bento-btn text-xs py-2 px-3 flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient Roster
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
              CLINICAL MEDICAL RECORD
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {patient?.name || "Patient Record"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient?.email} • {patient?.phone || "No phone listed"}
            </p>
            {patient?.profile?.allergies && (
              <div className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                Known Allergies: {patient.profile.allergies}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/call?role=PATIENT&name=${encodeURIComponent(patient?.name || "Sarah Connor")}`}
              className="bento-btn bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 shadow-sm"
            >
              <Video className="w-4 h-4 text-rose-500" /> Start Telehealth Call
            </Link>
            <button
              onClick={() => setShowPrescribeModal(true)}
              className="bento-btn bento-btn-primary flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Prescribe New Medication
            </button>
          </div>
        </div>
      </div>

      {/* Active Regimen Bento Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-sky-600" />
          Active Regimen ({activeMeds.length})
        </h2>

        {loading ? (
          <div className="clay-card p-8 text-center text-slate-400">Loading chart...</div>
        ) : activeMeds.length === 0 ? (
          <div className="clay-card p-8 text-center text-slate-500">
            No active medications in current regimen.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMeds.map((med) => {
              let times: string[] = [];
              try {
                times = JSON.parse(med.timesOfDay);
              } catch {
                times = ["08:00"];
              }

              return (
                <div key={med.id} className="clay-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        {med.dosage}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {med.frequency.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {med.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {times.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-sky-500" /> {t}
                        </span>
                      ))}
                    </div>

                    {med.notes && (
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {med.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Rx Date: {new Date(med.startDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDiscontinue(med.id, med.status)}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Discontinue Rx
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctor-Patient Clinical Note / Message Bento */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Direct Physician Clinical Note
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Send clinical guidance, dosage change rationale, or follow-up instructions directly to {patient?.name}.
        </p>

        {messageSentSuccess && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Message delivered to patient portal!
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write clinical instructions or notes for the patient..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingMessage}
              className="bento-btn bento-btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSendingMessage ? "Sending..." : "Send Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Prescribe Modal with Live Interaction Checker */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Prescribe Medication
                </h3>
              </div>
              <button
                onClick={() => setShowPrescribeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrescribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Drug Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Spironolactone, Lisinopril, Warfarin"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Real-time Interaction Warning */}
              {liveWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600">
                    <ShieldAlert className="w-4 h-4" />
                    CLINICAL CONTRAINDICATION / WARNING
                  </div>
                  {liveWarnings.map((w, idx) => (
                    <p key={idx} className="text-xs">
                      <strong>{w.drugA} + {w.drugB} ({w.severity}):</strong> {w.description}
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 25mg"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="ONCE_DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                    <option value="AS_NEEDED">As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions for the patient..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="bento-btn text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bento-btn bento-btn-primary text-xs py-2 px-6"
                >
                  {isSubmitting ? "Prescribing..." : "Prescribe Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
