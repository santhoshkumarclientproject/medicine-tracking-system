import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  if (user.role !== "DOCTOR" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Doctor role required" }, { status: 403 });
  }

  try {
    const links = await prisma.doctorPatientLink.findMany({
      where: {
        doctorId: user.id,
        status: "ACTIVE",
      },
      include: {
        patient: {
          include: {
            patientMeds: { where: { status: "ACTIVE" } },
            patientProfile: true,
          },
        },
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const patients = await Promise.all(
      links.map(async (link) => {
        const p = link.patient;

        // Calculate past 7 days adherence
        const logs = await prisma.intakeLog.findMany({
          where: {
            medication: { patientId: p.id },
            scheduledAt: { gte: sevenDaysAgo },
          },
        });

        const total = logs.length;
        const taken = logs.filter((l) => l.status === "TAKEN").length;
        const missed = logs.filter((l) => l.status === "MISSED").length;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          adherenceRate: rate,
          missedCount: missed,
          activeMedsCount: p.patientMeds.length,
          status: link.status,
        };
      })
    );

    return NextResponse.json({ patients });
  } catch (err) {
    console.error("Doctor patients fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
