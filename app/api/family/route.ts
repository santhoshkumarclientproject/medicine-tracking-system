import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { familyInviteSchema, familyRespondSchema } from "@/lib/zod-schemas";
import { logAudit } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  try {
    if (user.role === "PATIENT") {
      const connections = await prisma.familyConnection.findMany({
        where: { patientId: user.id },
        include: { familyUser: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ connections });
    }

    if (user.role === "FAMILY") {
      const connections = await prisma.familyConnection.findMany({
        where: {
          OR: [{ familyUserId: user.id }, { invitedEmail: user.email }],
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              patientProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ connections });
    }

    return NextResponse.json({ connections: [] });
  } catch (err) {
    console.error("Family connections error:", err);
    return NextResponse.json({ error: "Failed to fetch family connections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  if (user.role !== "PATIENT") {
    return NextResponse.json({ error: "Only patients can invite family members" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = familyInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const { invitedEmail, permissionLevel, isEmergencyContact } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitedEmail.toLowerCase().trim() },
    });

    const connection = await prisma.familyConnection.create({
      data: {
        patientId: user.id,
        familyUserId: existingUser?.id || null,
        invitedEmail: invitedEmail.toLowerCase().trim(),
        permissionLevel,
        isEmergencyContact,
        status: existingUser ? "ACCEPTED" : "PENDING",
      },
    });

    await logAudit({
      actorId: user.id,
      action: "INVITE_FAMILY_MEMBER",
      targetType: "FAMILY_CONNECTION",
      targetId: connection.id,
      metadata: { invitedEmail, permissionLevel, isEmergencyContact },
    });

    return NextResponse.json({ success: true, connection });
  } catch (err) {
    console.error("Invite family error:", err);
    return NextResponse.json({ error: "Failed to invite family member" }, { status: 500 });
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
    const { connectionId, status, permissionLevel, isEmergencyContact } = body;

    const existing = await prisma.familyConnection.findUnique({
      where: { id: connectionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Only the patient or invited family user can respond
    const isPatient = existing.patientId === user.id;
    const isInvitedFamily = existing.familyUserId === user.id || existing.invitedEmail === user.email;

    if (!isPatient && !isInvitedFamily) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.familyConnection.update({
      where: { id: connectionId },
      data: {
        status: status || existing.status,
        permissionLevel: isPatient && permissionLevel ? permissionLevel : existing.permissionLevel,
        isEmergencyContact: isPatient && isEmergencyContact !== undefined ? isEmergencyContact : existing.isEmergencyContact,
        familyUserId: isInvitedFamily ? user.id : existing.familyUserId,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_FAMILY_CONNECTION",
      targetType: "FAMILY_CONNECTION",
      targetId: updated.id,
      metadata: { status: updated.status, permissionLevel: updated.permissionLevel },
    });

    return NextResponse.json({ success: true, connection: updated });
  } catch (err) {
    console.error("Update family connection error:", err);
    return NextResponse.json({ error: "Failed to update family connection" }, { status: 500 });
  }
}
