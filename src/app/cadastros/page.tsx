'use client';

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ClayTable } from '../../components/ui/ClayTable';
import { ClayModal } from '../../components/ui/ClayModal';
import { ClayInput } from '../../components/ui/ClayInput';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { Employee, Machinery } from '../../lib/types';
import {
  Home,
  Sprout,
  Wheat,
  Users,
  Tractor,
  Building2,
  Plus,
  MapPin,
  Compass,
  FileText,
  Calendar,
  UserCheck,
  Briefcase,
  DollarSign,
  Edit2,
  Trash2,
  Phone,
  Hash,
  Gauge,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function CadastrosPage() {
  const {
    farms,
    fields,
    seasons,
    suppliers,
    customers,
    machinery,
    employees,
    bankAccounts,
    activeFarmId,
    addField,
    addFarm,
    addCropSeason,
    addSupplier,
    addCustomer,
    addMachinery,
    updateMachinery,
    deleteMachinery,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useFarm();

  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('fazendas');

  // Modals Open/Close
  const [isNewFarmModal, setIsNewFarmModal] = useState(false);
  const [isNewFieldModal, setIsNewFieldModal] = useState(false);
  const [isNewSeasonModal, setIsNewSeasonModal] = useState(false);
  const [isNewSupplierModal, setIsNewSupplierModal] = useState(false);
  const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
  const [isMachineModal, setIsMachineModal] = useState(false);
  const [isEmployeeModal, setIsEmployeeModal] = useState(false);

  // Editing State
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // New Farm State
  const [farmName, setFarmName] = useState('');
  const [farmCnpjCpf, setFarmCnpjCpf] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState('1000');
  const [farmCar, setFarmCar] = useState('MT-5107909-XXXX.XXXX.XXXX');

  // New Field State
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState('300');
  const [fieldSoil, setFieldSoil] = useState('Latossolo Vermelho');
  const [fieldCrop, setFieldCrop] = useState('Soja');
  const [fieldVariety, setFieldVariety] = useState('BRS 580');
  const [fieldCoordinates, setFieldCoordinates] = useState('-12.5428, -55.7214');
  const [fieldPlantingDate, setFieldPlantingDate] = useState('2025-10-15');
  const [fieldExpectedHarvest, setFieldExpectedHarvest] = useState('2026-02-20');

  // New Season State
  const [seasonName, setSeasonName] = useState('Safra 2026/2027');
  const [seasonStartDate, setSeasonStartDate] = useState('2026-09-15');
  const [seasonPlantingDate, setSeasonPlantingDate] = useState('2026-09-20');
  const [seasonExpectedHarvest, setSeasonExpectedHarvest] = useState('2027-02-28');
  const [seasonEndDate, setSeasonEndDate] = useState('2027-06-30');
  const [seasonIsCurrent, setSeasonIsCurrent] = useState(false);

  // New Supplier State
  const [supplierName, setSupplierName] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('Insumos Agrícolas');
  const [supplierDocument, setSupplierDocument] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  // New Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerSegment, setCustomerSegment] = useState('Trading / Exportação');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerContact, setCustomerContact] = useState('');

  // Machine Form State
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('Trator Pesado');
  const [machineBrand, setMachineBrand] = useState('John Deere');
  const [machineModel, setMachineModel] = useState('');
  const [machinePlate, setMachinePlate] = useState('');
  const [machineChassis, setMachineChassis] = useState('');
  const [machineYear, setMachineYear] = useState('2023');
  const [machineFuelConsumption, setMachineFuelConsumption] = useState('35.0');
  const [machineHourCost, setMachineHourCost] = useState('320.00');
  const [machineStatus, setMachineStatus] = useState<string>('Operacional');

  // Employee Form State
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDocument, setEmployeeDocument] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeRole, setEmployeeRole] = useState('Tratorista Sênior');
  const [employeeType, setEmployeeType] = useState('CLT');
  const [employeeRemuneration, setEmployeeRemuneration] = useState('4000.00');
  const [employeeAdditionalCosts, setEmployeeAdditionalCosts] = useState('2400.00');
  const [employeeHourCost, setEmployeeHourCost] = useState('29.09');
  const [employeeAdmissionDate, setEmployeeAdmissionDate] = useState('2024-01-15');
  const [employeeStatus, setEmployeeStatus] = useState('Ativo');
  const [employeeNotes, setEmployeeNotes] = useState('');

  // Open Machine Modal for Create
  const handleOpenNewMachineModal = () => {
    setEditingMachineId(null);
    setMachineName('');
    setMachineType('Trator Pesado');
    setMachineBrand('John Deere');
    setMachineModel('');
    setMachinePlate('');
    setMachineChassis('');
    setMachineYear('2023');
    setMachineFuelConsumption('35.0');
    setMachineHourCost('320.00');
    setMachineStatus('Operacional');
    setIsMachineModal(true);
  };

  // Open Machine Modal for Edit
  const handleOpenEditMachineModal = (m: Machinery) => {
    setEditingMachineId(m.id);
    setMachineName(m.name);
    setMachineType(m.type);
    setMachineBrand(m.brand || 'John Deere');
    setMachineModel(m.model || '');
    setMachinePlate(m.plate || '');
    setMachineChassis(m.chassis || '');
    setMachineYear(m.year ? String(m.year) : '2023');
    setMachineFuelConsumption(m.fuelConsumption !== undefined ? String(m.fuelConsumption) : '0');
    setMachineHourCost(String(m.hourCost || 0));
    setMachineStatus(m.status || 'Operacional');
    setIsMachineModal(true);
  };

  // Open Employee Modal for Create
  const handleOpenNewEmployeeModal = () => {
    setEditingEmployeeId(null);
    setEmployeeName('');
    setEmployeeDocument('');
    setEmployeePhone('');
    setEmployeeRole('Tratorista Sênior');
    setEmployeeType('CLT');
    setEmployeeRemuneration('4000.00');
    setEmployeeAdditionalCosts('2400.00');
    setEmployeeHourCost('29.09');
    setEmployeeAdmissionDate(new Date().toISOString().split('T')[0]);
    setEmployeeStatus('Ativo');
    setEmployeeNotes('');
    setIsEmployeeModal(true);
  };

  // Open Employee Modal for Edit
  const handleOpenEditEmployeeModal = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEmployeeName(emp.name);
    setEmployeeDocument(emp.document || '');
    setEmployeePhone(emp.phone || '');
    setEmployeeRole(emp.role);
    setEmployeeType(emp.type);
    setEmployeeRemuneration(String(emp.remuneration || 0));
    setEmployeeAdditionalCosts(String(emp.additionalCosts || 0));
    setEmployeeHourCost(String(emp.hourCost || 0));
    setEmployeeAdmissionDate(emp.admissionDate || '');
    setEmployeeStatus(emp.status || 'Ativo');
    setEmployeeNotes(emp.notes || '');
    setIsEmployeeModal(true);
  };

  // Auto-calculate hour cost for employee helper
  const handleRecalculateEmployeeHourCost = (rem: string, add: string) => {
    const r = parseFloat(rem.replace(',', '.')) || 0;
    const a = parseFloat(add.replace(',', '.')) || 0;
    const total = r + a;
    const calculated = total > 0 ? (total / 220).toFixed(2) : '0.00';
    setEmployeeHourCost(calculated);
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName) return;
    try {
      await addFarm({
        name: farmName,
        cnpjCpf: farmCnpjCpf || undefined,
        address: farmAddress || undefined,
        location: farmLocation || 'Mato Grosso - MT',
        totalArea: parseFloat(farmArea) || 0,
        carNumber: farmCar,
        active: true,
      });
      addToast({
        type: 'success',
        title: 'Fazenda Cadastrada!',
        message: `${farmName} adicionada com sucesso.`,
      });
      setIsNewFarmModal(false);
      setFarmName('');
      setFarmCnpjCpf('');
      setFarmAddress('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao cadastrar fazenda',
        message: err?.message || 'Não foi possível salvar a propriedade.',
      });
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName) return;
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (fieldCoordinates && fieldCoordinates.includes(',')) {
        const parts = fieldCoordinates.split(',').map((p) => parseFloat(p.trim()));
        if (!isNaN(parts[0])) lat = parts[0];
        if (!isNaN(parts[1])) lng = parts[1];
      }

      await addField({
        farmId: activeFarmId,
        name: fieldName,
        area: parseFloat(fieldArea) || 0,
        soilType: fieldSoil,
        currentCrop: fieldCrop,
        variety: fieldVariety || undefined,
        coordinates: fieldCoordinates || undefined,
        latitude: lat,
        longitude: lng,
        plantingDate: fieldPlantingDate || undefined,
        expectedHarvestDate: fieldExpectedHarvest || undefined,
      });
      addToast({
        type: 'success',
        title: 'Talhão Cadastrado!',
        message: `${fieldName} vinculado à fazenda ativa com coordenadas GPS.`,
      });
      setIsNewFieldModal(false);
      setFieldName('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao cadastrar talhão',
        message: err?.message || 'Não foi possível salvar o talhão.',
      });
    }
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonName) return;
    try {
      await addCropSeason({
        name: seasonName,
        startDate: seasonStartDate,
        endDate: seasonEndDate,
        plantingDate: seasonPlantingDate || undefined,
        expectedHarvestDate: seasonExpectedHarvest || undefined,
        isCurrent: seasonIsCurrent,
      });
      addToast({
        type: 'success',
        title: 'Safra Cadastrada!',
        message: `${seasonName} adicionada com ciclo produtivo definido.`,
      });
      setIsNewSeasonModal(false);
      setSeasonName('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao cadastrar safra',
        message: err?.message || 'Não foi possível salvar a safra.',
      });
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName) return;
    try {
      await addSupplier({
        name: supplierName,
        category: supplierCategory,
        document: supplierDocument || 'N/A',
        contact: supplierContact || 'N/A',
      });
      addToast({
        type: 'success',
        title: 'Fornecedor Cadastrado!',
        message: `${supplierName} cadastrado com sucesso.`,
      });
      setIsNewSupplierModal(false);
      setSupplierName('');
      setSupplierDocument('');
      setSupplierContact('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro de Duplicidade / Validação',
        message: err?.message || 'Erro ao cadastrar fornecedor.',
      });
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;
    try {
      await addCustomer({
        name: customerName,
        segment: customerSegment,
        document: customerDocument || 'N/A',
        contact: customerContact || 'N/A',
      });
      addToast({
        type: 'success',
        title: 'Cliente Cadastrado!',
        message: `${customerName} cadastrado com sucesso.`,
      });
      setIsNewCustomerModal(false);
      setCustomerName('');
      setCustomerDocument('');
      setCustomerContact('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro de Duplicidade / Validação',
        message: err?.message || 'Erro ao cadastrar comprador.',
      });
    }
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName) return;
    try {
      const payload = {
        farmId: activeFarmId,
        name: machineName,
        type: machineType,
        brand: machineBrand || undefined,
        model: machineModel || undefined,
        plate: machinePlate || 'AGRO-001',
        chassis: machineChassis || undefined,
        year: machineYear ? parseInt(machineYear) : undefined,
        fuelConsumption: parseFloat(machineFuelConsumption.replace(',', '.')) || 0,
        hourCost: parseFloat(machineHourCost.replace(',', '.')) || 0,
        status: machineStatus,
      };

      if (editingMachineId) {
        await updateMachinery(editingMachineId, payload);
        addToast({
          type: 'success',
          title: 'Máquina Atualizada!',
          message: `${machineName} alterada com sucesso.`,
        });
      } else {
        await addMachinery(payload);
        addToast({
          type: 'success',
          title: 'Máquina Cadastrada!',
          message: `${machineName} adicionada à frota com especificações completas.`,
        });
      }
      setIsMachineModal(false);
      setEditingMachineId(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar máquina',
        message: err?.message || 'Não foi possível salvar o equipamento.',
      });
    }
  };

  const handleDeleteMachine = async (m: Machinery) => {
    if (confirm(`Deseja realmente excluir a máquina ${m.name}?`)) {
      try {
        await deleteMachinery(m.id);
        addToast({
          type: 'info',
          title: 'Máquina Removida',
          message: `${m.name} foi removida da frota.`,
        });
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Erro ao excluir máquina',
          message: err?.message || 'Não foi possível excluir o equipamento.',
        });
      }
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !employeeRole) return;
    try {
      const payload = {
        farmId: activeFarmId,
        name: employeeName,
        document: employeeDocument || undefined,
        phone: employeePhone || undefined,
        role: employeeRole,
        type: employeeType,
        remuneration: parseFloat(employeeRemuneration.replace(',', '.')) || 0,
        additionalCosts: parseFloat(employeeAdditionalCosts.replace(',', '.')) || 0,
        hourCost: parseFloat(employeeHourCost.replace(',', '.')) || 0,
        admissionDate: employeeAdmissionDate || undefined,
        status: employeeStatus,
        notes: employeeNotes || undefined,
      };

      if (editingEmployeeId) {
        await updateEmployee(editingEmployeeId, payload);
        addToast({
          type: 'success',
          title: 'Colaborador Atualizado!',
          message: `${employeeName} alterado com sucesso.`,
        });
      } else {
        await addEmployee(payload);
        addToast({
          type: 'success',
          title: 'Colaborador Cadastrado!',
          message: `${employeeName} adicionado à equipe com custo hora de R$ ${payload.hourCost.toFixed(2)}/h.`,
        });
      }
      setIsEmployeeModal(false);
      setEditingEmployeeId(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar colaborador',
        message: err?.message || 'Não foi possível salvar o colaborador.',
      });
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (confirm(`Deseja realmente remover o colaborador ${emp.name}?`)) {
      try {
        await deleteEmployee(emp.id);
        addToast({
          type: 'info',
          title: 'Colaborador Removido',
          message: `${emp.name} foi removido do quadro de colaboradores.`,
        });
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Erro ao excluir colaborador',
          message: err?.message || 'Não foi possível excluir o colaborador.',
        });
      }
    }
  };

  // Machinery stats
  const operationalCount = machinery.filter((m) => m.status === 'Operacional').length;
  const maintenanceCount = machinery.filter((m) => m.status === 'Manutenção').length;
  const avgMachineHourCost =
    machinery.length > 0
      ? machinery.reduce((sum, m) => sum + (m.hourCost || 0), 0) / machinery.length
      : 0;

  // Employee stats
  const activeEmployeesCount = employees.filter((e) => e.status === 'Ativo').length;
  const totalPayrollCost = employees.reduce(
    (sum, e) => sum + (e.remuneration || 0) + (e.additionalCosts || 0),
    0
  );
  const avgEmployeeHourCost =
    employees.length > 0
      ? employees.reduce((sum, e) => sum + (e.hourCost || 0), 0) / employees.length
      : 0;

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Cadastros Base do Sistema</h1>
          <p className="page-subtitle">
            Gestão de propriedades rurais, talhões, safras, fornecedores, frota de maquinário,
            colaboradores e bancos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'fazendas' && (
            <ClayButton variant="primary" onClick={() => setIsNewFarmModal(true)}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Nova Fazenda
            </ClayButton>
          )}
          {activeTab === 'talhoes' && (
            <ClayButton variant="primary" onClick={() => setIsNewFieldModal(true)}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Novo Talhão
            </ClayButton>
          )}
          {activeTab === 'safras' && (
            <ClayButton variant="primary" onClick={() => setIsNewSeasonModal(true)}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Nova Safra
            </ClayButton>
          )}
          {activeTab === 'fornecedores' && (
            <>
              <ClayButton variant="secondary" onClick={() => setIsNewCustomerModal(true)}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Novo Cliente
              </ClayButton>
              <ClayButton variant="primary" onClick={() => setIsNewSupplierModal(true)}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Novo Fornecedor
              </ClayButton>
            </>
          )}
          {activeTab === 'maquinas' && (
            <ClayButton variant="primary" onClick={handleOpenNewMachineModal}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Nova Máquina
            </ClayButton>
          )}
          {activeTab === 'funcionarios' && (
            <ClayButton variant="primary" onClick={handleOpenNewEmployeeModal}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Novo Colaborador
            </ClayButton>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <ClayTabs
        tabs={[
          {
            id: 'fazendas',
            label: 'Fazendas & Propriedades',
            count: farms.length,
            icon: <Home size={15} />,
          },
          {
            id: 'talhoes',
            label: 'Talhões & Áreas',
            count: fields.length,
            icon: <Sprout size={15} />,
          },
          {
            id: 'safras',
            label: 'Safras & Culturas',
            count: seasons.length,
            icon: <Wheat size={15} />,
          },
          {
            id: 'fornecedores',
            label: 'Fornecedores & Clientes',
            count: suppliers.length + customers.length,
            icon: <Users size={15} />,
          },
          {
            id: 'maquinas',
            label: 'Maquinário & Frota',
            count: machinery.length,
            icon: <Tractor size={15} />,
          },
          {
            id: 'funcionarios',
            label: 'Funcionários & Equipe',
            count: employees.length,
            icon: <Briefcase size={15} />,
          },
          {
            id: 'bancos',
            label: 'Contas Bancárias',
            count: bankAccounts.length,
            icon: <Building2 size={15} />,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab: Fazendas */}
      {activeTab === 'fazendas' && (
        <div className="grid-2">
          {farms.map((f) => (
            <ClayCard key={f.id}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="badge badge--success">Ativa</span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
                  {f.totalArea.toLocaleString('pt-BR')} ha
                </span>
              </div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {f.name}
              </h3>
              {f.cnpjCpf && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileText size={13} />
                  <span>CPF/CNPJ: {f.cnpjCpf}</span>
                </div>
              )}
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MapPin size={13} />
                {f.address ? `${f.address} • ${f.location}` : f.location}
              </p>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-primary-700)',
                  background: 'var(--bg-surface-2)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Compass size={13} />
                <span>CAR: {f.carNumber}</span>
              </div>
            </ClayCard>
          ))}
        </div>
      )}

      {/* Tab: Talhões */}
      {activeTab === 'talhoes' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Talhões Cadastrados & Georreferenciamento</h2>
              <p className="card-subtitle">Áreas de plantio, tipologia de solo e coordenadas GPS</p>
            </div>
          </div>
          <ClayTable
            columns={[
              {
                key: 'name',
                header: 'Nome do Talhão',
                render: (r) => <span style={{ fontWeight: '600' }}>{r.name}</span>,
              },
              { key: 'area', header: 'Área', render: (r) => `${r.area} ha` },
              { key: 'soilType', header: 'Tipo de Solo' },
              {
                key: 'currentCrop',
                header: 'Cultura & Variedade',
                render: (r) => (
                  <span className="badge badge--primary">
                    {r.currentCrop} {r.variety ? `• ${r.variety}` : ''}
                  </span>
                ),
              },
              {
                key: 'coordinates',
                header: 'GPS / Coordenadas',
                render: (r) => (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {r.coordinates ||
                      (r.latitude ? `${r.latitude}, ${r.longitude}` : 'Não informado')}
                  </span>
                ),
              },
            ]}
            data={fields}
            keyExtractor={(f) => f.id}
          />
        </ClayCard>
      )}

      {/* Tab: Safras */}
      {activeTab === 'safras' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Ciclos Agrícolas e Safras Planejadas</h2>
              <p className="card-subtitle">
                Planejamento de plantio, previsão de colheita e encerramento
              </p>
            </div>
          </div>
          <ClayTable
            columns={[
              {
                key: 'name',
                header: 'Safra / Ciclo',
                render: (r) => <span style={{ fontWeight: '600' }}>{r.name}</span>,
              },
              {
                key: 'plantingDate',
                header: 'Início (Plantio)',
                render: (r) => <span className="td-date">{r.plantingDate || r.startDate}</span>,
              },
              {
                key: 'expectedHarvestDate',
                header: 'Previsão Colheita',
                render: (r) => (
                  <span className="td-date">{r.expectedHarvestDate || r.endDate}</span>
                ),
              },
              {
                key: 'endDate',
                header: 'Encerramento',
                render: (r) => <span className="td-date">{r.endDate}</span>,
              },
              {
                key: 'isCurrent',
                header: 'Status',
                render: (r) =>
                  r.isCurrent ? (
                    <span className="badge badge--success">Safra Vigente</span>
                  ) : (
                    <span className="badge badge--neutral">Encerrada</span>
                  ),
              },
            ]}
            data={seasons}
            keyExtractor={(s) => s.id}
          />
        </ClayCard>
      )}

      {/* Tab: Fornecedores & Clientes */}
      {activeTab === 'fornecedores' && (
        <div className="grid-2">
          <ClayCard>
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">Fornecedores Homologados</h2>
                <p className="card-subtitle">Parceiros comerciais de insumos e serviços</p>
              </div>
              <ClayButton variant="ghost" size="sm" onClick={() => setIsNewSupplierModal(true)}>
                <Plus size={14} /> Novo
              </ClayButton>
            </div>
            <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="flex-between"
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: 'var(--text-sm)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      CPF/CNPJ: {s.document} • Tel: {s.contact}
                    </div>
                  </div>
                  <span
                    className="badge badge--primary"
                    style={{ fontSize: '10px', flexShrink: 0 }}
                  >
                    {s.category}
                  </span>
                </div>
              ))}
            </div>
          </ClayCard>

          <ClayCard>
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">Compradores / Tradings</h2>
                <p className="card-subtitle">Clientes de grãos e contratos futuros</p>
              </div>
              <ClayButton variant="ghost" size="sm" onClick={() => setIsNewCustomerModal(true)}>
                <Plus size={14} /> Novo
              </ClayButton>
            </div>
            <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="flex-between"
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: 'var(--text-sm)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      CPF/CNPJ: {c.document} • Tel: {c.contact}
                    </div>
                  </div>
                  <span
                    className="badge badge--success"
                    style={{ fontSize: '10px', flexShrink: 0 }}
                  >
                    {c.segment}
                  </span>
                </div>
              ))}
            </div>
          </ClayCard>
        </div>
      )}

      {/* Tab: Maquinário & Frota */}
      {activeTab === 'maquinas' && (
        <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
          {/* Quick Metrics Bar */}
          <div className="grid-4">
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Frota Total
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                }}
              >
                {machinery.length} un.
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Operacionais
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-success-700)',
                }}
              >
                {operationalCount} un.
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Em Manutenção
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-warning-700)',
                }}
              >
                {maintenanceCount} un.
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Custo Médio / Hora
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-800)',
                }}
              >
                R$ {avgMachineHourCost.toFixed(2)}/h
              </div>
            </div>
          </div>

          <ClayCard>
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">Frota de Máquinas, Implementos e Veículos</h2>
                <p className="card-subtitle">
                  Taxa de hora-máquina, controle de placas, chassi e parâmetros de custo
                </p>
              </div>
              <ClayButton variant="primary" size="sm" onClick={handleOpenNewMachineModal}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Nova Máquina
              </ClayButton>
            </div>
            <ClayTable
              columns={[
                {
                  key: 'name',
                  header: 'Equipamento / Modelo',
                  render: (r: Machinery) => (
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {r.brand ? `${r.brand} ` : ''}
                        {r.model ? `• Mod: ${r.model}` : ''}
                        {r.year ? ` • Ano ${r.year}` : ''}
                      </div>
                    </div>
                  ),
                },
                { key: 'type', header: 'Categoria' },
                {
                  key: 'identifiers',
                  header: 'Placa & Chassi / Série',
                  render: (r: Machinery) => (
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Placa: {r.plate || 'N/A'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Chassi: {r.chassis || 'Não informado'}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'fuelConsumption',
                  header: 'Consumo Médio',
                  render: (r: Machinery) => (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {r.fuelConsumption ? `${r.fuelConsumption} L/h` : '—'}
                    </span>
                  ),
                },
                {
                  key: 'hourCost',
                  header: 'Custo / Hora',
                  align: 'right',
                  render: (r: Machinery) => (
                    <span className="td-money" style={{ fontWeight: '700' }}>
                      R$ {r.hourCost.toFixed(2)}/h
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  align: 'center',
                  render: (r: Machinery) => {
                    const badgeClass =
                      r.status === 'Operacional'
                        ? 'badge--success'
                        : r.status === 'Manutenção'
                          ? 'badge--warning'
                          : 'badge--neutral';
                    return <span className={`badge ${badgeClass}`}>{r.status}</span>;
                  },
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  align: 'right',
                  render: (r: Machinery) => (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <ClayButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditMachineModal(r)}
                        title="Editar Máquina"
                      >
                        <Edit2 size={14} />
                      </ClayButton>
                      <ClayButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMachine(r)}
                        title="Excluir Máquina"
                      >
                        <Trash2 size={14} color="var(--color-danger-600)" />
                      </ClayButton>
                    </div>
                  ),
                },
              ]}
              data={machinery}
              keyExtractor={(m) => m.id}
            />
          </ClayCard>
        </div>
      )}

      {/* Tab: Funcionários & Colaboradores */}
      {activeTab === 'funcionarios' && (
        <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
          {/* Quick Metrics Bar */}
          <div className="grid-3">
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Colaboradores Ativos
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-success-700)',
                }}
              >
                {activeEmployeesCount} de {employees.length}
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Folha Mensal Total (Salários + Encargos)
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-800)',
                }}
              >
                R$ {totalPayrollCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Custo Médio / Hora (Mão de Obra)
              </div>
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-700)',
                }}
              >
                R$ {avgEmployeeHourCost.toFixed(2)}/h
              </div>
            </div>
          </div>

          <ClayCard>
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">Quadro de Colaboradores & Mão de Obra Rural</h2>
                <p className="card-subtitle">
                  Gestão de funções, encargos, remuneração e taxa horária para apropriação em
                  talhões e operações
                </p>
              </div>
              <ClayButton variant="primary" size="sm" onClick={handleOpenNewEmployeeModal}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Novo Colaborador
              </ClayButton>
            </div>
            <ClayTable
              columns={[
                {
                  key: 'name',
                  header: 'Colaborador / Função',
                  render: (r: Employee) => (
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {r.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-primary-700)',
                          fontWeight: '500',
                        }}
                      >
                        {r.role}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'documents',
                  header: 'Documento & Contato',
                  render: (r: Employee) => (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div>CPF: {r.document || 'Não informado'}</div>
                      <div style={{ color: 'var(--text-tertiary)' }}>
                        {r.phone || 'Sem telefone'}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: 'Regime',
                  render: (r: Employee) => (
                    <span className="badge badge--neutral" style={{ fontSize: '11px' }}>
                      {r.type}
                    </span>
                  ),
                },
                {
                  key: 'remuneration',
                  header: 'Salário Base',
                  align: 'right',
                  render: (r: Employee) => (
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>
                      R$ {r.remuneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'additionalCosts',
                  header: 'Encargos / Benefícios',
                  align: 'right',
                  render: (r: Employee) => (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      + R$ {r.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'hourCost',
                  header: 'Custo / Hora',
                  align: 'right',
                  render: (r: Employee) => (
                    <span
                      className="td-money"
                      style={{ fontWeight: '700', color: 'var(--color-primary-800)' }}
                    >
                      R$ {r.hourCost.toFixed(2)}/h
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  align: 'center',
                  render: (r: Employee) => {
                    const badgeClass =
                      r.status === 'Ativo'
                        ? 'badge--success'
                        : r.status === 'Férias'
                          ? 'badge--primary'
                          : r.status === 'Afastado'
                            ? 'badge--warning'
                            : 'badge--neutral';
                    return <span className={`badge ${badgeClass}`}>{r.status}</span>;
                  },
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  align: 'right',
                  render: (r: Employee) => (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <ClayButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditEmployeeModal(r)}
                        title="Editar Colaborador"
                      >
                        <Edit2 size={14} />
                      </ClayButton>
                      <ClayButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(r)}
                        title="Excluir Colaborador"
                      >
                        <Trash2 size={14} color="var(--color-danger-600)" />
                      </ClayButton>
                    </div>
                  ),
                },
              ]}
              data={employees}
              keyExtractor={(e) => e.id}
            />
          </ClayCard>
        </div>
      )}

      {/* Tab: Contas Bancárias */}
      {activeTab === 'bancos' && (
        <div className="grid-3">
          {bankAccounts.map((b) => (
            <ClayCard key={b.id}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="badge badge--primary">{b.type}</span>
                <Building2 size={18} color="var(--color-primary-600)" />
              </div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', marginBottom: '4px' }}>
                {b.bankName}
              </h3>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                Agência: {b.agency} • Conta: {b.accountNumber}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Saldo Atual</div>
              <div
                className="td-money"
                style={{ fontSize: 'var(--text-xl)', color: 'var(--color-primary-800)' }}
              >
                R$ {b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </ClayCard>
          ))}
        </div>
      )}

      {/* Modal: Nova Fazenda */}
      <ClayModal
        isOpen={isNewFarmModal}
        onClose={() => setIsNewFarmModal(false)}
        title="Cadastrar Nova Fazenda"
        subtitle="Adicione uma nova propriedade rural com CAR, CNPJ/CPF e localização"
      >
        <form onSubmit={handleSaveFarm} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome da Fazenda"
            placeholder="Ex: Fazenda Boa Esperança"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClayInput
              label="CNPJ ou CPF do Produtor"
              placeholder="00.000.000/0001-00"
              value={farmCnpjCpf}
              onChange={(e) => setFarmCnpjCpf(e.target.value)}
            />
            <ClayInput
              label="Área Total (Hectares)"
              type="number"
              value={farmArea}
              onChange={(e) => setFarmArea(e.target.value)}
              required
            />
          </div>
          <ClayInput
            label="Endereço / Rodovia / Linha"
            placeholder="Ex: Rodovia BR-163, Km 740, Zona Rural"
            value={farmAddress}
            onChange={(e) => setFarmAddress(e.target.value)}
          />
          <div className="form-grid-2">
            <ClayInput
              label="Localização / Município e UF"
              placeholder="Ex: Nova Mutum - MT"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
            />
            <ClayInput
              label="Número do CAR (Cadastro Ambiental Rural)"
              placeholder="MT-5107909-ABCD.1234.EFGH.5678"
              value={farmCar}
              onChange={(e) => setFarmCar(e.target.value)}
            />
          </div>
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewFarmModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Cadastrar Propriedade
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Novo Talhão */}
      <ClayModal
        isOpen={isNewFieldModal}
        onClose={() => setIsNewFieldModal(false)}
        title="Cadastrar Novo Talhão"
        subtitle="Defina área, tipo de solo, variedade e coordenadas GPS"
      >
        <form onSubmit={handleSaveField} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome / Identificação do Talhão"
            placeholder="Ex: Talhão 06 - Chapadão Sul"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClayInput
              label="Área Útil (Hectares)"
              type="number"
              value={fieldArea}
              onChange={(e) => setFieldArea(e.target.value)}
              required
            />
            <ClaySelect
              label="Cultura Atual"
              options={[
                { value: 'Soja', label: 'Soja' },
                { value: 'Milho', label: 'Milho' },
                { value: 'Algodão', label: 'Algodão' },
                { value: 'Trigo', label: 'Trigo' },
                { value: 'Café', label: 'Café' },
                { value: 'Pousio', label: 'Pousio / Cobertura' },
              ]}
              value={fieldCrop}
              onChange={(e) => setFieldCrop(e.target.value)}
            />
          </div>
          <div className="form-grid-2">
            <ClayInput
              label="Variedade / Cultivar / Híbrido"
              placeholder="Ex: BRS 580, Monsoy 5917, DKB 390"
              value={fieldVariety}
              onChange={(e) => setFieldVariety(e.target.value)}
            />
            <ClaySelect
              label="Tipo de Solo / Textura"
              options={[
                { value: 'Latossolo Vermelho', label: 'Latossolo Vermelho (Argiloso)' },
                { value: 'Latossolo Amarelo', label: 'Latossolo Amarelo (Médio)' },
                { value: 'Argissolo Vermelho', label: 'Argissolo Vermelho' },
                { value: 'Neossolo Quartzarênico', label: 'Neossolo Quartzarênico (Arenoso)' },
                { value: 'Gleissolo', label: 'Gleissolo (Várzea)' },
              ]}
              value={fieldSoil}
              onChange={(e) => setFieldSoil(e.target.value)}
            />
          </div>
          <ClayInput
            label="Coordenadas Geográficas / GPS (Lat, Lng)"
            placeholder="Ex: -12.5428, -55.7214"
            value={fieldCoordinates}
            onChange={(e) => setFieldCoordinates(e.target.value)}
          />
          <div className="form-grid-2">
            <ClayInput
              label="Data de Plantio"
              type="date"
              value={fieldPlantingDate}
              onChange={(e) => setFieldPlantingDate(e.target.value)}
            />
            <ClayInput
              label="Previsão de Colheita"
              type="date"
              value={fieldExpectedHarvest}
              onChange={(e) => setFieldExpectedHarvest(e.target.value)}
            />
          </div>
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewFieldModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Salvar Talhão
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Nova Safra */}
      <ClayModal
        isOpen={isNewSeasonModal}
        onClose={() => setIsNewSeasonModal(false)}
        title="Cadastrar Nova Safra / Ciclo"
        subtitle="Defina as datas de plantio, previsão de colheita e fechamento da safra"
      >
        <form onSubmit={handleSaveSeason} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome da Safra / Ciclo"
            placeholder="Ex: Safra 2026/2027 (Principal)"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClayInput
              label="Data Início (Plantio)"
              type="date"
              value={seasonStartDate}
              onChange={(e) => {
                setSeasonStartDate(e.target.value);
                setSeasonPlantingDate(e.target.value);
              }}
              required
            />
            <ClayInput
              label="Previsão de Colheita"
              type="date"
              value={seasonExpectedHarvest}
              onChange={(e) => setSeasonExpectedHarvest(e.target.value)}
              required
            />
          </div>
          <ClayInput
            label="Data de Encerramento da Safra"
            type="date"
            value={seasonEndDate}
            onChange={(e) => setSeasonEndDate(e.target.value)}
            required
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="isCurrentSeason"
              checked={seasonIsCurrent}
              onChange={(e) => setSeasonIsCurrent(e.target.checked)}
            />
            <label
              htmlFor="isCurrentSeason"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              Definir como Safra Vigente principal
            </label>
          </div>
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewSeasonModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Cadastrar Safra
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Novo Fornecedor */}
      <ClayModal
        isOpen={isNewSupplierModal}
        onClose={() => setIsNewSupplierModal(false)}
        title="Cadastrar Fornecedor"
        subtitle="Cadastro com validação automática contra duplicidade de CPF/CNPJ"
      >
        <form onSubmit={handleSaveSupplier} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Razão Social / Nome do Fornecedor"
            placeholder="Ex: Agrodefesas & Sementes MT"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClaySelect
              label="Categoria de Fornecimento"
              options={[
                { value: 'Insumos Agrícolas', label: 'Insumos Agrícolas' },
                { value: 'Fertilizantes & Corretivos', label: 'Fertilizantes & Corretivos' },
                { value: 'Defensivos & Químicos', label: 'Defensivos & Químicos' },
                { value: 'Sementes & Mudas', label: 'Sementes & Mudas' },
                { value: 'Combustíveis & Lubrificantes', label: 'Combustíveis & Lubrificantes' },
                { value: 'Peças & Manutenção', label: 'Peças & Manutenção' },
                { value: 'Serviços Agrícolas / Fretes', label: 'Serviços Agrícolas / Fretes' },
              ]}
              value={supplierCategory}
              onChange={(e) => setSupplierCategory(e.target.value)}
            />
            <ClayInput
              label="CNPJ ou CPF (com verificação de duplicidade)"
              placeholder="00.000.000/0001-00"
              value={supplierDocument}
              onChange={(e) => setSupplierDocument(e.target.value)}
              required
            />
          </div>
          <ClayInput
            label="Contato / Telefone / E-mail"
            placeholder="Ex: (65) 3549-0000 / comercial@agro.com.br"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
          />
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewSupplierModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Cadastrar Fornecedor
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Novo Cliente / Comprador */}
      <ClayModal
        isOpen={isNewCustomerModal}
        onClose={() => setIsNewCustomerModal(false)}
        title="Cadastrar Cliente / Trading"
        subtitle="Cadastro com validação automática contra duplicidade de CPF/CNPJ"
      >
        <form onSubmit={handleSaveCustomer} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Razão Social / Nome do Comprador"
            placeholder="Ex: Cargill Agrícola S.A."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClaySelect
              label="Segmento de Mercado"
              options={[
                { value: 'Trading / Exportação', label: 'Trading / Exportação' },
                { value: 'Cooperativa Agropecuária', label: 'Cooperativa Agropecuária' },
                { value: 'Indústria / Esmagadora', label: 'Indústria / Esmagadora' },
                { value: 'Mercado Interno / Granjeiro', label: 'Mercado Interno / Granjeiro' },
                { value: 'Barter Insumos', label: 'Barter Insumos' },
              ]}
              value={customerSegment}
              onChange={(e) => setCustomerSegment(e.target.value)}
            />
            <ClayInput
              label="CNPJ ou CPF (com verificação de duplicidade)"
              placeholder="00.000.000/0001-00"
              value={customerDocument}
              onChange={(e) => setCustomerDocument(e.target.value)}
              required
            />
          </div>
          <ClayInput
            label="Contato / Telefone / E-mail"
            placeholder="Ex: mesa.graos@cargill.com"
            value={customerContact}
            onChange={(e) => setCustomerContact(e.target.value)}
          />
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewCustomerModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Cadastrar Cliente
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Máquina / Frota (Novo e Edição) */}
      <ClayModal
        isOpen={isMachineModal}
        onClose={() => {
          setIsMachineModal(false);
          setEditingMachineId(null);
        }}
        title={editingMachineId ? 'Editar Máquina / Frota' : 'Cadastrar Máquina / Frota'}
        subtitle="Controle técnico, chassi, consumo de combustível e taxa de hora-máquina"
      >
        <form onSubmit={handleSaveMachine} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome / Identificação do Equipamento"
            placeholder="Ex: Colheitadeira Case IH Axial-Flow 8250"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClaySelect
              label="Tipo / Categoria de Equipamento"
              options={[
                { value: 'Trator Pesado', label: 'Trator Pesado (> 250 CV)' },
                { value: 'Trator Médio', label: 'Trator Médio (100 - 250 CV)' },
                { value: 'Colheitadeira de Grãos', label: 'Colheitadeira de Grãos' },
                { value: 'Pulverizador Autopropelido', label: 'Pulverizador Autopropelido' },
                { value: 'Plantadeira / Semeadora', label: 'Plantadeira / Semeadora' },
                { value: 'Caminhão Graneleiro', label: 'Caminhão Graneleiro' },
                {
                  value: 'Implemento / Grade / Descompactador',
                  label: 'Implemento / Grade / Descompactador',
                },
              ]}
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
            />
            <ClaySelect
              label="Marca / Fabricante"
              options={[
                { value: 'John Deere', label: 'John Deere' },
                { value: 'Case IH', label: 'Case IH' },
                { value: 'Valtra', label: 'Valtra' },
                { value: 'New Holland', label: 'New Holland' },
                { value: 'Jacto', label: 'Jacto' },
                { value: 'Massey Ferguson', label: 'Massey Ferguson' },
                { value: 'Fendt', label: 'Fendt' },
                { value: 'Stara', label: 'Stara' },
                { value: 'Outra / Implemento', label: 'Outra Marca / Fabricante' },
              ]}
              value={machineBrand}
              onChange={(e) => setMachineBrand(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Modelo Específico"
              placeholder="Ex: 8R 370 ou 8250"
              value={machineModel}
              onChange={(e) => setMachineModel(e.target.value)}
            />
            <ClayInput
              label="Ano de Fabricação"
              type="number"
              placeholder="2023"
              value={machineYear}
              onChange={(e) => setMachineYear(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Placa / Identificador Interno"
              placeholder="Ex: AGRO-JD01 ou MT-SRR-8250"
              value={machinePlate}
              onChange={(e) => setMachinePlate(e.target.value)}
              required
            />
            <ClayInput
              label="Número do Chassi / Série do Fabricante"
              placeholder="Ex: 1RW8370PCPC049281"
              value={machineChassis}
              onChange={(e) => setMachineChassis(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Custo Operacional Total (R$/hora)"
              type="number"
              step="0.01"
              value={machineHourCost}
              onChange={(e) => setMachineHourCost(e.target.value)}
              required
            />
            <ClayInput
              label="Consumo Estimado (L/hora)"
              type="number"
              step="0.1"
              value={machineFuelConsumption}
              onChange={(e) => setMachineFuelConsumption(e.target.value)}
            />
          </div>

          <ClaySelect
            label="Status Operacional"
            options={[
              { value: 'Operacional', label: 'Operacional (Pronto para campo)' },
              { value: 'Manutenção', label: 'Em Manutenção / Oficina' },
              { value: 'Inativo', label: 'Inativo / Desmobilizado' },
            ]}
            value={machineStatus}
            onChange={(e) => setMachineStatus(e.target.value)}
          />

          <div className="modal__footer">
            <ClayButton
              type="button"
              variant="ghost"
              onClick={() => {
                setIsMachineModal(false);
                setEditingMachineId(null);
              }}
            >
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              {editingMachineId ? 'Salvar Alterações' : 'Cadastrar Máquina'}
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Colaborador / Funcionário (Novo e Edição) */}
      <ClayModal
        isOpen={isEmployeeModal}
        onClose={() => {
          setIsEmployeeModal(false);
          setEditingEmployeeId(null);
        }}
        title={editingEmployeeId ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
        subtitle="Cadastro de funcionário rural, remuneração, encargos e apuração do custo/hora"
      >
        <form onSubmit={handleSaveEmployee} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome Completo do Colaborador"
            placeholder="Ex: José Carlos Ribeiro"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClayInput
              label="Cargo / Função no Campo"
              placeholder="Ex: Tratorista Sênior, Operador de Colheitadeira, Agrônomo"
              value={employeeRole}
              onChange={(e) => setEmployeeRole(e.target.value)}
              required
            />
            <ClaySelect
              label="Regime de Trabalho"
              options={[
                { value: 'CLT', label: 'CLT (Mensalista Rural)' },
                { value: 'Diarista', label: 'Diarista (Trabalhador Eventual)' },
                { value: 'Temporário', label: 'Temporário (Safra / Colheita)' },
                { value: 'PJ', label: 'Prestador de Serviço (PJ)' },
              ]}
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="CPF"
              placeholder="000.000.000-00"
              value={employeeDocument}
              onChange={(e) => setEmployeeDocument(e.target.value)}
            />
            <ClayInput
              label="Telefone / WhatsApp"
              placeholder="(66) 99999-9999"
              value={employeePhone}
              onChange={(e) => setEmployeePhone(e.target.value)}
            />
          </div>

          <div className="form-grid-3">
            <ClayInput
              label="Salário / Remuneração Base (R$)"
              type="number"
              step="0.01"
              value={employeeRemuneration}
              onChange={(e) => {
                setEmployeeRemuneration(e.target.value);
                handleRecalculateEmployeeHourCost(e.target.value, employeeAdditionalCosts);
              }}
              required
            />
            <ClayInput
              label="Encargos & Benefícios (R$)"
              type="number"
              step="0.01"
              value={employeeAdditionalCosts}
              onChange={(e) => {
                setEmployeeAdditionalCosts(e.target.value);
                handleRecalculateEmployeeHourCost(employeeRemuneration, e.target.value);
              }}
            />
            <ClayInput
              label="Custo / Hora Final (R$/h)"
              type="number"
              step="0.01"
              value={employeeHourCost}
              onChange={(e) => setEmployeeHourCost(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Data de Admissão"
              type="date"
              value={employeeAdmissionDate}
              onChange={(e) => setEmployeeAdmissionDate(e.target.value)}
            />
            <ClaySelect
              label="Situação / Status"
              options={[
                { value: 'Ativo', label: 'Ativo (Em atividade no campo)' },
                { value: 'Férias', label: 'Em Férias Regulamentares' },
                { value: 'Afastado', label: 'Afastado (INSS / Licença)' },
                { value: 'Desligado', label: 'Desligado' },
              ]}
              value={employeeStatus}
              onChange={(e) => setEmployeeStatus(e.target.value)}
            />
          </div>

          <ClayInput
            label="Observações / Treinamentos / Certificados (NR-31, CNH, etc.)"
            placeholder="Ex: CNH Categoria C, Treinamento de Piloto Automático Trimble/JD, NR-31"
            value={employeeNotes}
            onChange={(e) => setEmployeeNotes(e.target.value)}
          />

          <div className="modal__footer">
            <ClayButton
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEmployeeModal(false);
                setEditingEmployeeId(null);
              }}
            >
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              {editingEmployeeId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
            </ClayButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
}
