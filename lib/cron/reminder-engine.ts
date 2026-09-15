import { prisma } from "@/lib/prisma";
import { sendEmailNotification, sendSmsNotification } from "@/lib/notifications";

export interface ReminderJobResult {
  logsGenerated: number;
  preRemindersSent: number;
  primaryRemindersSent: number;
  familyEscalationsSent: number;
  doctorEscalationsSent: number;
}

/**
 * Ensures today's IntakeLog entries exist for all active medications.
 */
export async function generateDailyIntakeLogs(targetDate: Date = new Date()): Promise<number> {
  const activeMeds = await prisma.medication.findMany({
    where: { status: "ACTIVE" },
    include: { patient: true },
  });

  let createdCount = 0;
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  for (const med of activeMeds) {
    let times: string[] = [];
    try {
      times = JSON.parse(med.timesOfDay);
    } catch {
      times = ["08:00"];
    }

    for (const timeStr of times) {
      const [hh, mm] = timeStr.split(":").map(Number);
      const scheduledTime = new Date(targetDate);
      scheduledTime.setHours(hh || 8, mm || 0, 0, 0);

      // Check if log already exists
      const existing = await prisma.intakeLog.findFirst({
        where: {
          medicationId: med.id,
          scheduledAt: scheduledTime,
        },
      });

      if (!existing) {
        await prisma.intakeLog.create({
          data: {
            medicationId: med.id,
            scheduledAt: scheduledTime,
            status: "PENDING",
            source: "APP",
          },
        });
        createdCount++;
      }
    }
  }

  return createdCount;
}

/**
 * Processes reminders and executes 3-tier escalation engine:
 * 1. Pre & Primary to Patient
 * 2. Overdue grace period escalation to Family Caregivers
 * 3. Chronic non-adherence (3+ missed in 7 days) escalation to Doctor
 */
