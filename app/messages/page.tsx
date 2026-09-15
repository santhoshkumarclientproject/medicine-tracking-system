"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Send,
  User,
  Stethoscope,
  Heart,
  ShieldCheck,
  Clock,
  RefreshCw,
  Video,
} from "lucide-react";

interface MessageItem {
  id: string;
  senderId: string;
  recipientId: string;
  patientId: string | null;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
  recipient: { id: string; name: string; role: string };
}

export default function ClinicalMessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = session?.user as any;

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !currentUser) return;

    setSending(true);
    try {
      // Determine recipient: If patient, send to doctor; if doctor, send to patient
      const isDoctor = currentUser.role === "DOCTOR";
      // Find a suitable recipient from existing message contacts or default to doctor/patient
      let recipientId = "";
      if (messages.length > 0) {
        const other = messages.find((m) => m.senderId !== currentUser.id);
        if (other) recipientId = other.senderId;
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipientId || currentUser.id,
          body,
        }),
      });

      if (res.ok) {
        setBody("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="clay-card p-6 sm:p-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <MessageSquare className="w-4 h-4" />
            Clinical Communications
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Secure Care Circle Messaging
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            End-to-end clinical discussion between patient, physician, and family caregivers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/call"
            className="bento-btn bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5 text-teal-600" /> Launch Video Call
          </a>
          <button
            onClick={fetchMessages}
            className="bento-btn text-xs py-2 px-3"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message Chat Container */}
      <div className="clay-card p-6 flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading && messages.length === 0 ? (
            <div className="py-20 text-center text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              No messages yet. Send a note to your care circle below!
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser?.id;
              const role = m.sender.role;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-medium">
                    {role === "DOCTOR" ? (
                      <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Dr. {m.sender.name}
                      </span>
                    ) : role === "FAMILY" ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {m.sender.name} (Caregiver)
                      </span>
                    ) : (
                      <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> {m.sender.name}
                      </span>
                    )}
                    <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  <div
                    className={`max-w-lg p-4 rounded-3xl text-sm ${
                      isMe
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-tr-sm shadow-md"
                        : "clay-inset text-slate-800 dark:text-slate-100 rounded-tl-sm"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSend}
          className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a clinical note or question..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bento-btn bento-btn-primary py-3 px-5 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
