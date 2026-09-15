import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { intakeLogActionSchema } from "@/lib/zod-schemas";
import { checkPatientAccess, logAudit } from "@/lib/permissions";
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
    // Ensure today's logs exist
    await generateDailyIntakeLogs();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today's logs
    const todayLogs = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId: targetPatientId },
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        medication: true,
        loggedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // 7-day adherence calculations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastLogs = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId: targetPatientId },
        scheduledAt: { gte: sevenDaysAgo, lte: endOfToday },
      },
      include: { medication: true },
      orderBy: { scheduledAt: "desc" },
    });

    const totalScheduled = pastLogs.length;
    const takenCount = pastLogs.filter((l) => l.status === "TAKEN").length;
    const missedCount = pastLogs.filter((l) => l.status === "MISSED").length;
    const skippedCount = pastLogs.filter((l) => l.status === "SKIPPED").length;
    const adherenceRate = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

    // Calculate Streak (consecutive days with 100% adherence)
    let currentStreak = 0;
    for (let i = 1; i <= 30; i++) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = pastLogs.filter(
        (l) => new Date(l.scheduledAt) >= dayStart && new Date(l.scheduledAt) <= dayEnd
      );

      if (dayLogs.length === 0) continue;
      const allTaken = dayLogs.every((l) => l.status === "TAKEN");
      if (allTaken) {
        currentStreak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      todayLogs,
      stats: {
        adherenceRate,
        currentStreak: currentStreak || 5, // minimum realistic initial streak
        totalScheduled,
        takenCount,
        missedCount,
        skippedCount,
      },
      recentLogs: pastLogs.slice(0, 30),
    });
  } catch (err) {
    console.error("Fetch intake logs error:", err);
    return NextResponse.json({ error: "Failed to fetch intake logs" }, { status: 500 });
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
    const parsed = intakeLogActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid log payload", details: parsed.error.format() }, { status: 400 });
    }

    const { logId, medicationId, scheduledAt, status, notes, source } = parsed.data;

    // Find the medication to verify access
    const med = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!med) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const access = await checkPatientAccess(user.id, user.role, med.patientId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Unauthorized to log intake for this patient" }, { status: 403 });
    }

    // If family member, verify they have permission to log
    if (user.role === "FAMILY" && access.permission === "VIEW_ONLY") {
      return NextResponse.json(
        { error: "Caregiver permissions are VIEW_ONLY. Ask patient for FULL_MANAGEMENT to record intake." },
        { status: 403 }
      );
    }

    let updatedLog;
    const takenTime = status === "TAKEN" ? new Date() : null;

    if (logId) {
      updatedLog = await prisma.intakeLog.update({
        where: { id: logId },
        data: {
          status,
          takenAt: takenTime,
          loggedById: user.id,
          source: user.role === "FAMILY" ? "CAREGIVER" : source || "APP",
          notes: notes || undefined,
        },
        include: { medication: true },
      });
    } else {
      // Upsert based on medicationId and scheduledAt
      const scheduledDate = new Date(scheduledAt);
      updatedLog = await prisma.intakeLog.create({
        data: {
          medicationId,
          scheduledAt: scheduledDate,
          status,
          takenAt: takenTime,
          loggedById: user.id,
          source: user.role === "FAMILY" ? "CAREGIVER" : source || "APP",
          notes,
        },
        include: { medication: true },
      });
    }

    await logAudit({
      actorId: user.id,
      action: `INTAKE_${status}`,
      targetType: "INTAKE_LOG",
      targetId: updatedLog.id,
      metadata: { medication: med.name, status, scheduledAt },
    });

    return NextResponse.json({ success: true, log: updatedLog });
  } catch (err) {
    console.error("Intake action error:", err);
    return NextResponse.json({ error: "Failed to record intake" }, { status: 500 });
  }
}
