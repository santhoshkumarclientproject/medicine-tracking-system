import { prisma } from "@/lib/prisma";

export interface DrugWarning {
  drugA: string;
  drugB: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  description: string;
}

export async function checkDrugInteractions(
  candidateDrugName: string,
  patientId: string
): Promise<DrugWarning[]> {
  // Fetch active medications of the patient
  const activeMeds = await prisma.medication.findMany({
    where: {
      patientId,
      status: "ACTIVE",
    },
    select: { name: true },
  });

  const warnings: DrugWarning[] = [];
  const candidateLower = candidateDrugName.toLowerCase().trim();

  // Reference checks
  const allInteractions = await prisma.drugInteraction.findMany();

  for (const med of activeMeds) {
    const medLower = med.name.toLowerCase().trim();
    if (candidateLower === medLower) continue;

    for (const item of allInteractions) {
      const aLower = item.drugA.toLowerCase();
      const bLower = item.drugB.toLowerCase();

      // Check if candidate matches A and existing med matches B, or vice-versa
      const match1 =
        (candidateLower.includes(aLower) || aLower.includes(candidateLower)) &&
        (medLower.includes(bLower) || bLower.includes(medLower));

      const match2 =
        (candidateLower.includes(bLower) || bLower.includes(candidateLower)) &&
        (medLower.includes(aLower) || aLower.includes(medLower));

      if (match1 || match2) {
        warnings.push({
          drugA: item.drugA,
          drugB: item.drugB,
          severity: item.severity as "MILD" | "MODERATE" | "SEVERE",
          description: item.description,
        });
      }
    }
  }

  return warnings;
}
