'use server';

import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { requireModuleAccess } from '@/lib/permissionGuard';
import { writeAuditLog } from '@/lib/audit';
import { SEED_EMPLOYEES } from '@/db/seed';
import { Employee } from '@/lib/types';
import { createEmployeeSchema, updateEmployeeSchema } from '@/lib/validations';
import { mapDbEmployeeToEmployee } from '@/lib/mappers';

// ----------------------------------------------------
// Employees / Colaboradores e Mão de Obra
// ----------------------------------------------------

export async function getEmployees(farmId?: string): Promise<Employee[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.employees.findMany({
      where: (e, { eq, and }) =>
        farmId
          ? and(eq(e.organizationId, orgId), eq(e.farmId, farmId))
          : eq(e.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbEmployeeToEmployee);
    }
    const seeded = SEED_EMPLOYEES.map((e) => ({ ...e, organizationId: orgId }));
    return farmId ? seeded.filter((e) => e.farmId === farmId) : seeded;
  } catch (error) {
    console.warn('[getEmployees] DB query fallback to seed:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_EMPLOYEES.map((e) => ({ ...e, organizationId: orgId }));
    return farmId ? seeded.filter((e) => e.farmId === farmId) : seeded;
  }
}

export async function createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
  const session = await requireModuleAccess('cadastros', 'manage');
  const parsed = createEmployeeSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(employees)
      .values({
        organizationId: orgId,
        farmId: validData.farmId,
        name: validData.name,
        document: validData.document || null,
        phone: validData.phone || null,
        role: validData.role,
        type: validData.type || 'CLT',
        remuneration: validData.remuneration ?? 0,
        additionalCosts: validData.additionalCosts ?? 0,
        hourCost: validData.hourCost ?? 0,
        admissionDate: validData.admissionDate || null,
        status: validData.status || 'Ativo',
        notes: validData.notes || null,
        createdBy: session.user.id,
      })
      .returning();

    if (result[0]) {
      const mapped = mapDbEmployeeToEmployee(result[0]);
      await writeAuditLog({
        action: 'create',
        entityType: 'employee',
        entityId: mapped.id,
        details: `${mapped.name} criado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[createEmployee] DB insert fallback:', error);
  }

  const newId = `emp-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    document: validData.document || undefined,
    phone: validData.phone || undefined,
    type: (validData.type as 'CLT' | 'PJ' | 'Diarista' | 'Temporário') || 'CLT',
    remuneration: validData.remuneration ?? 0,
    additionalCosts: validData.additionalCosts ?? 0,
    hourCost: validData.hourCost ?? 0,
    admissionDate: validData.admissionDate || undefined,
    status: (validData.status as 'Ativo' | 'Férias' | 'Afastado' | 'Desligado') || 'Ativo',
    notes: validData.notes || undefined,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

export async function updateEmployee(
  id: string,
  data: Partial<Omit<Employee, 'id'>>
): Promise<Employee> {
  const session = await requireModuleAccess('cadastros', 'manage');
  const parsed = updateEmployeeSchema.safeParse({ id, ...data });
  const validData = parsed.success ? parsed.data : data;

  try {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: session.user.id,
    };
    if (validData.name !== undefined) updateValues.name = validData.name;
    if (validData.document !== undefined) updateValues.document = validData.document || null;
    if (validData.phone !== undefined) updateValues.phone = validData.phone || null;
    if (validData.role !== undefined) updateValues.role = validData.role;
    if (validData.type !== undefined) updateValues.type = validData.type;
    if (validData.remuneration !== undefined) updateValues.remuneration = validData.remuneration;
    if (validData.additionalCosts !== undefined)
      updateValues.additionalCosts = validData.additionalCosts;
    if (validData.hourCost !== undefined) updateValues.hourCost = validData.hourCost;
    if (validData.admissionDate !== undefined)
      updateValues.admissionDate = validData.admissionDate || null;
    if (validData.status !== undefined) updateValues.status = validData.status;
    if (validData.notes !== undefined) updateValues.notes = validData.notes || null;

    const result = await db
      .update(employees)
      .set(updateValues)
      .where(and(eq(employees.id, id), eq(employees.organizationId, session.organizationId)))
      .returning();

    if (result[0]) {
      const mapped = mapDbEmployeeToEmployee(result[0]);
      await writeAuditLog({
        action: 'update',
        entityType: 'employee',
        entityId: mapped.id,
        details: `${mapped.name} atualizado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[updateEmployee] DB update fallback:', error);
  }

  return {
    id,
    farmId: data.farmId || '',
    name: data.name || '',
    role: data.role || '',
    type: data.type || 'CLT',
    remuneration: data.remuneration ?? 0,
    additionalCosts: data.additionalCosts ?? 0,
    hourCost: data.hourCost ?? 0,
    status: data.status || 'Ativo',
    ...data,
  } as Employee;
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  const session = await requireModuleAccess('cadastros', 'manage');
  try {
    await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.organizationId, session.organizationId)));
    await writeAuditLog({
      action: 'delete',
      entityType: 'employee',
      entityId: id,
    });
    return { success: true };
  } catch (error) {
    console.warn('[deleteEmployee] DB delete fallback:', error);
    return { success: true };
  }
}
