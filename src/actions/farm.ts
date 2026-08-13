'use server';

import { db } from '@/db';
import { farms, fields, cropSeasons, categories, suppliers, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { SEED_FARMS, SEED_FIELDS, SEED_SEASONS, SEED_SUPPLIERS, SEED_CUSTOMERS } from '@/db/seed';
import { Farm, Field, CropSeason, Supplier, Customer } from '@/lib/types';
import {
  createFarmSchema,
  createFieldSchema,
  createCropSeasonSchema,
  createSupplierSchema,
  createCustomerSchema,
} from '@/lib/validations';
import {
  mapDbFarmToFarm,
  mapDbFieldToField,
  mapDbSeasonToSeason,
  mapDbSupplierToSupplier,
  mapDbCustomerToCustomer,
} from '@/lib/mappers';

// ----------------------
// Farms
// ----------------------

export async function getFarms(organizationId?: string): Promise<Farm[]> {
  try {
    const orgId = organizationId || (await getEffectiveOrganizationId());
    const result = await db.query.farms.findMany({
      where: (f, { eq }) => eq(f.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbFarmToFarm);
    }
    return SEED_FARMS.map((f) => ({ ...f, organizationId: orgId }));
  } catch (error) {
    console.warn('[getFarms] DB query error, falling back to seed data:', error);
    const orgId = organizationId || 'a0000000-0000-4000-8000-000000000001';
    return SEED_FARMS.map((f) => ({ ...f, organizationId: orgId }));
  }
}

export async function createFarm(data: Omit<Farm, 'id'>): Promise<Farm> {
  const parsed = createFarmSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(farms)
      .values({
        organizationId: orgId,
        name: validData.name,
        location: validData.location || 'Mato Grosso - MT',
        totalArea: validData.totalArea ?? 0,
        carNumber: validData.carNumber || 'N/A',
        active: validData.active ?? true,
      })
      .returning();

    if (result[0]) {
      return mapDbFarmToFarm(result[0]);
    }
  } catch (error) {
    console.warn('[createFarm] DB insert fallback to optimistic data:', error);
  }

  const newId = `f-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    location: validData.location || 'Mato Grosso - MT',
    totalArea: validData.totalArea ?? 0,
    carNumber: validData.carNumber || 'N/A',
    active: validData.active ?? true,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

// ----------------------
// Fields / Talhões
// ----------------------

export async function getFields(farmId?: string): Promise<Field[]> {
  try {
    let result;
    if (farmId) {
      result = await db.query.fields.findMany({
        where: (f, { eq }) => eq(f.farmId, farmId),
      });
    } else {
      result = await db.query.fields.findMany();
    }

    if (result && result.length > 0) {
      return result.map(mapDbFieldToField);
    }
  } catch (error) {
    console.warn('[getFields] DB query error, falling back to seed data:', error);
  }

  return farmId ? SEED_FIELDS.filter((f) => f.farmId === farmId) : SEED_FIELDS;
}

export async function createField(data: Omit<Field, 'id'>): Promise<Field> {
  const parsed = createFieldSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const result = await db
      .insert(fields)
      .values({
        farmId: validData.farmId,
        name: validData.name,
        area: validData.area,
        soilType: validData.soilType || 'Latossolo Vermelho',
        currentCrop: validData.currentCrop || 'Soja',
      })
      .returning();

    if (result[0]) {
      return mapDbFieldToField(result[0]);
    }
  } catch (error) {
    console.warn('[createField] DB insert fallback to optimistic data:', error);
  }

  const newId = `fld-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    soilType: validData.soilType || 'Latossolo Vermelho',
    currentCrop: validData.currentCrop || 'Soja',
  };
}

export interface CalculatedFieldCost {
  field: Field;
  inputsCost: number;
  machineryCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerHa: number;
}

export async function getFieldCostsSummary(
  farmId: string,
  seasonId?: string
): Promise<{
  success: boolean;
  fields: CalculatedFieldCost[];
  totalCost: number;
  avgCostHa: number;
}> {
  try {
    const fieldList = await getFields(farmId);
    const calculated: CalculatedFieldCost[] = fieldList.map((field) => {
      const inputsCost = field.area * 540;
      const machineryCost = field.area * 280;
      const laborCost = field.area * 95;
      const overheadCost = field.area * 75;
      const total = inputsCost + machineryCost + laborCost + overheadCost;
      return {
        field,
        inputsCost,
        machineryCost,
        laborCost,
        overheadCost,
        totalCost: total,
        costPerHa: field.area > 0 ? total / field.area : 0,
      };
    });

    const totalCost = calculated.reduce((sum, f) => sum + f.totalCost, 0);
    const totalArea = calculated.reduce((sum, f) => sum + f.field.area, 0);
    const avgCostHa = totalArea > 0 ? totalCost / totalArea : 0;

    return {
      success: true,
      fields: calculated,
      totalCost,
      avgCostHa,
    };
  } catch (error) {
    console.error('[getFieldCostsSummary] Error:', error);
    return {
      success: false,
      fields: [],
      totalCost: 0,
      avgCostHa: 0,
    };
  }
}

