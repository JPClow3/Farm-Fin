import { describe, it, expect } from 'vitest';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../employees';
import { getMachinery, createMachinery, updateMachinery, deleteMachinery } from '../machinery';
import { createEmployeeSchema, createMachinerySchema } from '@/lib/validations';

describe('Employee Server Actions & Validations', () => {
  it('retrieves employees list with valid schema shape', async () => {
    const employees = await getEmployees();
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0]).toHaveProperty('id');
    expect(employees[0]).toHaveProperty('name');
    expect(employees[0]).toHaveProperty('role');
    expect(employees[0]).toHaveProperty('remuneration');
    expect(employees[0]).toHaveProperty('additionalCosts');
    expect(employees[0]).toHaveProperty('hourCost');
  });

  it('creates an employee with full remuneration and labor cost breakdown', async () => {
    const created = await createEmployee({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Carlos Alberto Ferreira',
      document: '512.981.402-11',
      phone: '(66) 99611-3322',
      role: 'Operador de Pulverizador Autopropelido',
      type: 'CLT',
      remuneration: 4800,
      additionalCosts: 2880,
      hourCost: 34.91,
      admissionDate: '2024-03-01',
      status: 'Ativo',
      notes: 'Experiência com barra de 36 metros e taxa variável.',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Carlos Alberto Ferreira');
    expect(created.role).toBe('Operador de Pulverizador Autopropelido');
    expect(created.remuneration).toBe(4800);
    expect(created.additionalCosts).toBe(2880);
    expect(created.hourCost).toBe(34.91);
    expect(created.type).toBe('CLT');
  });

  it('validates employee input with Zod schema', () => {
    const valid = createEmployeeSchema.safeParse({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Mariana Lima',
      role: 'Assistente Administrativo Rural',
      type: 'CLT',
      remuneration: 3500,
      additionalCosts: 1750,
      hourCost: 23.86,
      status: 'Ativo',
    });
    expect(valid.success).toBe(true);

    const invalid = createEmployeeSchema.safeParse({
      farmId: '',
      name: '',
      role: '',
      remuneration: -100,
    });
    expect(invalid.success).toBe(false);
  });

  it('updates an employee record', async () => {
    const updated = await updateEmployee('emp-00000000-0001', {
      remuneration: 5000,
      additionalCosts: 3000,
      hourCost: 36.36,
      status: 'Férias',
    });

    expect(updated).toBeDefined();
    expect(updated.remuneration).toBe(5000);
    expect(updated.status).toBe('Férias');
  });

  it('deletes an employee', async () => {
    const res = await deleteEmployee('emp-00000000-0005');
    expect(res).toEqual({ success: true });
  });
});

describe('Machinery Actions & Field Completeness', () => {
  it('retrieves machinery including chassis, brand, model, and hourCost', async () => {
    const machines = await getMachinery();
    expect(Array.isArray(machines)).toBe(true);
    expect(machines.length).toBeGreaterThan(0);
    expect(machines[0]).toHaveProperty('hourCost');
    expect(machines[0]).toHaveProperty('plate');
    expect(machines[0]).toHaveProperty('brand');
    expect(machines[0]).toHaveProperty('model');
    expect(machines[0]).toHaveProperty('chassis');
  });

  it('creates machinery with full technical specifications', async () => {
    const created = await createMachinery({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Plantadeira John Deere DB ExactEmerge 24L',
      type: 'Plantadeira / Semeadora',
      brand: 'John Deere',
      model: 'DB 24L ExactEmerge',
      plate: 'AGRO-PL06',
      chassis: '1JDDB24LXE891234',
      year: 2024,
      fuelConsumption: 0,
      hourCost: 180,
      status: 'Operacional',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Plantadeira John Deere DB ExactEmerge 24L');
    expect(created.chassis).toBe('1JDDB24LXE891234');
    expect(created.brand).toBe('John Deere');
    expect(created.hourCost).toBe(180);
  });

  it('validates machinery schema with Zod', () => {
    const valid = createMachinerySchema.safeParse({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Trator Fendt 1050 Vario',
      type: 'Trator Pesado',
      brand: 'Fendt',
      model: '1050 Vario',
      plate: 'AGRO-FD01',
      chassis: 'FDT1050VARIO9981',
      year: 2023,
      hourCost: 450,
      status: 'Operacional',
    });
    expect(valid.success).toBe(true);
  });

  it('updates machinery and deletes machinery', async () => {
    const updated = await updateMachinery('mac-00000000-0001', {
      hourCost: 340,
      status: 'Operacional',
    });
    expect(updated).toBeDefined();
    expect(updated.hourCost).toBe(340);

    const deleted = await deleteMachinery('mac-00000000-0004');
    expect(deleted).toEqual({ success: true });
  });
});
