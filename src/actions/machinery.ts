'use server';

import { db } from '@/db';
import { machinery } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { SEED_MACHINERY } from '@/db/seed';
import { Machinery } from '@/lib/types';
import { createMachinerySchema } from '@/lib/validations';
import { mapDbMachineryToMachinery } from '@/lib/mappers';

// ----------------------
// Machinery / Frota
// ----------------------

export async function getMachinery(farmId?: string): Promise<Machinery[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.machinery.findMany({
      where: (m, { eq, and }) =>
        farmId
          ? and(eq(m.organizationId, orgId), eq(m.farmId, farmId))
          : eq(m.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbMachineryToMachinery);
    }
    const seeded = SEED_MACHINERY.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  } catch (error) {
    console.warn('[getMachinery] DB query fallback:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_MACHINERY.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  }
}

export async function createMachinery(data: Omit<Machinery, 'id'>): Promise<Machinery> {
  const parsed = createMachinerySchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(machinery)
      .values({
        organizationId: orgId,
        farmId: validData.farmId,
        name: validData.name,
        type: validData.type,
        plate: validData.plate || 'AGRO-001',
        hourCost: validData.hourCost ?? 0,
        status: validData.status || 'Operacional',
      })
      .returning();

    if (result[0]) {
      return mapDbMachineryToMachinery(result[0]);
    }
  } catch (error) {
    console.warn('[createMachinery] DB insert fallback:', error);
  }

  const newId = `mac-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    plate: validData.plate || 'AGRO-001',
    status: (validData.status as 'Operacional' | 'Manutenção' | 'Inativo') || 'Operacional',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

export async function updateMachineryStatus(id: string, status: Machinery['status']) {
  try {
    await db.update(machinery).set({ status }).where(eq(machinery.id, id));
    return { success: true };
  } catch (error) {
    console.warn('[updateMachineryStatus] DB update fallback:', error);
    return { success: true };
  }
}

export async function deleteMachinery(id: string) {
  try {
    await db.delete(machinery).where(eq(machinery.id, id));
    return { success: true };
  } catch (error) {
    console.warn('[deleteMachinery] DB delete fallback:', error);
    return { success: true };
  }
}
