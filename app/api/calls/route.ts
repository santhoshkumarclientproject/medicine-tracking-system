import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  try {
    const { action, recipientId, notes, callDuration } = await req.json();

    if (action === "START_CALL") {
      await logAudit({
        actorId: user.id,
        action: "START_TELEHEALTH_CALL",
        targetType: "USER",
        targetId: recipientId || user.id,
        metadata: { caller: user.name, role: user.role, initiatedAt: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, sessionId: `call_${Date.now()}` });
    }

    if (action === "END_CALL") {
      await logAudit({
        actorId: user.id,
        action: "END_TELEHEALTH_CALL",
        targetType: "USER",
        targetId: recipientId || user.id,
        metadata: { duration: callDuration || "0m", notes: notes || null },
      });

      // If clinical notes provided, save to messages table as clinical consultation note
      if (notes && notes.trim()) {
        await prisma.message.create({
          data: {
            senderId: user.id,
            recipientId: recipientId || user.id,
            patientId: user.role === "PATIENT" ? user.id : recipientId,
            body: `📋 [Telehealth Consultation Note - ${new Date().toLocaleDateString()}]:\n${notes}`,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Call API error:", err);
    return NextResponse.json({ error: "Call action failed" }, { status: 500 });
  }
}
