"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, AlertTriangle, Clock, RefreshCw, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "PRE" | "PRIMARY" | "ESCALATION";
  message: string;
  sentAt: string | null;
  createdAt: string;
  status: string;
  recipientRole: string;
  medication?: {
    name: string;
    dosage: string;
    patient?: { name: string };
  };
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCronCheck = async () => {
    try {
      setIsTriggering(true);
      const res = await fetch("/api/cron/reminders");
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  const unreadCount = notifications.filter((n) => n.status !== "READ").length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bento-btn p-2.5 rounded-2xl relative text-slate-700 dark:text-slate-200"
        aria-label="Notification center"
        title="Clinical Reminders & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 clay-card p-4 z-50 animate-in fade-in slide-in-from-top-2 border border-white/60 dark:border-slate-700/60 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Reminders & Escalations
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={triggerCronCheck}
                disabled={isTriggering}
                title="Run Reminder Engine Check"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-teal-600 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isTriggering ? "animate-spin text-teal-600" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 my-2 divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-teal-500/50" />
                <span>All caught up! No active alerts.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const isEscalation = n.type === "ESCALATION";
                const isPre = n.type === "PRE";
                const isRead = n.status === "READ";

                return (
                  <div
                    key={n.id}
                    className={`py-3 px-2 rounded-xl transition flex flex-col gap-1 ${
                      isRead
                        ? "opacity-60"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {isEscalation ? (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> ESCALATION ({n.recipientRole})
                          </span>
                        ) : isPre ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> UPCOMING (15m)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                            <Bell className="w-3.5 h-3.5" /> PRIMARY DUE
                          </span>
                        )}
                      </div>
                      {!isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-slate-400 hover:text-teal-600"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                      {n.message || `Scheduled dose for ${n.medication?.name}`}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {n.medication?.patient?.name && (
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Patient: {n.medication.patient.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
            <span>Escalation Engine: Active</span>
            <button
              onClick={triggerCronCheck}
              disabled={isTriggering}
              className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              {isTriggering ? "Evaluating..." : "Check Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
