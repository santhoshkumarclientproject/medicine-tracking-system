import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/zod-schemas";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId") || user.id;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { recipientId: user.id },
          { patientId: patientId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Fetch messages error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
    }

    const { recipientId, patientId, body: messageBody } = parsed.data;

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        patientId: patientId || user.id,
        body: messageBody,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
