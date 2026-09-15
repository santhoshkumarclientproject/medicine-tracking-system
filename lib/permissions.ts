import { prisma } from "@/lib/prisma";

export type UserRole = "PATIENT" | "DOCTOR" | "FAMILY" | "ADMIN";
export type FamilyPermission = "VIEW_ONLY" | "ALERTS" | "FULL_MANAGEMENT";

export async function logAudit({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        targetType,
        targetId,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : metadata || null,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

export async function checkPatientAccess(
  accessorId: string,
  accessorRole: string,
  patientId: string
): Promise<{ allowed: boolean; permission?: FamilyPermission; reason?: string }> {
  if (accessorRole === "ADMIN") {
    return { allowed: true };
  }

  if (accessorId === patientId) {
    return { allowed: true, permission: "FULL_MANAGEMENT" };
  }

  if (accessorRole === "DOCTOR") {
    const link = await prisma.doctorPatientLink.findFirst({
      where: {
        doctorId: accessorId,
        patientId: patientId,
        status: "ACTIVE",
      },
    });

    if (link) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Doctor is not actively linked to this patient." };
  }

  if (accessorRole === "FAMILY") {
    const familyLink = await prisma.familyConnection.findFirst({
      where: {
        familyUserId: accessorId,
        patientId: patientId,
        status: "ACCEPTED",
      },
    });

    if (familyLink) {
      return {
        allowed: true,
        permission: familyLink.permissionLevel as FamilyPermission,
      };
    }
    return {
      allowed: false,
      reason: "Family member has not been approved by the patient.",
    };
  }

  return { allowed: false, reason: "Unauthorized access to patient health records." };
}

export async function canEditPatientMedications(
  accessorId: string,
  accessorRole: string,
  patientId: string
): Promise<boolean> {
  const access = await checkPatientAccess(accessorId, accessorRole, patientId);
  if (!access.allowed) return false;

  if (accessorId === patientId) return true;
  if (accessorRole === "DOCTOR") return true;
  if (accessorRole === "ADMIN") return true;
  if (accessorRole === "FAMILY" && access.permission === "FULL_MANAGEMENT") return true;

  return false;
}
