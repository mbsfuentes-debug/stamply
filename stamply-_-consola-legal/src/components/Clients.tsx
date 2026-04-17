import React, { useState } from 'react';
import { Search, Filter, Plus, User, Building2, Phone, Mail, MapPin, Briefcase, ChevronRight, Edit3, Trash2, X, Sparkles, UploadCloud, FileSpreadsheet, FileText as FileTextIcon, DollarSign, CheckCircle2, Save, Landmark, MinusCircle, PlusCircle, FileText, Activity, ArrowLeft } from 'lucide-react';
import { cn, formatRut, validateRut } from '../lib/utils';

import { Template } from './TemplateLibrary';

export interface TariffItem {
  id: string;
  service: string;
  amount: number;
  portfolio?: string; // For 'Por Cartera'
  detectedService?: string; // New field for AI import
}

export interface Portfolio {
  name: string;
  rut: string;
}

export interface Client {
  id: string;
  name: string;
  rut: string;
  type: 'Abogado Independiente' | 'Estudio Jurídico';
  tariffType: 'Propio' | 'Por Cartera' | 'Arancel Receptor';
  portfolios: Portfolio[]; 
  email: string;
  phone: string;
  address: string;
  status: 'Activo' | 'Inactivo';
  casesCount: number;
  tariffs?: TariffItem[];
  closingDay?: number;
  paymentTerm?: 'inmediato' | '10_dias' | '30_dias' | '45_dias';
  isVip?: boolean;
}

interface ClientsProps {
  templates: Template[];
  clients: Client[];
  setClients: (clients: Client[]) => void;
}

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Estudio Jurídico Silva & Cía',
    rut: '76.123.456-7',
    type: 'Estudio Jurídico',
    tariffType: 'Por Cartera',
    portfolios: [
      { name: 'Banco Estado', rut: '97.036.000-K' },
      { name: 'AFP Modelo', rut: '76.095.785-5' }
    ],
    email: 'contacto@silvaycia.cl',
    phone: '+56 2 2970 7000',
    address: 'Av. Libertador Bernardo O\'Higgins 1111, Oficina 502, Santiago',
    status: 'Activo',
    casesCount: 145,
    closingDay: 25,
    paymentTerm: '30_dias',
    isVip: true,
    tariffs: [
      { id: 't1', service: 'Notificación Personal (Hipotecario)', amount: 45000, portfolio: 'Banco Estado' },
      { id: 't2', service: 'Búsqueda (Hipotecario)', amount: 15000, portfolio: 'Banco Estado' },
      { id: 't3', service: 'Notificación Ley 17.322', amount: 25000, portfolio: 'AFP Modelo' },
    ]
  },
  {
    id: '2',
    name: 'Juan Pérez González',
    rut: '12.345.678-9',
    type: 'Abogado Independiente',
    tariffType: 'Arancel Receptor',
    portfolios: [],
    email: 'juan.perez@email.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Providencia 1234, Depto 45, Providencia, Santiago',
    status: 'Activo',
    casesCount: 12,
    closingDay: 30,
    paymentTerm: 'inmediato',
    isVip: false
  },
  {
    id: '3',
    name: 'Defensa Deudores SpA',
    rut: '76.543.210-K',
    type: 'Estudio Jurídico',
    tariffType: 'Propio',
    portfolios: [
      { name: 'Retail S.A.', rut: '99.555.444-3' },
      { name: 'Automotriz del Sur', rut: '88.444.333-2' }
    ],
    email: 'operaciones@defensadeudores.cl',
    phone: '+56 2 2345 6789',
    address: 'Av. Apoquindo 4501, Oficina 120, Las Condes, Santiago',
    status: 'Activo',
    casesCount: 56,
    closingDay: 15,
    paymentTerm: '45_dias',
    isVip: false,
    tariffs: [
      { id: 't4', service: 'Notificación Personal', amount: 50000 },
      { id: 't5', service: 'Requerimiento de Pago', amount: 30000 },
      { id: 't6', service: 'Embargo', amount: 80000 },
    ]
  }
];

