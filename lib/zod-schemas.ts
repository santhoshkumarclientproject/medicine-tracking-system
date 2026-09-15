import { z } from "zod";

export const medicationSchema = z.object({
  name: z.string().min(2, "Medication name must be at least 2 characters").max(100),
  dosage: z.string().min(1, "Dosage is required (e.g., '10mg', '500mg')"),
  frequency: z.enum([
    "ONCE_DAILY",
    "TWICE_DAILY",
    "THREE_TIMES_DAILY",
    "FOUR_TIMES_DAILY",
    "AS_NEEDED",
    "WEEKLY",
  ]),
  timesOfDay: z
    .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:mm format"))
    .min(1, "At least one scheduled intake time is required"),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  patientId: z.string().optional(), // Used if Doctor is prescribing for a patient
});

export const updateMedicationStatusSchema = z.object({
  medicationId: z.string(),
  status: z.enum(["ACTIVE", "DISCONTINUED", "PAUSED"]),
  reason: z.string().optional(),
});

export const intakeLogActionSchema = z.object({
  logId: z.string().optional(),
  medicationId: z.string(),
  scheduledAt: z.string(), // ISO string
  status: z.enum(["TAKEN", "MISSED", "SKIPPED"]),
  notes: z.string().max(300).optional(),
  source: z.enum(["APP", "OFFLINE_SYNC", "CAREGIVER"]).default("APP"),
});

export const familyInviteSchema = z.object({
  invitedEmail: z.string().email("Please provide a valid email address"),
  permissionLevel: z.enum(["VIEW_ONLY", "ALERTS", "FULL_MANAGEMENT"]),
  isEmergencyContact: z.boolean().default(false),
});

export const familyRespondSchema = z.object({
  connectionId: z.string(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const messageSchema = z.object({
  recipientId: z.string(),
  patientId: z.string().optional(),
  body: z.string().min(1, "Message cannot be empty").max(1000),
});

export const userPreferencesSchema = z.object({
  largeTextPref: z.boolean().optional(),
  darkModePref: z.boolean().optional(),
  phone: z.string().optional(),
  name: z.string().min(2).optional(),
});

export const checkInteractionSchema = z.object({
  candidateDrug: z.string().min(2),
  patientId: z.string().optional(),
});