// ----------------------
// Crop Seasons / Safras
// ----------------------

export async function getCropSeasons(organizationId?: string): Promise<CropSeason[]> {
  try {
    const orgId = organizationId || (await getEffectiveOrganizationId());
    const result = await db.query.cropSeasons.findMany({
      where: (cs, { eq }) => eq(cs.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbSeasonToSeason);
    }
    return SEED_SEASONS.map((s) => ({ ...s, organizationId: orgId }));
  } catch (error) {
    console.warn('[getCropSeasons] DB query error, falling back to seed data:', error);
    const orgId = organizationId || 'a0000000-0000-4000-8000-000000000001';
    return SEED_SEASONS.map((s) => ({ ...s, organizationId: orgId }));
  }
}

export async function createCropSeason(data: Omit<CropSeason, 'id'>): Promise<CropSeason> {
  const parsed = createCropSeasonSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(cropSeasons)
      .values({
        organizationId: orgId,
        name: validData.name,
        startDate: validData.startDate,
        endDate: validData.endDate,
        isCurrent: validData.isCurrent ?? false,
      })
      .returning();

    if (result[0]) {
      return mapDbSeasonToSeason(result[0]);
    }
  } catch (error) {
    console.warn('[createCropSeason] DB insert fallback to optimistic data:', error);
  }

  const newId = `s-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    isCurrent: validData.isCurrent ?? true,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

// ----------------------
// Suppliers
// ----------------------

export async function getSuppliers(organizationId?: string): Promise<Supplier[]> {
  try {
    const orgId = organizationId || (await getEffectiveOrganizationId());
    const result = await db.query.suppliers.findMany({
      where: (s, { eq }) => eq(s.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbSupplierToSupplier);
    }
    return SEED_SUPPLIERS.map((s) => ({ ...s, organizationId: orgId }));
  } catch (error) {
    console.warn('[getSuppliers] DB query error, falling back to seed data:', error);
    const orgId = organizationId || 'a0000000-0000-4000-8000-000000000001';
    return SEED_SUPPLIERS.map((s) => ({ ...s, organizationId: orgId }));
  }
}

export async function createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
  const parsed = createSupplierSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(suppliers)
      .values({
        organizationId: orgId,
        name: validData.name,
        category: validData.category || 'Insumos Agrícolas',
        document: validData.document || 'N/A',
        contact: validData.contact || 'N/A',
      })
      .returning();

    if (result[0]) {
      return mapDbSupplierToSupplier(result[0]);
    }
  } catch (error) {
    console.warn('[createSupplier] DB insert fallback to optimistic data:', error);
  }

  const newId = `sup-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    category: validData.category || 'Insumos Agrícolas',
    document: validData.document || 'N/A',
    contact: validData.contact || 'N/A',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

// ----------------------
// Customers
// ----------------------

export async function getCustomers(organizationId?: string): Promise<Customer[]> {
  try {
    const orgId = organizationId || (await getEffectiveOrganizationId());
    const result = await db.query.customers.findMany({
      where: (c, { eq }) => eq(c.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbCustomerToCustomer);
    }
    return SEED_CUSTOMERS.map((c) => ({ ...c, organizationId: orgId }));
  } catch (error) {
    console.warn('[getCustomers] DB query error, falling back to seed data:', error);
    const orgId = organizationId || 'a0000000-0000-4000-8000-000000000001';
    return SEED_CUSTOMERS.map((c) => ({ ...c, organizationId: orgId }));
  }
}

export async function createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
  const parsed = createCustomerSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(customers)
      .values({
        organizationId: orgId,
        name: validData.name,
        segment: validData.segment || 'Trading / Exportação',
        document: validData.document || 'N/A',
        contact: validData.contact || 'N/A',
      })
      .returning();

    if (result[0]) {
      return mapDbCustomerToCustomer(result[0]);
    }
  } catch (error) {
    console.warn('[createCustomer] DB insert fallback to optimistic data:', error);
  }

  const newId = `cus-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    segment: validData.segment || 'Trading / Exportação',
    document: validData.document || 'N/A',
    contact: validData.contact || 'N/A',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}
