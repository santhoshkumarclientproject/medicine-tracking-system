"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Clock,
  Calendar,
  X,
  ShieldAlert,
  Info,
} from "lucide-react";

interface MedicationItem {
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

interface WarningItem {
  drugA: string;
  drugB: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  description: string;
}

export default function PatientMedicationsPage() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("ONCE_DAILY");
  const [timesOfDay, setTimesOfDay] = useState(["08:00"]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Live interaction warnings
  const [liveWarnings, setLiveWarnings] = useState<WarningItem[]>([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/medications");
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  // Real-time Drug Interaction Check when name changes
  useEffect(() => {
    if (name.trim().length < 3) {
      setLiveWarnings([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingInteractions(true);
        const res = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateDrug: name }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiveWarnings(data.warnings || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingInteractions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [name]);

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    if (newFreq === "ONCE_DAILY") setTimesOfDay(["08:00"]);
    else if (newFreq === "TWICE_DAILY") setTimesOfDay(["08:00", "20:00"]);
    else if (newFreq === "THREE_TIMES_DAILY") setTimesOfDay(["08:00", "14:00", "20:00"]);
    else if (newFreq === "FOUR_TIMES_DAILY") setTimesOfDay(["08:00", "12:00", "16:00", "20:00"]);
    else setTimesOfDay(["08:00"]);
  };

  const handleAddTime = () => {
    setTimesOfDay([...timesOfDay, "12:00"]);
  };

  const handleRemoveTime = (index: number) => {
    if (timesOfDay.length > 1) {
      setTimesOfDay(timesOfDay.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...timesOfDay];
    updated[index] = val;
    setTimesOfDay(updated);
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

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
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setDosage("");
        setNotes("");
        setTimesOfDay(["08:00"]);
        setLiveWarnings([]);
        fetchMedications();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to add medication");
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (medId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISCONTINUED" : "ACTIVE";
    const reason = prompt(`Reason for marking medication ${newStatus}:`) || undefined;

    try {
      const res = await fetch("/api/medications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: medId,
          status: newStatus,
          reason,
        }),
      });
      if (res.ok) {
        fetchMedications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeMeds = medications.filter((m) => m.status === "ACTIVE");
  const pastMeds = medications.filter((m) => m.status !== "ACTIVE");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Pill className="w-4 h-4" />
            Regimen Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            My Medications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Active prescriptions, scheduled dosing frequencies, and drug safety checks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bento-btn bento-btn-primary shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Medication
        </button>
      </div>

      {/* Active Medications List */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-500" />
          Active Regimen ({activeMeds.length})
        </h2>

        {loading ? (
          <div className="clay-card p-12 text-center text-slate-400">Loading medications...</div>
        ) : activeMeds.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-500">
            <p className="font-semibold">No active medications registered.</p>
            <p className="text-xs text-slate-400 mt-1">Click &quot;Add New Medication&quot; above to begin.</p>
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
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold">
                        {med.dosage}
                      </span>
                      {med.prescribedBy && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Rx: Dr. {med.prescribedBy.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {med.name}
                    </h3>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1">
                      {med.frequency.replace(/_/g, " ")}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {times.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-teal-500" /> {t}
                        </span>
                      ))}
                    </div>

                    {med.notes && (
                      <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        {med.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Started: {new Date(med.startDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => toggleStatus(med.id, med.status)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
                    >
                      Discontinue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discontinued Medications */}
      {pastMeds.length > 0 && (
        <div className="pt-6">
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-4">
            Discontinued Medications ({pastMeds.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pastMeds.map((med) => (
              <div
                key={med.id}
                className="clay-card p-5 opacity-70 hover:opacity-100 transition"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 line-through">
                    {med.name} ({med.dosage})
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600">
                    DISCONTINUED
                  </span>
                </div>
                {med.notes && <p className="text-xs text-slate-500 mt-2">{med.notes}</p>}
                <button
                  onClick={() => toggleStatus(med.id, med.status)}
                  className="mt-3 text-xs font-bold text-teal-600 hover:underline"
                >
                  Reactivate Regimen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-white/80 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Add Medication
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Medication Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Lisinopril, Metformin, Atorvastatin"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Real-time Drug Interaction Warning Banner */}
              {isCheckingInteractions && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 animate-spin" /> Cross-checking drug interaction database...
                </div>
              )}

              {liveWarnings.length > 0 && (
                <div className="clay-card p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Clinical Interaction Detected
                  </div>
                  {liveWarnings.map((w, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-bold text-rose-700 dark:text-rose-300">
                        ⚠️ {w.drugA} + {w.drugB} ({w.severity} SEVERITY)
                      </p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">
                        {w.description}
                      </p>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 italic pt-1">
                    * Disclaimer: Consult your physician before combining medications.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 10mg, 500mg"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ONCE_DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                    <option value="FOUR_TIMES_DAILY">Four Times Daily</option>
                    <option value="AS_NEEDED">As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              {/* Times of Day */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Scheduled Intake Times
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add Time
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {timesOfDay.map((t, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <input
                        type="time"
                        required
                        value={t}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      {timesOfDay.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(index)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Instructions / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take with meals, glass of water, avoid citrus, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bento-btn text-xs py-2.5 px-4 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bento-btn bento-btn-primary text-xs py-2.5 px-6"
                >
                  {submitting ? "Saving..." : "Save Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
