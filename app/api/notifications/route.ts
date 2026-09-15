import { NextRequest, NextResponse } from "next/server";
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

  try {
    let notifications = [];

    if (user.role === "PATIENT") {
      notifications = await prisma.reminder.findMany({
        where: {
          medication: { patientId: user.id },
          recipientRole: "PATIENT",
        },
        include: { medication: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } else if (user.role === "FAMILY") {
      // Find patient links
      const patientLinks = await prisma.familyConnection.findMany({
        where: {
          familyUserId: user.id,
          status: "ACCEPTED",
        },
        select: { patientId: true },
      });
      const patientIds = patientLinks.map((l) => l.patientId);

      notifications = await prisma.reminder.findMany({
        where: {
          medication: { patientId: { in: patientIds } },
          recipientRole: "FAMILY",
        },
        include: {
          medication: {
            include: { patient: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } else if (user.role === "DOCTOR") {
      // Find doctor patient links
      const links = await prisma.doctorPatientLink.findMany({
        where: {
          doctorId: user.id,
          status: "ACTIVE",
        },
        select: { patientId: true },
      });
      const patientIds = links.map((l) => l.patientId);

      notifications = await prisma.reminder.findMany({
        where: {
          medication: { patientId: { in: patientIds } },
          recipientRole: "DOCTOR",
        },
        include: {
          medication: {
            include: { patient: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } else {
      // Admin gets recent escalations
      notifications = await prisma.reminder.findMany({
        include: {
          medication: {
            include: { patient: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reminderId, markAll } = await req.json();

    if (reminderId) {
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "READ" },
      });
    } else if (markAll) {
      // Mark as read for this user's notifications
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = session.user as any;
      if (user.role === "PATIENT") {
        await prisma.reminder.updateMany({
          where: {
            medication: { patientId: user.id },
            recipientRole: "PATIENT",
          },
          data: { status: "READ" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update notification:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
