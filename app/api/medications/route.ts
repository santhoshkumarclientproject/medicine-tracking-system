import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { medicationSchema, updateMedicationStatusSchema } from "@/lib/zod-schemas";
import { checkPatientAccess, canEditPatientMedications, logAudit } from "@/lib/permissions";
import { checkDrugInteractions } from "@/lib/drug-interactions";
import { generateDailyIntakeLogs } from "@/lib/cron/reminder-engine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const url = new URL(req.url);
  const targetPatientId = url.searchParams.get("patientId") || user.id;

  const access = await checkPatientAccess(user.id, user.role, targetPatientId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason || "Forbidden" }, { status: 403 });
  }

  try {
    const medications = await prisma.medication.findMany({
      where: { patientId: targetPatientId },
      include: {
        prescribedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    await logAudit({
      actorId: user.id,
      action: "VIEW_MEDICATIONS",
      targetType: "PATIENT",
      targetId: targetPatientId,
    });

    return NextResponse.json({ medications });
  } catch (err) {
    console.error("Fetch medications error:", err);
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  try {
    const body = await req.json();
    const parsed = medicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, dosage, frequency, timesOfDay, startDate, endDate, notes, patientId } =
      parsed.data;
    const targetPatientId = patientId || user.id;

    const canEdit = await canEditPatientMedications(user.id, user.role, targetPatientId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "You do not have permission to add medications for this patient." },
        { status: 403 }
      );
    }

    // Check drug interactions before adding
    const warnings = await checkDrugInteractions(name, targetPatientId);

    const medication = await prisma.medication.create({
      data: {
        patientId: targetPatientId,
        prescribedById: user.role === "DOCTOR" ? user.id : null,
        name,
        dosage,
        frequency,
        timesOfDay: JSON.stringify(timesOfDay),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: "ACTIVE",
        notes,
      },
    });

    // Auto-generate today's intake logs for the new medication
    await generateDailyIntakeLogs();

    // If doctor prescribed for patient, create in-app reminder/notification for the patient
    if (user.role === "DOCTOR" && targetPatientId !== user.id) {
      await prisma.reminder.create({
        data: {
          medicationId: medication.id,
          type: "PRIMARY",
          channel: "INAPP",
          recipientRole: "PATIENT",
          message: `Dr. ${user.name} has prescribed new medication: ${name} (${dosage}).`,
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    await logAudit({
      actorId: user.id,
      action: "CREATE_MEDICATION",
      targetType: "MEDICATION",
      targetId: medication.id,
      metadata: { name, dosage, patientId: targetPatientId, warningsCount: warnings.length },
    });

    return NextResponse.json({
      success: true,
      medication,
      warnings,
    });
  } catch (err) {
    console.error("Create medication error:", err);
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  try {
    const body = await req.json();
    const parsed = updateMedicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status update data" }, { status: 400 });
    }

    const { medicationId, status, reason } = parsed.data;

    const existing = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const canEdit = await canEditPatientMedications(user.id, user.role, existing.patientId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify this medication." },
        { status: 403 }
      );
    }

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data: {
        status,
        notes: reason ? `${existing.notes || ""}\nStatus change (${status}): ${reason}` : existing.notes,
      },
    });

    // If doctor changed status, notify patient
    if (user.role === "DOCTOR") {
      await prisma.reminder.create({
        data: {
          medicationId: updated.id,
          type: "PRIMARY",
          channel: "INAPP",
          recipientRole: "PATIENT",
          message: `Dr. ${user.name} has updated ${updated.name} to ${status}. Reason: ${reason || "Clinical adjustment."}`,
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    await logAudit({
      actorId: user.id,
      action: `UPDATE_MEDICATION_STATUS_${status}`,
      targetType: "MEDICATION",
      targetId: updated.id,
      metadata: { previousStatus: existing.status, newStatus: status, reason },
    });

    return NextResponse.json({ success: true, medication: updated });
  } catch (err) {
    console.error("Update medication status error:", err);
    return NextResponse.json({ error: "Failed to update medication status" }, { status: 500 });
  }
}
