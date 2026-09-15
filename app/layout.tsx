import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "MedTrack — Medicine Tracking CRM",
  description:
    "Accessible, production-grade Medicine Tracking CRM for Patients, Doctors, and Family Caregivers with real-time escalation and drug interaction checks.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-[#EEF2F6] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <SessionProvider>
          <PreferencesProvider>
            <PwaRegister />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
              <footer className="py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 mt-auto">
                <p>
                  MedTrack CRM © 2026 • Developed by Immortal Minds Technology in 2026 • HIPAA-Compliant Architecture
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Disclaimer: MedTrack provides adherence tracking and automated escalation assistance. It does not replace emergency medical response or direct physician diagnosis.
                </p>
              </footer>
            </div>
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