export async function processReminderAndEscalations(): Promise<ReminderJobResult> {
  const now = new Date();
  const result: ReminderJobResult = {
    logsGenerated: 0,
    preRemindersSent: 0,
    primaryRemindersSent: 0,
    familyEscalationsSent: 0,
    doctorEscalationsSent: 0,
  };

  // 1. Ensure logs are generated for today
  result.logsGenerated = await generateDailyIntakeLogs(now);

  // 2. Query today's pending or recently missed intake logs
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const pendingLogs = await prisma.intakeLog.findMany({
    where: {
      scheduledAt: { gte: startOfToday },
      status: { in: ["PENDING", "MISSED"] },
    },
    include: {
      medication: {
        include: {
          patient: true,
          reminders: true,
        },
      },
    },
  });

  for (const log of pendingLogs) {
    const scheduledTime = new Date(log.scheduledAt).getTime();
    const currentTime = now.getTime();
    const diffMinutes = Math.round((currentTime - scheduledTime) / (60 * 1000));
    const patient = log.medication.patient;

    // A. Pre-reminder (-25 to -5 minutes before dose)
    if (diffMinutes >= -25 && diffMinutes < -5) {
      const existingPre = await prisma.reminder.findFirst({
        where: {
          medicationId: log.medicationId,
          type: "PRE",
          createdAt: { gte: startOfToday },
        },
      });

      if (!existingPre) {
        const message = `Upcoming: Take ${log.medication.name} (${log.medication.dosage}) in about 15 minutes.`;
        await prisma.reminder.create({
          data: {
            medicationId: log.medicationId,
            type: "PRE",
            offsetMinutes: -15,
            channel: "INAPP",
            status: "SENT",
            recipientRole: "PATIENT",
            message,
            sentAt: now,
          },
        });
        result.preRemindersSent++;
      }
    }

    // B. Primary alert (due now or up to 45 mins late)
    if (diffMinutes >= -5 && diffMinutes <= 45 && log.status === "PENDING") {
      const existingPrimary = await prisma.reminder.findFirst({
        where: {
          medicationId: log.medicationId,
          type: "PRIMARY",
          createdAt: { gte: startOfToday },
        },
      });

      if (!existingPrimary) {
        const message = `Medication Due: Please take ${log.medication.name} (${log.medication.dosage}) now.`;
        await prisma.reminder.create({
          data: {
            medicationId: log.medicationId,
            type: "PRIMARY",
            offsetMinutes: 0,
            channel: "INAPP",
            status: "SENT",
            recipientRole: "PATIENT",
            message,
            sentAt: now,
          },
        });

        await sendEmailNotification({
          to: patient.email,
          subject: `MedTrack Alert: Time to take ${log.medication.name}`,
          html: `<p>Hello ${patient.name},</p><p>It is time to take your scheduled dose of <strong>${log.medication.name} (${log.medication.dosage})</strong>.</p><p>Please record your intake in the MedTrack portal.</p>`,
        });

        if (patient.phone) {
          await sendSmsNotification({
            to: patient.phone,
            body: `MedTrack Alert: Time to take ${log.medication.name} (${log.medication.dosage}).`,
          });
        }

        result.primaryRemindersSent++;
      }
    }

    // C. Escalation Tier 1: Family Alert (overdue by > 45 minutes)
    if (diffMinutes > 45) {
      // Mark as missed if still pending past 90 minutes
      if (diffMinutes > 90 && log.status === "PENDING") {
        await prisma.intakeLog.update({
          where: { id: log.id },
          data: { status: "MISSED", notes: "Automatically marked missed by escalation engine" },
        });
      }

      // Check if family has already been alerted for this medication today
      const existingFamilyEsc = await prisma.reminder.findFirst({
        where: {
          medicationId: log.medicationId,
          type: "ESCALATION",
          recipientRole: "FAMILY",
          createdAt: { gte: startOfToday },
        },
      });

      if (!existingFamilyEsc) {
        // Query approved family members with ALERTS or FULL_MANAGEMENT
        const familyLinks = await prisma.familyConnection.findMany({
          where: {
            patientId: patient.id,
            status: "ACCEPTED",
            permissionLevel: { in: ["ALERTS", "FULL_MANAGEMENT"] },
          },
          include: { familyUser: true },
        });

        for (const link of familyLinks) {
          const familyEmail = link.familyUser?.email || link.invitedEmail;
          const familyName = link.familyUser?.name || "Caregiver";

          const message = `Caregiver Alert: ${patient.name} has an overdue dose of ${log.medication.name} (${log.medication.dosage}) scheduled for ${new Date(log.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;

          await prisma.reminder.create({
            data: {
              medicationId: log.medicationId,
              type: "ESCALATION",
              offsetMinutes: diffMinutes,
              channel: "INAPP",
              status: "SENT",
              recipientRole: "FAMILY",
              message,
              sentAt: now,
            },
          });

          await sendEmailNotification({
            to: familyEmail,
            subject: `MedTrack Caregiver Alert: Overdue Dose for ${patient.name}`,
            html: `<p>Hello ${familyName},</p><p>${patient.name} has not recorded their intake of <strong>${log.medication.name} (${log.medication.dosage})</strong>, which was scheduled at ${new Date(log.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p><p>Please check in with them to ensure their well-being.</p>`,
          });

          result.familyEscalationsSent++;
        }
      }
    }
  }

  // D. Escalation Tier 2: Doctor Alert (Chronic Non-Adherence: 3+ missed doses in last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const activePatients = await prisma.user.findMany({
    where: { role: "PATIENT" },
    include: {
      doctorLinksAsPatient: {
        where: { status: "ACTIVE" },
        include: { doctor: true },
      },
    },
  });

  for (const patient of activePatients) {
    const missedCount = await prisma.intakeLog.count({
      where: {
        medication: { patientId: patient.id },
        status: "MISSED",
        scheduledAt: { gte: sevenDaysAgo },
      },
    });

    if (missedCount >= 3) {
      // Check if a doctor alert was already sent in the past 24 hours to avoid spamming
      const oneDayAgo = new Date(now);
      oneDayAgo.setHours(now.getHours() - 24);

      const recentDoctorAlert = await prisma.reminder.findFirst({
        where: {
          recipientRole: "DOCTOR",
          type: "ESCALATION",
          createdAt: { gte: oneDayAgo },
          medication: { patientId: patient.id },
        },
      });

      if (!recentDoctorAlert && patient.doctorLinksAsPatient.length > 0) {
        const anyPatientMed = await prisma.medication.findFirst({
          where: { patientId: patient.id },
        });

        if (anyPatientMed) {
          for (const link of patient.doctorLinksAsPatient) {
            const message = `Clinical Escalation: Patient ${patient.name} has recorded ${missedCount} missed doses in the past 7 days. Adherence intervention recommended.`;

            await prisma.reminder.create({
              data: {
                medicationId: anyPatientMed.id,
                type: "ESCALATION",
                offsetMinutes: 0,
                channel: "INAPP",
                status: "SENT",
                recipientRole: "DOCTOR",
                message,
                sentAt: now,
              },
            });

            await sendEmailNotification({
              to: link.doctor.email,
              subject: `Clinical Alert: Adherence Drop for ${patient.name}`,
              html: `<p>Dr. ${link.doctor.name},</p><p>Patient <strong>${patient.name}</strong> has missed <strong>${missedCount} scheduled doses</strong> over the last 7 days.</p><p>Please review their regimen in the MedTrack Doctor Portal.</p>`,
            });

            result.doctorEscalationsSent++;
          }
        }
      }
    }
  }

  return result;
}
