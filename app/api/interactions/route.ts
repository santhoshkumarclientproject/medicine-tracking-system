import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkDrugInteractions } from "@/lib/drug-interactions";
import { checkInteractionSchema } from "@/lib/zod-schemas";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  try {
    const body = await req.json();
    const parsed = checkInteractionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const targetPatientId = parsed.data.patientId || user.id;
    const warnings = await checkDrugInteractions(parsed.data.candidateDrug, targetPatientId);

    return NextResponse.json({ warnings });
  } catch (err) {
    console.error("Interaction check error:", err);
    return NextResponse.json({ error: "Failed to check interactions" }, { status: 500 });
  }
}
