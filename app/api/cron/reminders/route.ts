import { NextRequest, NextResponse } from "next/server";
import { processReminderAndEscalations } from "@/lib/cron/reminder-engine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET || "medtrack-cron-escalation-secret-999";

    // Allow cron secret header, query param, or authenticated session
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");

    const session = await getServerSession(authOptions);
    const isSecretValid = authHeader === `Bearer ${secret}` || querySecret === secret;
    const isUserAuthorized = session?.user && ["DOCTOR", "ADMIN", "PATIENT"].includes((session.user as any).role);

    if (!isSecretValid && !isUserAuthorized) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const result = await processReminderAndEscalations();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: result,
    });
  } catch (err) {
    console.error("Cron reminder error:", err);
    return NextResponse.json({ error: "Failed to process reminders", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
