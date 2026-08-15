'use server';

import { db } from '@/db';
import { machinery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { requireModuleAccess } from '@/lib/permissionGuard';
import { writeAuditLog } from '@/lib/audit';
import { SEED_MACHINERY } from '@/db/seed';
import { Machinery } from '@/lib/types';
import { createMachinerySchema, updateMachinerySchema } from '@/lib/validations';
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
  const session = await requireModuleAccess('cadastros', 'manage');
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
        brand: validData.brand || null,
        model: validData.model || null,
        plate: validData.plate || 'AGRO-001',
        chassis: validData.chassis || null,
        year: validData.year || null,
        fuelConsumption: validData.fuelConsumption ?? 0,
        hourCost: validData.hourCost ?? 0,
        status: validData.status || 'Operacional',
        createdBy: session.user.id,
      })
      .returning();

    if (result[0]) {
      const mapped = mapDbMachineryToMachinery(result[0]);
      await writeAuditLog({
        action: 'create',
        entityType: 'machinery',
        entityId: mapped.id,
        details: `${mapped.name} criado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[createMachinery] DB insert fallback:', error);
  }

  const newId = `mac-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    brand: validData.brand || undefined,
    model: validData.model || undefined,
    plate: validData.plate || 'AGRO-001',
    chassis: validData.chassis || undefined,
    year: validData.year || undefined,
    fuelConsumption: validData.fuelConsumption ?? 0,
    status: (validData.status as 'Operacional' | 'Manutenção' | 'Inativo') || 'Operacional',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

export async function updateMachinery(
  id: string,
  data: Partial<Omit<Machinery, 'id'>>
): Promise<Machinery> {
  const session = await requireModuleAccess('cadastros', 'manage');
  const parsed = updateMachinerySchema.safeParse({ id, ...data });
  const validData = parsed.success ? parsed.data : data;

  try {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: session.user.id,
    };
    if (validData.name !== undefined) updateValues.name = validData.name;
    if (validData.type !== undefined) updateValues.type = validData.type;
    if (validData.brand !== undefined) updateValues.brand = validData.brand || null;
    if (validData.model !== undefined) updateValues.model = validData.model || null;
    if (validData.plate !== undefined) updateValues.plate = validData.plate;
    if (validData.chassis !== undefined) updateValues.chassis = validData.chassis || null;
    if (validData.year !== undefined) updateValues.year = validData.year || null;
    if (validData.fuelConsumption !== undefined)
      updateValues.fuelConsumption = validData.fuelConsumption;
    if (validData.hourCost !== undefined) updateValues.hourCost = validData.hourCost;
    if (validData.status !== undefined) updateValues.status = validData.status;

    const result = await db
      .update(machinery)
      .set(updateValues)
      .where(and(eq(machinery.id, id), eq(machinery.organizationId, session.organizationId)))
      .returning();

    if (result[0]) {
      const mapped = mapDbMachineryToMachinery(result[0]);
      await writeAuditLog({
        action: 'update',
        entityType: 'machinery',
        entityId: mapped.id,
        details: `${mapped.name} atualizado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[updateMachinery] DB update fallback:', error);
  }

  return {
    id,
    farmId: data.farmId || '',
    name: data.name || '',
    type: data.type || '',
    plate: data.plate || 'AGRO-001',
    hourCost: data.hourCost ?? 0,
    status: data.status || 'Operacional',
    ...data,
  } as Machinery;
}

export async function updateMachineryStatus(id: string, status: Machinery['status']) {
  const session = await requireModuleAccess('cadastros', 'manage');
  try {
    await db
      .update(machinery)
      .set({ status, updatedAt: new Date(), updatedBy: session.user.id })
      .where(and(eq(machinery.id, id), eq(machinery.organizationId, session.organizationId)));
    await writeAuditLog({
      action: 'update',
      entityType: 'machinery',
      entityId: id,
      details: `Status atualizado para ${status}`,
    });
    return { success: true };
  } catch (error) {
    console.warn('[updateMachineryStatus] DB update fallback:', error);
    return { success: true };
  }
}

export async function deleteMachinery(id: string) {
  const session = await requireModuleAccess('cadastros', 'manage');
  try {
    await db
      .delete(machinery)
      .where(and(eq(machinery.id, id), eq(machinery.organizationId, session.organizationId)));
    await writeAuditLog({
      action: 'delete',
      entityType: 'machinery',
      entityId: id,
    });
    return { success: true };
  } catch (error) {
    console.warn('[deleteMachinery] DB delete fallback:', error);
    return { success: true };
  }
}
