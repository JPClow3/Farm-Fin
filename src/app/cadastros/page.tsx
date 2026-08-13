'use client';

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ClayTable, Column } from '../../components/ui/ClayTable';
import { ClayModal } from '../../components/ui/ClayModal';
import { ClayInput } from '../../components/ui/ClayInput';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { Farm, Field, Supplier, Machinery, BankAccount } from '../../lib/types';
import { Home, Sprout, Wheat, Users, Tractor, Building2, Plus, MapPin } from 'lucide-react';

export default function CadastrosPage() {
  const {
    farms,
    fields,
    seasons,
    suppliers,
    customers,
    machinery,
    bankAccounts,
    activeFarmId,
    addField,
    addFarm,
    addMachinery,
  } = useFarm();

  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('fazendas');

  // Modals
  const [isNewFarmModal, setIsNewFarmModal] = useState(false);
  const [isNewFieldModal, setIsNewFieldModal] = useState(false);
  const [isNewMachineModal, setIsNewMachineModal] = useState(false);

  // New Farm State
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState('1000');
  const [farmCar, setFarmCar] = useState('MT-5107909-XXXX.XXXX.XXXX');

  // New Field State
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState('300');
  const [fieldSoil, setFieldSoil] = useState('Latossolo Vermelho');
  const [fieldCrop, setFieldCrop] = useState('Soja');

  // New Machine State
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('Trator');
  const [machinePlate, setMachinePlate] = useState('');
  const [machineHourCost, setMachineHourCost] = useState('300.00');

  const handleSaveFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName) return;
    addFarm({
      name: farmName,
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
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName) return;
    addField({
      farmId: activeFarmId,
      name: fieldName,
      area: parseFloat(fieldArea) || 0,
      soilType: fieldSoil,
      currentCrop: fieldCrop,
    });
    addToast({
      type: 'success',
      title: 'Talhão Cadastrado!',
      message: `${fieldName} vinculado à fazenda ativa.`,
    });
    setIsNewFieldModal(false);
    setFieldName('');
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName) return;
    addMachinery({
      farmId: activeFarmId,
      name: machineName,
      type: machineType,
      plate: machinePlate || 'AGRO-001',
      hourCost: parseFloat(machineHourCost.replace(',', '.')) || 0,
      status: 'Operacional',
    });
    addToast({
      type: 'success',
      title: 'Máquina Cadastrada!',
      message: `${machineName} adicionada à frota.`,
    });
    setIsNewMachineModal(false);
    setMachineName('');
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Cadastros Base do Sistema</h1>
          <p className="page-subtitle">
            Gerenciamento de propriedades rurais, talhões, safras, fornecedores, frota e contas
            bancárias
          </p>
        </div>
        <div>
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
          {activeTab === 'maquinas' && (
            <ClayButton variant="primary" onClick={() => setIsNewMachineModal(true)}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Nova Máquina
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
                {f.location}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                CAR: {f.carNumber}
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
              <h2 className="card-title">Talhões Cadastrados</h2>
              <p className="card-subtitle">Áreas de plantio e tipologia de solo</p>
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
                header: 'Cultura Atual',
                render: (r) => <span className="badge badge--primary">{r.currentCrop}</span>,
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
              <h2 className="card-title">Ciclos Agrícolas e Safras</h2>
              <p className="card-subtitle">Períodos de plantio e colheita</p>
            </div>
          </div>
          <ClayTable
            columns={[
              {
                key: 'name',
                header: 'Safra',
                render: (r) => <span style={{ fontWeight: '600' }}>{r.name}</span>,
              },
              {
                key: 'startDate',
                header: 'Início',
                render: (r) => <span className="td-date">{r.startDate}</span>,
              },
              {
                key: 'endDate',
                header: 'Término',
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
            <div className="card-header">
              <h2 className="card-title">Fornecedores Homologados</h2>
            </div>
            <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="flex-between"
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      CNPJ: {s.document} • Tel: {s.contact}
                    </div>
                  </div>
                  <span className="badge badge--primary" style={{ fontSize: '10px', flexShrink: 0 }}>
                    {s.category}
                  </span>
                </div>
              ))}
            </div>
          </ClayCard>

          <ClayCard>
            <div className="card-header">
              <h2 className="card-title">Compradores / Tradings</h2>
            </div>
            <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="flex-between"
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      CNPJ: {c.document} • Tel: {c.contact}
                    </div>
                  </div>
                  <span className="badge badge--success" style={{ fontSize: '10px', flexShrink: 0 }}>
                    {c.segment}
                  </span>
                </div>
              ))}
            </div>
          </ClayCard>
        </div>
      )}

      {/* Tab: Maquinário */}
      {activeTab === 'maquinas' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Frota de Máquinas e Implementos</h2>
              <p className="card-subtitle">Taxa de hora-máquina para apropriação de custos</p>
            </div>
          </div>
          <ClayTable
            columns={[
              {
                key: 'name',
                header: 'Equipamento',
                render: (r) => <span style={{ fontWeight: '600' }}>{r.name}</span>,
              },
              { key: 'type', header: 'Categoria' },
              { key: 'plate', header: 'Placa / Chassi' },
              {
                key: 'hourCost',
                header: 'Custo / Hora',
                align: 'right',
                render: (r) => <span className="td-money">R$ {r.hourCost.toFixed(2)}/h</span>,
              },
              {
                key: 'status',
                header: 'Status',
                align: 'center',
                render: (r) => <span className="badge badge--success">{r.status}</span>,
              },
            ]}
            data={machinery}
            keyExtractor={(m) => m.id}
          />
        </ClayCard>
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
        subtitle="Adicione uma nova propriedade rural ao seu grupo agrícola"
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
              label="Localização / Município"
              placeholder="Ex: Nova Mutum - MT"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
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
            label="Número do CAR (Cadastro Ambiental Rural)"
            value={farmCar}
            onChange={(e) => setFarmCar(e.target.value)}
          />
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
        subtitle="Defina uma nova área de plantio na fazenda ativa"
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
                { value: 'Café', label: 'Café' },
                { value: 'Pousio', label: 'Pousio / Cobertura' },
              ]}
              value={fieldCrop}
              onChange={(e) => setFieldCrop(e.target.value)}
            />
          </div>
          <ClayInput
            label="Tipo de Solo / Textura"
            placeholder="Ex: Latossolo Vermelho Argiloso"
            value={fieldSoil}
            onChange={(e) => setFieldSoil(e.target.value)}
          />
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

      {/* Modal: Nova Máquina */}
      <ClayModal
        isOpen={isNewMachineModal}
        onClose={() => setIsNewMachineModal(false)}
        title="Cadastrar Máquina / Frota"
        subtitle="Adicione um trator, colheitadeira ou pulverizador"
      >
        <form onSubmit={handleSaveMachine} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Modelo / Nome do Equipamento"
            placeholder="Ex: Colheitadeira Case IH 8250"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <ClaySelect
              label="Tipo de Equipamento"
              options={[
                { value: 'Trator Pesado', label: 'Trator Pesado' },
                { value: 'Colheitadeira', label: 'Colheitadeira' },
                { value: 'Pulverizador', label: 'Pulverizador' },
                { value: 'Plantadeira', label: 'Plantadeira / Semeadora' },
                { value: 'Caminhão', label: 'Caminhão Graneleiro' },
              ]}
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
            />
            <ClayInput
              label="Custo Operacional (R$/hora)"
              type="number"
              step="0.01"
              value={machineHourCost}
              onChange={(e) => setMachineHourCost(e.target.value)}
              required
            />
          </div>
          <ClayInput
            label="Placa / Identificador Interno"
            placeholder="MT-SRR-8250"
            value={machinePlate}
            onChange={(e) => setMachinePlate(e.target.value)}
          />
          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewMachineModal(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Cadastrar Máquina
            </ClayButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
}