const DEFAULT_FORM_DATA: Partial<Client> = {
  name: '',
  rut: '',
  type: 'Abogado Independiente',
  tariffType: 'Arancel Receptor',
  portfolios: [],
  email: '',
  phone: '',
  address: '',
  status: 'Activo',
  casesCount: 0,
  tariffs: [],
  closingDay: 25
};

export default function Clients({ templates, clients, setClients }: ClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'tariffs'>('info');
  
  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>(DEFAULT_FORM_DATA);
  
  // Tariff Modal State
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Partial<TariffItem> | null>(null);

  // AI Import State
  const [showAIModal, setShowAIModal] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiStep, setAiStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [extractedTariffs, setExtractedTariffs] = useState<TariffItem[]>([]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.portfolios.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.rut.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try { await fetch(`/api/clients/${id}`, { method: 'DELETE' }); } catch {}
      setClients(clients.filter(c => c.id !== id));
      if (selectedClientId === id) {
        setSelectedClientId(null);
        setSelectedPortfolio(null);
      }
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({ ...client });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!formData.name || !formData.rut) {
      alert('El nombre y el RUT son obligatorios.');
      return;
    }

    if (editingClient) {
      try {
        const saved = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editingClient, ...formData }),
        }).then(r => r.json());
        setClients(clients.map(c => c.id === editingClient.id ? saved : c));
      } catch {
        setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } as Client : c));
      }
    } else {
      try {
        const saved = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, casesCount: 0, tariffs: [] }),
        }).then(r => r.json());
        setClients([...clients, saved]);
      } catch {
        const newClient: Client = { ...formData, id: `client-${Date.now()}`, casesCount: 0, tariffs: [] } as Client;
        setClients([...clients, newClient]);
      }
    }
    setIsClientModalOpen(false);
  };

  const handleAddPortfolio = () => {
    setFormData({
      ...formData,
      portfolios: [...(formData.portfolios || []), { name: '', rut: '' }]
    });
  };

  const handleRemovePortfolio = (index: number) => {
    const newPortfolios = [...(formData.portfolios || [])];
    newPortfolios.splice(index, 1);
    setFormData({ ...formData, portfolios: newPortfolios });
  };

  const handlePortfolioChange = (index: number, field: keyof Portfolio, value: string) => {
    const newPortfolios = [...(formData.portfolios || [])];
    if (field === 'rut') {
      newPortfolios[index][field] = formatRut(value);
    } else {
      newPortfolios[index][field] = value;
    }
    setFormData({ ...formData, portfolios: newPortfolios });
  };

  // Tariff Management
  const handleAddTariff = () => {
    setEditingTariff({ service: '', amount: 0, portfolio: selectedPortfolio || undefined });
    setIsTariffModalOpen(true);
  };

  const handleEditTariff = (tariff: TariffItem) => {
    setEditingTariff({ ...tariff });
    setIsTariffModalOpen(true);
  };

  const handleDeleteTariff = (tariffId: string) => {
    if (!confirm('¿Eliminar este arancel?')) return;
    if (selectedClient) {
      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          return { ...c, tariffs: (c.tariffs || []).filter(t => t.id !== tariffId) };
        }
        return c;
      });
      setClients(updatedClients);
    }
  };

  const handleSaveTariff = () => {
    if (!editingTariff?.service || editingTariff.amount === undefined) return;
    
    if (selectedClient) {
      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          const newTariffs = [...(c.tariffs || [])];
          if (editingTariff.id) {
            const idx = newTariffs.findIndex(t => t.id === editingTariff.id);
            if (idx >= 0) newTariffs[idx] = editingTariff as TariffItem;
          } else {
            newTariffs.push({
              ...editingTariff,
              id: `t-${Date.now()}`,
              portfolio: selectedClient.tariffType === 'Por Cartera' ? selectedPortfolio! : undefined
            } as TariffItem);
          }
          return { ...c, tariffs: newTariffs };
        }
        return c;
      });
      setClients(updatedClients);
    }
    setIsTariffModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  const handleSimulateAIProcess = () => {
    setAiStep('processing');
    setIsProcessingAI(true);
    
    setTimeout(() => {
      const detected = [
        { id: 'ai1', detectedService: 'Notificación Personal (Nueva)', amount: 48000 },
        { id: 'ai2', detectedService: 'Búsqueda Art. 44', amount: 18000 },
        { id: 'ai3', detectedService: 'Requerimiento y Embargo', amount: 95000 },
      ];

      const mapped = detected.map(d => {
        // Try to find a fuzzy match in templates
        const match = templates.find(t => 
          d.detectedService.toLowerCase().includes(t.name.toLowerCase()) || 
          t.name.toLowerCase().includes(d.detectedService.toLowerCase())
        );
        
        return {
          ...d,
          service: match ? match.name : '',
          portfolio: selectedPortfolio || selectedClient?.portfolios[0]?.name || 'General'
        } as TariffItem;
      });

      setExtractedTariffs(mapped);
      setIsProcessingAI(false);
      setAiStep('review');
    }, 3000);
  };

  const handleSaveAITariffs = () => {
    if (selectedClient) {
      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          return {
            ...c,
            tariffType: c.tariffType === 'Arancel Receptor' ? 'Propio' : c.tariffType,
            tariffs: [...(c.tariffs || []), ...extractedTariffs]
          };
        }
        return c;
      });
      setClients(updatedClients as Client[]);
    }
    setShowAIModal(false);
    setAiStep('upload');
    setExtractedTariffs([]);
  };

  const displayTariffs = selectedClient?.tariffType === 'Por Cartera' 
    ? (selectedClient.tariffs || []).filter(t => t.portfolio === selectedPortfolio)
    : (selectedClient?.tariffs || []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Directorio de Clientes</h2>
          <p className="text-on-surface-variant mt-1 text-sm font-medium">Gestión de Estudios Jurídicos, Abogados y sus Carteras.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Buscar cliente o cartera..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-outline text-sm focus:border-secondary outline-none transition-all rounded-2xl shadow-sm"
            />
          </div>
          <button className="p-3 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={handleAddClient}
            className="px-6 py-3 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Client List View */}
        {!selectedClient ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {filteredClients.map(client => (
              <div 
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setSelectedPortfolio(null);
                  setActiveTab('info');
                }}
                className="minimal-card cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm border transition-all group-hover:shadow-md",
                      client.type === 'Estudio Jurídico' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                      {client.type === 'Estudio Jurídico' ? <Building2 className="w-7 h-7" /> : <User className="w-7 h-7" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary leading-tight group-hover:text-secondary transition-colors line-clamp-1">{client.name}</h3>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">{client.rut}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-xs font-medium text-on-surface-variant">
                      <Briefcase className="w-4 h-4 mr-2 text-secondary" />
                      <span className="truncate">{client.type}</span>
                    </div>
                    
                    {client.portfolios.length > 0 && (
                      <div className="flex items-start text-xs font-medium text-on-surface-variant">
                        <Landmark className="w-4 h-4 mr-2 mt-0.5 text-tertiary" />
                        <div className="flex flex-wrap gap-1.5">
                          {client.portfolios.map((portfolio, idx) => (
                            <span key={idx} className="badge bg-surface-container text-on-surface-variant border-transparent">
                              {portfolio.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-outline/50 bg-surface-container/30 flex justify-between items-center">
                  <div className="flex items-center text-xs font-bold text-secondary">
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    {client.casesCount} {client.casesCount === 1 ? 'Causa' : 'Causas'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
            
            {filteredClients.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-dashed border-outline rounded-3xl">
                <User className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-bold text-primary">No se encontraron clientes</h3>
                <p className="text-on-surface-variant text-sm mt-1">Intente con otros términos de búsqueda.</p>
              </div>
            )}
          </div>
        ) : (
          /* Client Details View (Drill-down) */
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300 min-w-0">
            <div className="mb-6">
              <button 
                onClick={() => {
                  setSelectedClientId(null);
                  setSelectedPortfolio(null);
                }}
                className="flex items-center gap-2 p-3 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold">Volver al Directorio</span>
              </button>
            </div>
            
            <div className="minimal-card flex-1 flex flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="p-8 border-b border-outline bg-surface-container/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-20 h-20 flex items-center justify-center rounded-3xl border shadow-xl",
                    selectedClient.type === 'Estudio Jurídico' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                  )}>
                    {selectedClient.type === 'Estudio Jurídico' ? <Building2 className="w-10 h-10" /> : <User className="w-10 h-10" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary tracking-tight">{selectedClient.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="badge bg-white border-outline text-on-surface-variant font-bold">{selectedClient.rut}</span>
                      <span className="text-sm text-on-surface-variant font-medium flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-secondary" />
                        {selectedClient.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleEditClient(selectedClient)}
                    className="p-3 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm"
                    title="Editar Cliente"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedClient.id)}
                    className="p-3 bg-white border border-outline text-on-surface-variant hover:text-error hover:border-error transition-all rounded-2xl shadow-sm"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-outline px-8 bg-white">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "py-4 px-6 text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2",
                    activeTab === 'info' ? "border-secondary text-secondary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Información General
                </button>
                <button 
                  onClick={() => setActiveTab('tariffs')}
                  className={cn(
                    "py-4 px-6 text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2",
                    activeTab === 'tariffs' ? "border-secondary text-secondary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Carteras y Aranceles
                </button>
              </div>

              {/* Content Area */}
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                
                {/* TAB: INFORMACIÓN GENERAL */}
                {activeTab === 'info' && (
                  <div className="space-y-10 animate-in fade-in duration-300 p-2">
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-primary tracking-tight">Datos de Contacto</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface-container/20 p-6 rounded-2xl border border-outline/50 shadow-sm">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Correo Electrónico</p>
                          <div className="text-sm font-semibold text-primary">
                            {selectedClient.email}
                          </div>
                        </div>
                        <div className="bg-surface-container/20 p-6 rounded-2xl border border-outline/50 shadow-sm">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Teléfono</p>
                          <div className="text-sm font-semibold text-primary">
                            {selectedClient.phone}
                          </div>
                        </div>
                        <div className="md:col-span-2 bg-surface-container/20 p-6 rounded-2xl border border-outline/50 shadow-sm">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Dirección Comercial</p>
                          <div className="flex items-start text-sm font-semibold text-primary">
                            <MapPin className="w-4 h-4 mr-3 text-secondary mt-0.5 flex-shrink-0" />
                            <span>{selectedClient.address}</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-primary tracking-tight">Resumen Operativo</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-outline/50 bg-white shadow-sm flex items-center justify-between group hover:border-secondary/50 transition-all">
                          <div>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Causas Activas</p>
                            <p className="text-3xl font-bold text-primary">{selectedClient.casesCount}</p>
                          </div>
                          <div className="w-14 h-14 bg-secondary/10 text-secondary flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                            <Briefcase className="w-7 h-7" />
                          </div>
                        </div>
                        <div className="p-6 rounded-2xl border border-outline/50 bg-white shadow-sm flex items-center justify-between group hover:border-success/50 transition-all">
                          <div>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Estado del Cliente</p>
                            <span className={cn(
                              "badge mt-2",
                              selectedClient.status === 'Activo' ? "badge-success" : "badge-error"
                            )}>
                              {selectedClient.status}
                            </span>
                          </div>
                          <div className={cn(
                            "w-14 h-14 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform",
                            selectedClient.status === 'Activo' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                          )}>
                            <CheckCircle2 className="w-7 h-7" />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: CARTERAS Y ARANCELES */}
                {activeTab === 'tariffs' && (
                  <div className="space-y-8 animate-in fade-in duration-300 p-2">
                    
                    {/* Modelo de Cobro Banner */}
                    <div className="flex items-center justify-between p-6 bg-surface-container/20 rounded-2xl border border-outline/50 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 text-secondary flex items-center justify-center rounded-xl">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Modelo de Cobro Aplicado</p>
                          <p className="text-base font-bold text-primary">{selectedClient.tariffType}</p>
                        </div>
                      </div>
                      {selectedClient.tariffType === 'Arancel Receptor' && (
                        <div className="bg-white px-4 py-2 rounded-xl border border-outline/50 text-xs text-on-surface-variant font-medium max-w-xs text-right shadow-sm">
                          Se aplican las tarifas estándar configuradas en su perfil de Receptor.
                        </div>
                      )}
                    </div>

                    {/* Portfolios Grid (If applicable) */}
                    {selectedClient.tariffType === 'Por Cartera' && selectedClient.portfolios.length > 0 && (
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-primary tracking-tight">Seleccione una Cartera</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {selectedClient.portfolios.map((portfolio, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setSelectedPortfolio(portfolio.name)}
                              className={cn(
                                "flex flex-col text-left p-6 border transition-all duration-300 rounded-2xl shadow-sm",
                                selectedPortfolio === portfolio.name 
                                  ? "bg-secondary/5 border-secondary ring-2 ring-secondary/20 shadow-md" 
                                  : "bg-white border-outline hover:border-secondary/50 hover:shadow-md"
                              )}
                            >
                              <span className={cn("text-sm font-bold tracking-tight mb-2", selectedPortfolio === portfolio.name ? "text-secondary" : "text-primary")}>
                                {portfolio.name}
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center">
                                <FileTextIcon className="w-3.5 h-3.5 mr-2 text-on-surface-variant/50" />
                                RUT: {portfolio.rut}
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Tariffs Table */}
                    {selectedClient.tariffType !== 'Arancel Receptor' && (
                      <section className="pt-2">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-primary tracking-tight">
                            {selectedClient.tariffType === 'Por Cartera' 
                              ? (selectedPortfolio ? `Aranceles: ${selectedPortfolio}` : 'Aranceles (Seleccione cartera)')
                              : 'Aranceles Acordados'}
                          </h3>
                          <div className="flex gap-3">
                            {(selectedClient.tariffType === 'Propio' || (selectedClient.tariffType === 'Por Cartera' && selectedPortfolio)) && (
                              <button 
                                onClick={handleAddTariff}
                                className="px-4 py-2 bg-white border border-secondary text-secondary hover:bg-secondary/5 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
                              >
                                <PlusCircle className="w-4 h-4" />
                                Agregar Arancel
                              </button>
                            )}
                            <button 
                              onClick={() => setShowAIModal(true)}
                              className="px-4 py-2 bg-secondary text-white hover:bg-secondary/90 transition-all text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-secondary/20"
                            >
                              <Sparkles className="w-4 h-4" />
                              Importar IA
                            </button>
                          </div>
                        </div>

                        {selectedClient.tariffType === 'Por Cartera' && !selectedPortfolio ? (
                          <div className="p-12 border-2 border-dashed border-outline rounded-3xl text-center bg-surface-container/10">
                            <Landmark className="w-12 h-12 text-on-surface-variant mx-auto mb-4 opacity-20" />
                            <p className="text-sm text-primary font-bold">Esperando selección</p>
                            <p className="text-xs text-on-surface-variant mt-2 max-w-sm mx-auto leading-relaxed">
                              Haga clic en una de las carteras administradas arriba para visualizar y gestionar sus aranceles específicos.
                            </p>
                          </div>
                        ) : (
                          <div className="border border-outline overflow-hidden bg-white shadow-xl rounded-2xl">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-surface-container/30 border-b border-outline">
                                  <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Servicio / Trámite</th>
                                  <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Valor (CLP)</th>
                                  <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider text-center w-32">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline/50">
                                {displayTariffs.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="p-10 text-center text-sm text-on-surface-variant font-medium italic">
                                      No hay aranceles registrados para esta vista.
                                    </td>
                                  </tr>
                                ) : (
                                  displayTariffs.map(tariff => (
                                    <tr key={tariff.id} className="hover:bg-surface-container/10 transition-colors group">
                                      <td className="p-4 text-sm text-primary font-semibold">{tariff.service}</td>
                                      <td className="p-4 text-sm font-bold text-secondary text-right">{formatCurrency(tariff.amount)}</td>
                                      <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                          <button onClick={() => handleEditTariff(tariff)} className="p-2 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-xl shadow-sm">
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDeleteTariff(tariff.id)} className="p-2 bg-white border border-outline text-on-surface-variant hover:text-error hover:border-error transition-all rounded-xl shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-outline bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setSelectedClientId(null);
                    setSelectedPortfolio(null);
                  }}
                  className="px-6 py-2 border border-outline text-on-surface text-[10px] uppercase tracking-[0.2em] font-bold rounded-none hover:bg-surface-container transition-all"
                >
                  Cerrar Vista
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tariff Edit/Add Modal */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-outline shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-container/30">
              <h2 className="text-xl font-bold text-primary tracking-tight">
                {editingTariff?.id ? 'Editar Arancel' : 'Nuevo Arancel'}
              </h2>
              <button onClick={() => setIsTariffModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {selectedClient?.tariffType === 'Por Cartera' && selectedPortfolio && (
                <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-2xl flex items-center gap-3">
                  <Landmark className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-bold text-secondary">Cartera: {selectedPortfolio}</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Servicio / Trámite (Modelo)</label>
                <select 
                  value={editingTariff?.service || ''}
                  onChange={(e) => setEditingTariff({ ...editingTariff, service: e.target.value })}
                  className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                >
                  <option value="" disabled>Seleccione un modelo...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Valor (CLP)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input 
                    type="number" 
                    value={editingTariff?.amount || ''}
                    onChange={(e) => setEditingTariff({ ...editingTariff, amount: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container/20 border border-outline text-sm font-bold focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline flex justify-end gap-3 bg-surface-container/10">
              <button 
                onClick={() => setIsTariffModalOpen(false)}
                className="px-6 py-3 text-on-surface-variant text-sm font-bold hover:bg-surface-container rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTariff}
                className="px-8 py-3 bg-secondary text-white text-sm font-bold rounded-2xl hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-lg shadow-secondary/20"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl border border-outline shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-outline flex justify-between items-center bg-secondary/10">
              <div className="flex items-center text-secondary">
                <Sparkles className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-bold tracking-tight">Procesamiento Inteligente de Aranceles</h2>
              </div>
              <button onClick={() => { setShowAIModal(false); setAiStep('upload'); }} className="p-2 hover:bg-white rounded-xl transition-colors text-secondary/50 hover:text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              {aiStep === 'upload' && (
                <div className="space-y-8 py-10">
                  <div className="text-center max-w-lg mx-auto">
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      Sube el documento enviado por el cliente (Excel, Word o PDF). La Inteligencia Artificial analizará el documento, extraerá los servicios y sus valores, y los mapeará automáticamente al sistema.
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all p-16 rounded-3xl flex flex-col items-center justify-center cursor-pointer group">
                    <div className="flex gap-6 mb-8 text-secondary/30 group-hover:text-secondary/60 transition-colors">
                      <FileSpreadsheet className="w-16 h-16" />
                      <FileTextIcon className="w-16 h-16" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">Arrastra el archivo aquí</h3>
                    <p className="text-sm text-on-surface-variant mb-8">o haz clic para explorar en tu equipo</p>
                    <button 
                      onClick={handleSimulateAIProcess}
                      className="px-8 py-4 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary/90 transition-all flex items-center gap-3 shadow-lg shadow-secondary/20"
                    >
                      <UploadCloud className="w-5 h-5" />
                      Seleccionar Archivo
                    </button>
                  </div>
                </div>
              )}

              {aiStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-24 space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-secondary/10 border-t-secondary rounded-full animate-spin"></div>
                    <Sparkles className="w-8 h-8 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-primary mb-2">Analizando Documento</h3>
                    <p className="text-sm text-on-surface-variant animate-pulse">Extrayendo servicios, carteras y valores mediante Gemini AI...</p>
                  </div>
                </div>
              )}

              {aiStep === 'review' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between bg-success/10 border border-success/20 p-6 rounded-2xl">
                    <div className="flex items-center text-success gap-4">
                      <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold">Extracción Exitosa</h4>
                        <p className="text-sm font-medium opacity-80">Se encontraron {extractedTariffs.length} tarifas en el documento.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-outline overflow-hidden rounded-2xl shadow-xl bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container/30 border-b border-outline">
                          <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Servicio Detectado</th>
                          <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Modelo de Biblioteca</th>
                          {selectedClient?.tariffType === 'Por Cartera' && (
                            <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Cartera Asignada</th>
                          )}
                          <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Valor (CLP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline/50">
                        {extractedTariffs.map((tariff, idx) => (
                          <tr key={tariff.id} className="hover:bg-surface-container/10 transition-colors">
                            <td className="p-4 text-sm text-on-surface-variant font-medium italic">
                              {tariff.detectedService}
                            </td>
                            <td className="p-4">
                              <select 
                                value={tariff.service} 
                                onChange={(e) => {
                                  const newTariffs = [...extractedTariffs];
                                  newTariffs[idx].service = e.target.value;
                                  setExtractedTariffs(newTariffs);
                                }}
                                className="w-full bg-surface-container/20 border border-outline rounded-xl p-2 text-sm font-semibold outline-none focus:border-secondary transition-all"
                              >
                                <option value="" disabled>Seleccione modelo...</option>
                                {templates.map(t => (
                                  <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                              </select>
                            </td>
                            {selectedClient?.tariffType === 'Por Cartera' && (
                              <td className="p-4">
                                <select 
                                  value={tariff.portfolio} 
                                  onChange={(e) => {
                                    const newTariffs = [...extractedTariffs];
                                    newTariffs[idx].portfolio = e.target.value;
                                    setExtractedTariffs(newTariffs);
                                  }}
                                  className="w-full bg-surface-container/20 border border-outline rounded-xl p-2 text-sm font-semibold outline-none focus:border-secondary transition-all"
                                >
                                  {selectedClient.portfolios.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                  ))}
                                  <option value="General">General</option>
                                </select>
                              </td>
                            )}
                            <td className="p-4">
                              <input 
                                type="number" 
                                value={tariff.amount} 
                                onChange={(e) => {
                                  const newTariffs = [...extractedTariffs];
                                  newTariffs[idx].amount = Number(e.target.value);
                                  setExtractedTariffs(newTariffs);
                                }}
                                className="w-full bg-surface-container/20 border border-outline rounded-xl p-2 text-sm font-bold text-right outline-none focus:border-secondary transition-all" 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium text-center italic">Puede editar los valores extraídos antes de guardarlos.</p>
                </div>
              )}
            </div>

            {aiStep === 'review' && (
              <div className="p-6 border-t border-outline flex justify-end gap-3 bg-surface-container/10">
                <button 
                  onClick={() => { setShowAIModal(false); setAiStep('upload'); }}
                  className="px-6 py-3 text-on-surface-variant text-sm font-bold hover:bg-surface-container rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAITariffs}
                  className="px-8 py-3 bg-secondary text-white text-sm font-bold rounded-2xl hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-lg shadow-secondary/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar Aranceles
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl border border-outline shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-container/30">
              <h2 className="text-xl font-bold text-primary tracking-tight">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Tipo de Cliente</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all"
                  >
                    <option value="Abogado Independiente">Abogado Independiente</option>
                    <option value="Estudio Jurídico">Estudio Jurídico</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Tipo de Arancel</label>
                  <select 
                    value={formData.tariffType}
                    onChange={(e) => setFormData({...formData, tariffType: e.target.value as any})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all"
                  >
                    <option value="Arancel Receptor">Arancel Receptor (Por defecto)</option>
                    <option value="Propio">Propio</option>
                    <option value="Por Cartera">Por Cartera</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">RUT Cliente</label>
                  <input 
                    type="text" 
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: formatRut(e.target.value)})}
                    className={cn(
                      "w-full p-4 bg-surface-container/20 border text-sm font-medium outline-none rounded-2xl transition-all",
                      formData.rut && validateRut(formData.rut).isComplete
                        ? (validateRut(formData.rut).isValid ? "border-success text-success focus:border-success" : "border-error text-error focus:border-error")
                        : "border-outline focus:border-secondary"
                    )}
                    placeholder="12.345.678-9" 
                  />
                  {formData.rut && validateRut(formData.rut).isComplete && (
                    <p className={cn(
                      "text-xs mt-1 font-medium ml-1",
                      validateRut(formData.rut).isValid ? "text-success" : "text-error"
                    )}>
                      {validateRut(formData.rut).message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nombre o Razón Social</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="Nombre completo" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="correo@ejemplo.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="+56 9 1234 5678" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Día de Cierre (Facturación)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="31"
                    value={formData.closingDay || ''}
                    onChange={(e) => setFormData({...formData, closingDay: Number(e.target.value)})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="Ej: 25" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Forma de Pago</label>
                  <select 
                    value={formData.paymentTerm || '30_dias'}
                    onChange={(e) => setFormData({...formData, paymentTerm: e.target.value as any})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all"
                  >
                    <option value="inmediato">Inmediato / Anticipado</option>
                    <option value="10_dias">10 Días</option>
                    <option value="30_dias">30 Días</option>
                    <option value="45_dias">45 Días</option>
                  </select>
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-2">Prioridad</label>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isVip: !formData.isVip})}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-300",
                      formData.isVip 
                        ? "bg-secondary/10 border-secondary text-secondary shadow-sm shadow-secondary/10" 
                        : "bg-surface-container/20 border-outline text-on-surface-variant hover:border-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                        formData.isVip ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"
                      )}>
                        <Sparkles className={cn("w-4 h-4", formData.isVip && "animate-pulse")} />
                      </div>
                      <span className="text-sm font-bold">Cliente VIP</span>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors duration-300",
                      formData.isVip ? "bg-secondary" : "bg-outline"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                        formData.isVip ? "left-6" : "left-1"
                      )} />
                    </div>
                  </button>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Dirección</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full p-4 bg-surface-container/20 border border-outline text-sm font-medium focus:border-secondary outline-none rounded-2xl transition-all" 
                    placeholder="Calle, Número, Comuna, Ciudad" 
                  />
                </div>
              </div>

              {/* Portfolios Section in Modal */}
              <div className="border-t border-outline pt-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary tracking-tight">Carteras Administradas</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">Agregue las instituciones y sus RUT para la facturación.</p>
                  </div>
                  <button 
                    onClick={handleAddPortfolio}
                    className="px-4 py-2 bg-white border border-secondary text-secondary text-xs font-bold rounded-xl hover:bg-secondary/5 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Cartera
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.portfolios?.map((portfolio, idx) => (
                    <div key={idx} className="flex items-end gap-4 bg-surface-container/10 p-6 rounded-2xl border border-outline/50 shadow-sm animate-in slide-in-from-right-4 duration-300">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Nombre Institución</label>
                        <input 
                          type="text" 
                          value={portfolio.name}
                          onChange={(e) => handlePortfolioChange(idx, 'name', e.target.value)}
                          className="w-full p-3 bg-white border border-outline text-sm font-semibold focus:border-secondary outline-none rounded-xl transition-all" 
                          placeholder="Ej: Banco Estado" 
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">RUT Institución</label>
                        <input 
                          type="text" 
                          value={portfolio.rut}
                          onChange={(e) => handlePortfolioChange(idx, 'rut', e.target.value)}
                          className={cn(
                            "w-full p-3 bg-white border text-sm font-semibold outline-none rounded-xl transition-all",
                            portfolio.rut && validateRut(portfolio.rut).isComplete
                              ? (validateRut(portfolio.rut).isValid ? "border-success text-success focus:border-success" : "border-error text-error focus:border-error")
                              : "border-outline focus:border-secondary"
                          )}
                          placeholder="Ej: 97.036.000-K" 
                        />
                        {portfolio.rut && validateRut(portfolio.rut).isComplete && (
                          <p className={cn(
                            "text-[10px] mt-1 font-medium ml-1",
                            validateRut(portfolio.rut).isValid ? "text-success" : "text-error"
                          )}>
                            {validateRut(portfolio.rut).message}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRemovePortfolio(idx)}
                        className="p-3 text-error hover:bg-error/10 rounded-xl transition-all mb-0.5"
                        title="Eliminar Cartera"
                      >
                        <MinusCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {(!formData.portfolios || formData.portfolios.length === 0) && (
                    <div className="text-center py-10 border-2 border-dashed border-outline rounded-2xl bg-surface-container/5">
                      <Landmark className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-20" />
                      <p className="text-xs text-on-surface-variant font-medium italic">No hay carteras registradas para este cliente.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline flex justify-end gap-3 bg-surface-container/10">
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="px-6 py-3 text-on-surface-variant text-sm font-bold hover:bg-surface-container rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveClient}
                className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Save className="w-4 h-4" />
                {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
