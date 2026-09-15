# MedTrack — Medicine Tracking CRM

> **Developed by Immortal Minds Technology in 2026**

MedTrack is a production-grade, healthcare-adjacent **Medicine Tracking CRM** built with **Next.js 14+ (App Router)**, **TypeScript**, **Prisma ORM**, and **NextAuth.js**. It features a tactile **Claymorphism** UI theme with responsive **Bento Buttons**, modular Bento Grid layouts, and WCAG AA accessibility.

Designed for three primary user personas:
1. **Patients:** Daily intake schedule, adherence scorecards, 1-click dose recording, drug interaction warnings, Care Circle consent management, and printable/CSV adherence reports.
2. **Doctors:** Linked patient rosters, adherence benchmarks, full medical regimen charts, prescription modifications, clinical alerts, and direct doctor-patient messaging.
3. **Family Caregivers:** Care recipient adherence overview, permission tiers (`VIEW_ONLY`, `ALERTS`, `FULL_MANAGEMENT`), proxy dose recording, and direct emergency contact calling.

---

## Key Features

- **Claymorphic Visual Design & Tactile Bento Buttons:**
  - Soft 3D inflated clay surfaces with dual drop and inner highlight shadows.
  - Interactive Bento buttons with tactile press feedback (`active:translate-y-0.5`).
  - Dark Mode claymorphism with deep matte slate surfaces.
  - Large-Text Mode toggle for elderly accessibility (minimum 44px+ touch targets).

- **Multi-Tier Reminder & Escalation Engine:**
  - **Tier 1 (Patient):** Pre-reminder (-15 mins) and primary alert at scheduled dose time via in-app notification center, email, and SMS.
  - **Tier 2 (Family Caregiver):** Overdue alert sent to approved caregivers if dose is unacknowledged past grace window (> 45-60 mins).
  - **Tier 3 (Doctor):** Chronic non-adherence escalation triggered when a patient records 3+ missed doses over the past 7 days.
  - Configured for Vercel Cron via `vercel.json` (`*/5 * * * *`) and API route `/api/cron/reminders`.

- **Clinical Drug Interaction Safeguards:**
  - Reference interaction database cross-checking candidate prescriptions in real time.
  - Detects moderate and severe contraindications (e.g., Lisinopril + Spironolactone / Potassium, Metformin + Contrast, Warfarin + Aspirin) and displays instant warning banners.

- **Consent-Gated Role-Based Access Control (RBAC):**
  - NextAuth JWT sessions with server-side role validation in middleware and API route handlers.
  - Granular caregiver permission tiers (`VIEW_ONLY`, `ALERTS`, `FULL_MANAGEMENT`).
  - Strict HIPAA-aware audit logging on all patient data reads, medication updates, and intake logs.

- **In-App Telehealth Audio & Video Calling (`/call`):**
  - Direct, real-time video/audio calling inside the browser between **Patients**, **Doctors**, and **Family Caregivers**.
  - Interactive Claymorphic Bento controls: Mute/Unmute Mic, Toggle Camera Video, Screen Sharing, and End Call.
  - In-call Physician Consultation Notes with automatic clinical saving to medical records and audit trail.
  - Quick multi-party participant switching (Doctor $\leftrightarrow$ Patient $\leftrightarrow$ Caregiver) and live audio waveform indicators.
  - One-click call triggers from Navbar, Doctor Patient Chart, Caregiver Portal, Patient Care Circle, and Chat.

- **PWA & Offline Logging Support:**
  - Offline Service Worker (`public/sw.js`) and Web App Manifest (`public/manifest.json`).
  - Queues intake actions locally in browser storage when disconnected and automatically synchronizes when connectivity is restored.

---

## Quick Start & Local Execution

### 1. Prerequisites
- Node.js 18+ or 20+
- npm

### 2. Setup & Database Seeding
```bash
# Install dependencies
npm install

# Push Prisma Schema to SQLite (Zero-config local DB)
npx prisma db push

# Seed realistic clinical accounts and medications
npm run prisma:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

All demo accounts share the password: `MedTrack123!`

| Role | Email | Name | Capabilities |
|------|-------|------|--------------|
| **Patient** | `patient@medtrack.com` | Sarah Connor | Today's intake, Meds CRUD, Adherence analytics, Care Circle |
| **Doctor** | `doctor@medtrack.com` | Dr. Gregory House, MD | Linked patient roster, Prescribe meds, Escalation desk |
| **Family** | `family@medtrack.com` | John Connor | Caregiver dashboard, Emergency contact, Proxy dose logging |
| **Admin** | `admin@medtrack.com` | Administrator | System-wide audit logs and overview |

*The login page also provides 1-Click Demo Switcher buttons for instant testing.*

---

## Production Deployment (Vercel + PostgreSQL)

1. Set `DATABASE_URL` in environment variables to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/medtrack?sslmode=require"
   ```
2. In `prisma/schema.prisma`, update provider to `"postgresql"`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `CRON_SECRET`.
4. Deploy to Vercel. `vercel.json` will automatically schedule the reminder cron job every 5 minutes.
