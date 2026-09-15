import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPatientAccess, logAudit } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const url = new URL(req.url);
  const targetPatientId = url.searchParams.get("patientId") || user.id;
  const format = url.searchParams.get("format") || "json";

  const access = await checkPatientAccess(user.id, user.role, targetPatientId);
  if (!access.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const patient = await prisma.user.findUnique({
      where: { id: targetPatientId },
      include: {
        patientProfile: true,
        patientMeds: {
          include: { prescribedBy: { select: { name: true } } },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const logs = await prisma.intakeLog.findMany({
      where: { medication: { patientId: targetPatientId } },
      include: { medication: true },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });

    const totalLogs = logs.length;
    const takenLogs = logs.filter((l) => l.status === "TAKEN").length;
    const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

    await logAudit({
      actorId: user.id,
      action: "EXPORT_ADHERENCE_REPORT",
      targetType: "PATIENT",
      targetId: targetPatientId,
      metadata: { format, adherenceRate },
    });

    if (format === "csv") {
      let csvContent = "MedTrack Clinical Adherence Report\n";
      csvContent += `Patient: ${patient.name}\n`;
      csvContent += `Generated: ${new Date().toISOString()}\n`;
      csvContent += `Overall Adherence Rate: ${adherenceRate}%\n\n`;
      csvContent += "Medication,Dosage,Frequency,Scheduled At,Taken At,Status,Logged By\n";

      for (const log of logs) {
        csvContent += `"${log.medication.name}","${log.medication.dosage}","${log.medication.frequency}","${new Date(log.scheduledAt).toISOString()}","${log.takenAt ? new Date(log.takenAt).toISOString() : "N/A"}","${log.status}","${log.source}"\n`;
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="MedTrack_Report_${patient.name.replace(/\s+/g, "_")}.csv"`,
        },
      });
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        profile: patient.patientProfile,
      },
      summary: {
        totalDoses: totalLogs,
        takenDoses: takenLogs,
        adherenceRate,
        generatedAt: new Date().toISOString(),
      },
      medications: patient.patientMeds,
      logs,
    });
  } catch (err) {
    console.error("Export report error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
