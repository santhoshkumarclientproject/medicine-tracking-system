import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Pill,
  ShieldAlert,
  Clock,
  HeartHandshake,
  Activity,
  CheckCircle,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (user) {
    if (user.role === "PATIENT") redirect("/patient/dashboard");
    if (user.role === "DOCTOR") redirect("/doctor/dashboard");
    if (user.role === "FAMILY") redirect("/family/dashboard");
    if (user.role === "ADMIN") redirect("/doctor/dashboard");
  }

  return (
    <div className="py-8 sm:py-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <Activity className="w-4 h-4 text-teal-500 animate-pulse" />
          Next-Gen Medication Adherence CRM
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">
          Intelligent Medicine Tracking for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
            Patients, Doctors & Families
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Ensure zero missed doses with our 3-tier automated escalation engine,
          clinical drug interaction safeguards, and multi-portal caregiver collaboration.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="bento-btn bento-btn-primary px-8 py-4 text-base shadow-xl flex items-center gap-2"
          >
            Launch MedTrack Portal <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Bento Grid Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Bento 1: 3-Tier Escalation */}
        <div className="clay-card p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              3-Tier Escalation Engine
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Gentle pre-reminders to the patient. If unacknowledged past grace period,
              alerts loved ones. If 3+ doses are missed in 7 days, escalates directly to the physician.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Patient → Family → Doctor
          </div>
        </div>

        {/* Bento 2: Clinical Drug Interactions */}
        <div className="clay-card p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-6">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Drug Interaction Warnings
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every prescribed medication is cross-checked in real-time against active regimens
              to detect adverse interactions (e.g. Lisinopril + Potassium, Warfarin + Aspirin).
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400">
            Reference Verification Engine
          </div>
        </div>

        {/* Bento 3: Caregiver & Consent Matrix */}
        <div className="clay-card p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-6">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Consent-Gated Care Circle
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Patients maintain granular control. Grant family members View-Only, Alerts-Only,
              or Full Management permissions to log doses on their behalf.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-teal-600 dark:text-teal-400">
            Granular HIPAA-Compliant RBAC
          </div>
        </div>
      </div>
    </div>
  );
}
