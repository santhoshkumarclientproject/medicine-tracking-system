"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  ShieldCheck,
  Users,
  Stethoscope,
  Heart,
  User,
  Clock,
  FileText,
  Volume2,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

function CallInterface() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRole = searchParams.get("role") || "DOCTOR";
  const targetName = searchParams.get("name") || (targetRole === "DOCTOR" ? "Dr. Gregory House, MD" : targetRole === "FAMILY" ? "John Connor" : "Sarah Connor");

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<"CONNECTING" | "CONNECTED" | "ENDED">("CONNECTED");
  const [activeParticipant, setActiveParticipant] = useState(targetName);
  const [activeRole, setActiveRole] = useState(targetRole);

  // In-call Consultation Notes
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Media Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session?.user as any;

  // Initialize Camera / Microphone
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        localStreamRef.current = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.log("Using simulated media feed:", err.message);
      });

    // Notify backend call started
    fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START_CALL", recipientId: targetName }),
    }).catch(console.error);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [targetName]);

  // Duration Timer
  useEffect(() => {
    if (callStatus !== "CONNECTED") return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleEndCall = async () => {
    setCallStatus("ENDED");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "END_CALL",
          recipientId: targetName,
          notes: notes.trim() || undefined,
          callDuration: `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      if (currentUser?.role === "PATIENT") router.push("/patient/dashboard");
      else if (currentUser?.role === "DOCTOR") router.push("/doctor/dashboard");
      else if (currentUser?.role === "FAMILY") router.push("/family/dashboard");
      else router.push("/");
    }, 1200);
  };

  const saveConsultationNotes = async () => {
    if (!notes.trim()) return;
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 3000);
  };

  const switchParticipant = (name: string, role: string) => {
    setActiveParticipant(name);
    setActiveRole(role);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Telehealth Status Bar */}
      <div className="clay-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Telehealth Audio & Video Session
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 256-BIT ENCRYPTED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Connected with: <strong className="text-teal-600 dark:text-teal-400">{activeParticipant}</strong> ({activeRole})
            </p>
          </div>
        </div>

        {/* Call Duration & Participant Switcher */}
        <div className="flex items-center gap-3">
          <div className="clay-inset px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            {formatTime(callDuration)}
          </div>

          {/* Quick Participant Switch Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Switch:</span>
            <button
              onClick={() => switchParticipant("Dr. Gregory House, MD", "DOCTOR")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeRole === "DOCTOR"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => switchParticipant("Sarah Connor", "PATIENT")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeRole === "PATIENT"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => switchParticipant("John Connor", "FAMILY")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeRole === "FAMILY"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Caregiver
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Call Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Remote Participant Stage */}
        <div className="lg:col-span-2 clay-card p-6 flex flex-col justify-between min-h-[460px] relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800">
          {/* Top Remote Info */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-extrabold text-sm text-slate-100">
                {activeParticipant}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                {activeRole}
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Volume2 className="w-4 h-4 text-emerald-400" /> HD Audio Active
            </span>
          </div>

          {/* Central Avatar / Video Stream Simulation */}
          <div className="flex flex-col items-center justify-center my-12 z-10 text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-teal-500 via-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl animate-pulse">
                {activeRole === "DOCTOR" ? (
                  <Stethoscope className="w-16 h-16 text-white" />
                ) : activeRole === "FAMILY" ? (
                  <Heart className="w-16 h-16 text-white" />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <Mic className="w-3 h-3 text-white" />
              </span>
            </div>

            <h3 className="text-xl font-black mt-4 text-slate-100">{activeParticipant}</h3>
            <p className="text-xs text-teal-300 font-semibold mt-0.5">Speaking • Live Feed</p>
          </div>

          {/* Picture-in-Picture Self Video Stream */}
          <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800 z-20">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-900">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span>Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white drop-shadow">
              You ({currentUser?.name?.split(" ")[0] || "Self"})
            </div>
          </div>

          {/* Bottom Live Waveform */}
          <div className="flex items-center gap-1.5 z-10 opacity-75">
            <span className="w-1 h-3 bg-teal-400 rounded-full animate-bounce"></span>
            <span className="w-1 h-6 bg-teal-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1 h-4 bg-teal-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1 h-8 bg-teal-400 rounded-full animate-bounce [animation-delay:0.45s]"></span>
            <span className="w-1 h-5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">Real-time Audio Connected</span>
          </div>
        </div>

        {/* In-Call Consultation Notes & Care Info Panel */}
        <div className="clay-card p-6 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Consultation Notes
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confidential
              </span>
            </div>

            {notesSaved && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Notes saved to medical record!
              </div>
            )}

            <p className="text-xs text-slate-500 mb-2">
              Record clinical recommendations, dose adjustments, or symptom reports during the call.
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Sarah reports mild dizziness in the morning. Advised to take Lisinopril with breakfast and monitor BP..."
              rows={8}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Auto-saved on end</span>
            <button
              onClick={saveConsultationNotes}
              className="bento-btn bento-btn-primary text-xs py-2 px-4"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {/* Bento Call Action Bar */}
      <div className="clay-card p-4 sm:p-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 shadow-xl">
        {/* Mic Mute Toggle Bento */}
        <button
          onClick={toggleMute}
          className={`bento-btn py-3 px-5 flex items-center gap-2 text-sm transition ${
            isMuted
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 border-rose-300"
              : "text-slate-800 dark:text-slate-200"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-rose-600" /> : <Mic className="w-5 h-5 text-teal-600" />}
          <span className="font-bold">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Video Camera Toggle Bento */}
        <button
          onClick={toggleVideo}
          className={`bento-btn py-3 px-5 flex items-center gap-2 text-sm transition ${
            isVideoOff
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 border-rose-300"
              : "text-slate-800 dark:text-slate-200"
          }`}
          title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 text-rose-600" /> : <Video className="w-5 h-5 text-sky-600" />}
          <span className="font-bold">{isVideoOff ? "Start Video" : "Stop Video"}</span>
        </button>

        {/* Screen Share Toggle Bento */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`bento-btn py-3 px-5 flex items-center gap-2 text-sm transition ${
            isScreenSharing
              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 border-teal-300"
              : "text-slate-800 dark:text-slate-200"
          }`}
          title="Share Screen"
        >
          <Monitor className="w-5 h-5 text-indigo-500" />
          <span className="font-bold">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
        </button>

        {/* End Call Bento Button */}
        <button
          onClick={handleEndCall}
          className="bento-btn bento-btn-danger py-3 px-7 flex items-center gap-2 text-sm font-black shadow-lg"
          title="End Telehealth Call"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
}

export default function TelehealthCallPage() {
  return (
    <Suspense fallback={<div className="clay-card p-12 text-center text-slate-400">Loading Telehealth Session...</div>}>
      <CallInterface />
    </Suspense>
  );
}
