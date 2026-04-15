import React, { useState } from 'react';
import { Search, Filter, Edit2, MessageSquare, CheckCircle2, ArrowLeft, FileText, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Building2, Calendar, DollarSign, Download, CreditCard, AlertTriangle, Map, Plus, Trash2, ExternalLink, User } from 'lucide-react';
import { cn, formatDate, formatRut, validateRut } from '../lib/utils';
import { Client } from './Clients';

// Mock data actualizada con los nuevos campos
export const INITIAL_CASES = [
  {
    id: '1',
    rol: 'C-1452-2023',
    fechaIngreso: '2023-10-24',
    competencia: '1er Juzgado Civil de Santiago',
    cliente: 'Estudio Jurídico Silva & Cía',
    cartera: 'Hipotecario 2023',
    demandado: 'INVERSIONES Y ASESORIAS LIMITADA',
    domicilio: 'Av. Apoquindo 4501, Of 1201',
    comuna: 'Las Condes',
    fechaPjud: '2023-10-26',
    boleta: '145',
    fechaEmision: '2023-10-28',
    monto: '$45.000',
    estadoPago: 'Pagado',
    urgente: false,
    observations: 'Falta firma en documento adjunto. Se solicitó al cliente el 25/10.'
  },
  {
    id: '2',
    rol: 'C-892-2024',
    fechaIngreso: '2024-01-15',
    competencia: 'Corte de Apelaciones',
    cliente: 'Juan Pérez González',
    cartera: 'Cobranza 2024',
    demandado: 'JUAN PÉREZ GONZÁLEZ',
    domicilio: 'Pasaje Los Pinos 123',
    comuna: 'Maipú',
    fechaPjud: '2024-01-18',
    boleta: '146',
    fechaEmision: '2024-01-20',
    monto: '$60.000',
    estadoPago: 'Pendiente',
    urgente: true,
    observations: 'Dirección difícil de encontrar. Se requiere croquis.'
  },
  {
    id: '3',
    rol: 'C-331-2024',
    fechaIngreso: '2024-02-02',
    competencia: '3er Juzgado Civil',
    cliente: 'Defensa Deudores SpA',
    cartera: 'Castigo',
    demandado: 'COMERCIALIZADORA DEL SUR SPA',
    domicilio: 'Gran Avenida 4550',
    comuna: 'San Miguel',
    fechaPjud: '2024-02-05',
    boleta: '147',
    fechaEmision: '2024-02-10',
    monto: '$55.000',
    estadoPago: 'Atrasado',
    urgente: false,
    observations: 'Notificado personalmente al representante legal.'
  },
  {
    id: '4',
    rol: 'C-552-2024',
    fechaIngreso: '2024-03-22',
    competencia: '2do Juzgado Civil',
    cliente: 'Estudio Jurídico Silva & Cía',
    cartera: 'Cobranza 2024',
    demandado: 'PEDRO SOTO',
    domicilio: 'Huérfanos 1160',
    comuna: 'Santiago',
    fechaPjud: '2024-03-25',
    boleta: '148',
    fechaEmision: '2024-03-26',
    monto: '$40.000',
    estadoPago: 'Pendiente',
    urgente: false,
    observations: 'Pendiente de notificación.'
  },
  {
    id: '5',
    rol: 'C-112-2024',
    fechaIngreso: '2024-03-25',
    competencia: '4to Juzgado Civil',
    cliente: 'Juan Pérez González',
    cartera: 'Hipotecario 2024',
    demandado: 'LUCÍA MÉNDEZ',
    domicilio: 'Irarrázaval 2000',
    comuna: 'Ñuñoa',
    fechaPjud: '2024-03-26',
    boleta: '149',
    fechaEmision: '2024-03-27',
    monto: '$50.000',
    estadoPago: 'Atrasado',
    urgente: false,
    observations: 'Domicilio cerrado en 2 visitas.'
  },
  {
    id: '6',
    rol: 'C-999-2024',
    fechaIngreso: '2024-03-26',
    competencia: '1er Juzgado Civil',
    cliente: 'Defensa Deudores SpA',
    cartera: 'Castigo',
    demandado: 'MARIO BROS',
    domicilio: 'Vicuña Mackenna 100',
    comuna: 'Providencia',
    fechaPjud: '2024-03-28',
    boleta: '150',
    fechaEmision: '2024-03-29',
    monto: '$35.000',
    estadoPago: 'Pendiente',
    urgente: false,
    observations: 'Se requiere nuevo domicilio.'
  },
  {
    id: '7',
    rol: 'C-777-2024',
    fechaIngreso: '2024-03-27',
    competencia: 'Corte de Apelaciones',
    cliente: 'Estudio Jurídico Silva & Cía',
    cartera: 'Cobranza 2024',
    demandado: 'LUIGI BROS',
    domicilio: 'Alameda 1000',
    comuna: 'Santiago',
    fechaPjud: '2024-03-29',
    boleta: '151',
    fechaEmision: '2024-03-30',
    monto: '$45.000',
    estadoPago: 'Pagado',
    urgente: false,
    observations: 'Notificación exitosa.'
  },
  {
    id: '8',
    rol: 'C-888-2024',
    fechaIngreso: '2024-03-28',
    competencia: '3er Juzgado Civil',
    cliente: 'Juan Pérez González',
    cartera: 'Hipotecario 2024',
    demandado: 'BOWSER',
    domicilio: 'Américo Vespucio 5000',
    comuna: 'Macul',
    fechaPjud: '2024-03-30',
    boleta: '152',
    fechaEmision: '2024-04-01',
    monto: '$70.000',
    estadoPago: 'Pendiente',
    urgente: true,
    observations: 'Urgente por plazo judicial.'
  },
  {
    id: '9',
    rol: 'C-111-2024',
    fechaIngreso: '2024-03-29',
    competencia: '2do Juzgado Civil',
    cliente: 'Defensa Deudores SpA',
    cartera: 'Castigo',
    demandado: 'TOAD',
    domicilio: 'Florida 123',
    comuna: 'La Florida',
    fechaPjud: '2024-04-02',
    boleta: '153',
    fechaEmision: '2024-04-03',
    monto: '$30.000',
    estadoPago: 'Pendiente',
    urgente: false,
    observations: 'En ruta.'
  },
  {
    id: '10',
    rol: 'C-222-2024',
    fechaIngreso: '2024-03-30',
    competencia: '4to Juzgado Civil',
    cliente: 'Estudio Jurídico Silva & Cía',
    cartera: 'Cobranza 2024',
    demandado: 'YOSHI',
    domicilio: 'Pajaritos 4000',
    comuna: 'Maipú',
    fechaPjud: '2024-04-03',
    boleta: '154',
    fechaEmision: '2024-04-04',
    monto: '$55.000',
    estadoPago: 'Pendiente',
    urgente: false,
    observations: 'Pendiente de asignación.'
  }
];

export default function CasesList({ cases, setCases, setActiveTab, clients = [], setClients }: { cases: any[], setCases: (cases: any[]) => void, setActiveTab?: (tab: string) => void, clients?: Client[], setClients?: (clients: Client[]) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedCaseData, setSelectedCaseData] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [observationText, setObservationText] = useState('');
  const [editingCase, setEditingCase] = useState<any>(null);

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewPortfolioModal, setShowNewPortfolioModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ 
    name: '', 
    type: 'Abogado Independiente' as const,
    paymentTerm: 'inmediato' as const
  });
  const [newPortfolioData, setNewPortfolioData] = useState({ name: '' });

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });

  const filteredCases = cases.filter(c => 
    c.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.demandado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCases = React.useMemo(() => {
    let sortableItems = [...filteredCases];
    if (sortConfig.key !== '') {
      sortableItems.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCases, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaveObservation = (id: string) => {
    setCases(cases.map(c => c.id === id ? { ...c, observations: observationText } : c));
    if (selectedCaseData?.id === id) {
      setSelectedCaseData({ ...selectedCaseData, observations: observationText });
    }
    setSelectedCase(null);
    setObservationText('');
  };

  const handleSaveCase = () => {
    if (editingCase) {
      setCases(cases.map(c => c.id === editingCase.id ? editingCase : c));
      setSelectedCaseData(editingCase);
      setView('detail');
      setEditingCase(null);
    }
  };

  const openObservationModal = (c: any) => {
    setSelectedCase(c.id);
    setObservationText(c.observations);
  };

  const handleEditCase = (c: any) => {
    setEditingCase({ 
      ...c,
      defendants: c.defendants || [{
        name: c.demandado || '',
        rut: c.rutNotificado || '',
        address: c.domicilio || '',
        city: c.comuna || '',
        legalRep: ''
      }]
    });
    setView('edit');
  };

  const handleCreateClient = () => {
    if (!newClientData.name) {
      alert('Por favor ingrese un nombre.');
      return;
    }

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClientData.name,
      rut: '', // Se completa después
      type: newClientData.type,
      paymentTerm: newClientData.paymentTerm,
      tariffType: 'Arancel Receptor',
      portfolios: [],
      email: '',
      phone: '',
      address: '',
      status: 'Activo',
      casesCount: 0
    };

    if (setClients) {
      setClients([...clients, newClient]);
    }
    if (editingCase) {
      setEditingCase({ ...editingCase, cliente: newClient.name, cartera: '' });
    }
    setShowNewClientModal(false);
    setNewClientData({ name: '', type: 'Abogado Independiente', paymentTerm: 'inmediato' });
  };

  const handleCreatePortfolio = () => {
    if (!newPortfolioData.name) {
      alert('Por favor ingrese un nombre para la cartera.');
      return;
    }

    const updatedClients = clients.map(c => {
      if (c.name === editingCase?.cliente) {
        return {
          ...c,
          portfolios: [...c.portfolios, { name: newPortfolioData.name, rut: '' }]
        };
      }
      return c;
    });

    if (setClients) {
      setClients(updatedClients);
    }
    if (editingCase) {
      setEditingCase({ ...editingCase, cartera: newPortfolioData.name });
    }
    setShowNewPortfolioModal(false);
    setNewPortfolioData({ name: '' });
  };

  const handleEditDefendantChange = (index: number, field: string, value: string) => {
    if (!editingCase) return;
    const newDefendants = [...editingCase.defendants];
    
    if (field === 'rut') {
      newDefendants[index][field] = formatRut(value);
    } else {
      newDefendants[index][field] = value;
    }
    
    setEditingCase({ ...editingCase, defendants: newDefendants });
  };

  const handleAddEditDefendant = () => {
    if (!editingCase) return;
    setEditingCase({
      ...editingCase,
      defendants: [...editingCase.defendants, { name: '', rut: '', address: '', city: '', legalRep: '' }]
    });
  };

  const handleRemoveEditDefendant = (index: number) => {
    if (!editingCase) return;
    const newDefendants = [...editingCase.defendants];
    newDefendants.splice(index, 1);
    setEditingCase({ ...editingCase, defendants: newDefendants });
  };

  const handleViewDetail = (c: any) => {
    setSelectedCaseData(c);
    setView('detail');
  };

  const renderDetail = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between border-b border-outline pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('list')}
              className="p-2 hover:bg-surface-container transition-colors rounded-xl"
              title="Volver al listado"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">Detalle de Causa</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-medium">ROL: {selectedCaseData.rol}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleEditCase(selectedCaseData)}
              className="px-4 py-2 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" /> Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="minimal-card p-8 bg-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Información General</h3>
                {selectedCaseData.urgente && (
                  <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest rounded-full border border-error/20 animate-pulse">
                    Causa Urgente
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                  {selectedCaseData.demandante && (
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Demandante</p>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-primary">{selectedCaseData.demandante}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Demandado Principal</p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-primary">{selectedCaseData.demandado}</p>
                        <p className="text-xs text-on-surface-variant font-medium">{selectedCaseData.rutNotificado || 'RUT no registrado'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedCaseData.defendants && selectedCaseData.defendants.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Notificados ({selectedCaseData.defendants.length})</p>
                      <div className="space-y-3">
                        {selectedCaseData.defendants.map((def: any, idx: number) => (
                          <div key={idx} className="p-3 bg-surface-container/20 rounded-xl border border-outline">
                            <p className="text-sm font-bold text-primary">{def.name}</p>
                            <p className="text-xs text-on-surface-variant font-medium">{def.rut || 'Sin RUT'}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{def.address}, {def.city}</p>
                            {def.legalRep && <p className="text-[10px] text-secondary font-bold mt-1 uppercase">Rep: {def.legalRep}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!selectedCaseData.defendants || selectedCaseData.defendants.length === 0) && (
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Ubicación de Notificación</p>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{selectedCaseData.domicilio}</p>
                          <p className="text-xs text-on-surface-variant font-medium">{selectedCaseData.comuna}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tribunal y Competencia</p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-tertiary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{selectedCaseData.tribunal}</p>
                        <p className="text-xs text-on-surface-variant font-medium">{selectedCaseData.competencia}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Cliente / Cartera</p>
                    <div className="p-4 bg-surface-container/30 rounded-2xl border border-outline">
                      <p className="text-sm font-bold text-primary">{selectedCaseData.cliente}</p>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">{selectedCaseData.cartera}</p>
                      {selectedCaseData.numeroInterno && (
                        <p className="text-[10px] text-secondary font-bold mt-2 uppercase tracking-wider">N° Interno: {selectedCaseData.numeroInterno}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Fecha Ingreso</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                        <Calendar className="w-4 h-4 text-on-surface-variant" />
                        {formatDate(selectedCaseData.fechaIngreso)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Fecha PJUD</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                        <Calendar className="w-4 h-4 text-on-surface-variant" />
                        {formatDate(selectedCaseData.fechaPjud)}
                      </div>
                    </div>
                  </div>

                  {selectedCaseData.caratulaConservador && (
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Carátula Conservador</p>
                      <p className="text-sm font-bold text-on-surface">{selectedCaseData.caratulaConservador}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="minimal-card p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Observaciones y Bitácora</h3>
                <button 
                  onClick={() => openObservationModal(selectedCaseData)}
                  className="text-xs font-bold text-secondary hover:underline"
                >
                  Editar Observación
                </button>
              </div>
              <div className="space-y-4">
                {selectedCaseData.observations ? (
                  <div className="p-4 bg-surface-container/30 rounded-2xl border border-outline border-l-4 border-l-primary">
                    <p className="text-sm text-on-surface font-medium leading-relaxed">{selectedCaseData.observations}</p>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-outline rounded-2xl">
                    <p className="text-xs text-on-surface-variant font-medium">Sin observaciones registradas.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="minimal-card p-8 bg-white">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Detalles Financieros</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-outline/50">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Estado Pago</span>
                  <span className={cn(
                    "badge",
                    selectedCaseData.estadoPago === 'Pagado' ? "badge-success" :
                    selectedCaseData.estadoPago === 'Pendiente' ? "badge-warning" :
                    "badge-error"
                  )}>
                    {selectedCaseData.estadoPago}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-outline/50">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Boleta N°</span>
                  <span className="text-sm font-bold text-primary">{selectedCaseData.boleta}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-outline/50">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Fecha Emisión</span>
                  <span className="text-sm font-bold text-primary">{formatDate(selectedCaseData.fechaEmision)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest">Total Diligencia</span>
                  <span className="text-lg font-black text-secondary">{selectedCaseData.monto}</span>
                </div>
              </div>
            </section>

            <section className="minimal-card p-8 bg-white">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Documentos Firmados</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/5 rounded-xl border border-success/20 hover:border-success transition-colors cursor-pointer group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-success/10 text-success rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-success">Estampe_Firmado_{selectedCaseData.rol}.pdf</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-success hover:text-success/80" title="Descargar">
                      <Download className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-success group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <div className="p-4 text-center border border-dashed border-outline rounded-2xl">
                  <p className="text-[10px] text-on-surface-variant font-medium">Solo se muestran documentos con firma electrónica avanzada.</p>
                </div>
              </div>
            </section>

            <section className="minimal-card p-8 bg-white border-l-4 border-l-secondary">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setActiveTab?.('smart-estampe')}
                  className="w-full p-4 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-between hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <Edit2 className="w-5 h-5" />
                    <span>Generar Estampe</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => setActiveTab?.('map')}
                  className="w-full p-4 bg-white border border-outline text-primary rounded-2xl font-bold text-sm flex items-center justify-between hover:bg-surface-container transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-secondary" />
                    <span>Ver en Mapa de Ruta</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      const newStatus = selectedCaseData.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado';
                      setCases(cases.map(c => c.id === selectedCaseData.id ? { ...c, estadoPago: newStatus } : c));
                      setSelectedCaseData({ ...selectedCaseData, estadoPago: newStatus });
                    }}
                    className={cn(
                      "p-4 border rounded-2xl font-bold text-[10px] uppercase tracking-wider flex flex-col items-center gap-2 transition-all",
                      selectedCaseData.estadoPago === 'Pagado' ? "bg-success/5 border-success/20 text-success" : "bg-white border-outline text-on-surface-variant hover:border-success/50"
                    )}
                  >
                    <CreditCard className="w-5 h-5" />
                    {selectedCaseData.estadoPago === 'Pagado' ? 'Pago Registrado' : 'Registrar Pago'}
                  </button>

                  <button 
                    onClick={() => {
                      const newUrgent = !selectedCaseData.urgente;
                      setCases(cases.map(c => c.id === selectedCaseData.id ? { ...c, urgente: newUrgent } : c));
                      setSelectedCaseData({ ...selectedCaseData, urgente: newUrgent });
                    }}
                    className={cn(
                      "p-4 border rounded-2xl font-bold text-[10px] uppercase tracking-wider flex flex-col items-center gap-2 transition-all",
                      selectedCaseData.urgente ? "bg-error/5 border-error/20 text-error" : "bg-white border-outline text-on-surface-variant hover:border-error/50"
                    )}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    {selectedCaseData.urgente ? 'Urgente' : 'Marcar Urgente'}
                  </button>
                </div>

                <button 
                  onClick={() => alert('Generando ficha de causa en PDF...')}
                  className="w-full p-4 bg-surface-container/50 text-on-surface-variant rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-surface-container transition-all border border-outline border-dashed"
                >
                  <Download className="w-5 h-5" />
                  <span>Descargar Ficha Completa</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderEdit = () => {
    if (!editingCase) return null;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between border-b border-outline pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('detail')}
              className="p-2 hover:bg-surface-container transition-colors rounded-xl"
              title="Volver al detalle"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">Editar Causa</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-medium">ROL: {editingCase.rol}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-outline">
          <div className="space-y-10">
            {/* Datos Generales */}
            <section>
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2"/> Datos Generales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">ROL Causa</label>
                  <input type="text" value={editingCase.rol} onChange={e => setEditingCase({...editingCase, rol: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tribunal</label>
                  <input type="text" value={editingCase.tribunal || ''} onChange={e => setEditingCase({...editingCase, tribunal: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Competencia</label>
                  <select value={editingCase.competencia} onChange={e => setEditingCase({...editingCase, competencia: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none">
                    <option value="Corte Suprema">Corte Suprema</option>
                    <option value="Corte Apelaciones">Corte Apelaciones</option>
                    <option value="Civil">Civil</option>
                    <option value="Laboral">Laboral</option>
                    <option value="Penal">Penal</option>
                    <option value="Cobranza">Cobranza</option>
                    <option value="Familia">Familia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Demandante</label>
                  <input type="text" value={editingCase.demandante || ''} onChange={e => setEditingCase({...editingCase, demandante: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Demandado Principal</label>
                  <input type="text" value={editingCase.demandado} onChange={e => setEditingCase({...editingCase, demandado: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>
            </section>

            {/* Datos Internos */}
            <section>
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Datos Internos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Cliente</label>
                    <button onClick={() => setShowNewClientModal(true)} className="flex items-center text-xs font-bold text-secondary hover:underline transition-colors">
                      <Plus className="w-3 h-3 mr-1" /> Nuevo
                    </button>
                  </div>
                  <select value={editingCase.cliente} onChange={e => setEditingCase({...editingCase, cliente: e.target.value, cartera: ''})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none">
                    <option value="">Seleccione un cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Cartera</label>
                    {editingCase.cliente && (
                      <button onClick={() => setShowNewPortfolioModal(true)} className="flex items-center text-xs font-bold text-secondary hover:underline transition-colors">
                        <Plus className="w-3 h-3 mr-1" /> Nueva
                      </button>
                    )}
                  </div>
                  <select value={editingCase.cartera || ''} onChange={e => setEditingCase({...editingCase, cartera: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none" disabled={!editingCase.cliente}>
                    <option value="">Seleccione una cartera</option>
                    {clients.find(c => c.name === editingCase.cliente)?.portfolios.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">N° Interno</label>
                  <input type="text" value={editingCase.numeroInterno || ''} onChange={e => setEditingCase({...editingCase, numeroInterno: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Carátula Conservador</label>
                  <input type="text" value={editingCase.caratulaConservador || ''} onChange={e => setEditingCase({...editingCase, caratulaConservador: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>
            </section>

            {/* Notificados */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Notificados Propuestos</h4>
                <button onClick={handleAddEditDefendant} className="flex items-center text-xs font-bold text-secondary hover:underline transition-colors">
                  <Plus className="w-4 h-4 mr-1" /> Agregar Notificado
                </button>
              </div>
              
              <div className="space-y-4">
                {editingCase.defendants?.map((def: any, idx: number) => (
                  <div key={idx} className="p-6 border border-outline rounded-2xl bg-surface-container/30 relative group">
                    {editingCase.defendants.length > 1 && (
                      <button onClick={() => handleRemoveEditDefendant(idx)} className="absolute top-4 right-4 text-on-surface-variant hover:text-error hover:bg-error/10 p-2 rounded-xl transition-colors" title="Eliminar Notificado">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Notificado {idx + 1}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre / Razón Social</label>
                        <input type="text" value={def.name} onChange={e => handleEditDefendantChange(idx, 'name', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">RUT</label>
                        <input 
                          type="text" 
                          value={def.rut} 
                          onChange={e => handleEditDefendantChange(idx, 'rut', e.target.value)} 
                          className={cn(
                            "w-full border bg-white p-3 text-sm outline-none transition-all rounded-xl",
                            def.rut && validateRut(def.rut).isComplete 
                              ? (validateRut(def.rut).isValid ? "border-success text-success focus:border-success" : "border-error text-error focus:border-error") 
                              : "border-outline focus:border-primary"
                          )} 
                          placeholder="Ej. 19.176.464-1"
                        />
                        {def.rut && validateRut(def.rut).isComplete && (
                          <p className={cn(
                            "text-xs mt-1 font-medium",
                            validateRut(def.rut).isValid ? "text-success" : "text-error"
                          )}>
                            {validateRut(def.rut).message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Representante Legal</label>
                        <input type="text" value={def.legalRep || ''} onChange={e => handleEditDefendantChange(idx, 'legalRep', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Domicilio</label>
                        <input type="text" value={def.address} onChange={e => handleEditDefendantChange(idx, 'address', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Comuna</label>
                        <input type="text" value={def.city} onChange={e => handleEditDefendantChange(idx, 'city', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Finanzas y Otros */}
            <section>
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Finanzas y Otros</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Estado Pago</label>
                  <select 
                    value={editingCase.estadoPago}
                    onChange={e => setEditingCase({...editingCase, estadoPago: e.target.value})}
                    className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none"
                  >
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Valor Total</label>
                  <input 
                    type="text" 
                    value={editingCase.monto}
                    onChange={e => setEditingCase({...editingCase, monto: e.target.value})}
                    className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <button
                    type="button"
                    onClick={() => setEditingCase({...editingCase, urgente: !editingCase.urgente})}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 w-full font-bold text-[10px] uppercase tracking-widest",
                      editingCase.urgente 
                        ? "bg-error/10 border-error text-error" 
                        : "bg-surface-container/30 border-outline text-on-surface-variant hover:border-error/50"
                    )}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {editingCase.urgente ? "Causa Urgente" : "Marcar Urgente"}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-outline">
            <button 
              onClick={() => setView('detail')}
              className="px-6 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveCase}
              className="px-10 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="pb-12">
      {view === 'detail' && selectedCaseData && renderDetail()}
      
      {view === 'edit' && editingCase && renderEdit()}

      {view === 'list' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-primary tracking-tight">Gestión de Causas</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-medium">Administre y supervise el estado de sus expedientes judiciales.</p>
            </div>
            
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Buscar por ROL, demandado o cliente..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-outline text-sm focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all rounded-2xl shadow-sm"
                />
              </div>
              <button className="p-3.5 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="minimal-card bg-white overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-container/30 border-b border-outline">
                    <th className="sticky left-0 z-10 bg-surface-container/30 p-4 text-xs font-bold text-primary uppercase tracking-wider shadow-[1px_0_0_0_#e5e7eb] cursor-pointer hover:bg-surface-container/50 transition-colors" onClick={() => handleSort('rol')}>
                      <div className="flex items-center gap-1">
                        Rol
                        {sortConfig.key === 'rol' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-on-surface-variant/50" />}
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors text-center" onClick={() => handleSort('fechaIngreso')}>
                      <div className="flex items-center justify-center gap-1">
                        Ingreso
                        {sortConfig.key === 'fechaIngreso' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-on-surface-variant/50" />}
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors" onClick={() => handleSort('competencia')}>
                      <div className="flex items-center gap-1">
                        Competencia
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors" onClick={() => handleSort('cliente')}>
                      <div className="flex items-center gap-1">
                        Cliente / Cartera
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors" onClick={() => handleSort('demandado')}>
                      <div className="flex items-center gap-1">
                        Demandado
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">
                      Domicilio
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors text-center" onClick={() => handleSort('fechaPjud')}>
                      <div className="flex items-center justify-center gap-1">
                        PJUD
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">
                      Finanzas
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-colors" onClick={() => handleSort('estadoPago')}>
                      <div className="flex items-center gap-1">
                        Estado Pago
                      </div>
                    </th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/50">
                  {sortedCases.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container/10 transition-colors group cursor-pointer" onClick={() => handleViewDetail(c)}>
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-surface-container-low p-4 shadow-[1px_0_0_0_#e5e7eb] transition-colors">
                        <div className="font-bold text-primary text-sm">{c.rol}</div>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant text-center whitespace-nowrap">{formatDate(c.fechaIngreso)}</td>
                      <td className="p-4 text-sm text-on-surface-variant">{c.competencia}</td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-on-surface max-w-[160px] truncate" title={`${c.cliente} - ${c.cartera}`}>{c.cliente}</div>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[160px]">{c.cartera}</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-on-surface">{c.demandado}</td>
                      <td className="p-4">
                        <div className="text-sm text-on-surface max-w-[180px] truncate" title={c.domicilio}>{c.domicilio}</div>
                        <div className="text-[10px] text-on-surface-variant">{c.comuna}</div>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant text-center whitespace-nowrap">{formatDate(c.fechaPjud)}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-primary">{c.monto}</div>
                        <div className="text-[10px] text-on-surface-variant">Bol. #{c.boleta} • {formatDate(c.fechaEmision)}</div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "badge",
                          c.estadoPago === 'Pagado' ? "badge-success" :
                          c.estadoPago === 'Pendiente' ? "badge-warning" :
                          "badge-error"
                        )}>
                          {c.estadoPago}
                        </span>
                      </td>
                      <td className="p-4 relative group/obs">
                        <div className="flex items-start gap-2">
                          <div className="relative">
                            <p className="text-[11px] leading-tight text-on-surface-variant max-w-[180px] line-clamp-2 cursor-help">
                              {c.observations || <span className="italic opacity-50">Sin observaciones</span>}
                            </p>
                            {/* Hover Tooltip Elegante */}
                            {c.observations && (
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/obs:block w-64 p-3 bg-surface-container-lowest border border-outline rounded-xl shadow-xl z-50 text-xs text-on-surface whitespace-normal">
                                {c.observations}
                                <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-surface-container-lowest"></div>
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openObservationModal(c); }}
                            className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all shrink-0"
                            title="Editar Observación"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-outline/50">
              {sortedCases.map((c) => (
                <div key={c.id} className="p-4 hover:bg-surface-container/10 transition-colors cursor-pointer space-y-3" onClick={() => handleViewDetail(c)}>
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-primary text-base">{c.rol}</div>
                    <span className={cn(
                      "badge text-[10px]",
                      c.estadoPago === 'Pagado' ? "badge-success" :
                      c.estadoPago === 'Pendiente' ? "badge-warning" :
                      "badge-error"
                    )}>
                      {c.estadoPago}
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-sm font-bold text-on-surface">{c.demandado}</div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {c.comuna}
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Monto</div>
                      <div className="text-sm font-bold text-primary">{c.monto}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Cliente</div>
                       <div className="text-xs font-medium text-on-surface truncate max-w-[150px]">{c.cliente}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {sortedCases.length === 0 && (
              <div className="py-20 text-center bg-white">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-bold text-primary">No se encontraron causas</h3>
                <p className="text-on-surface-variant text-sm mt-1">Intenta con otros términos de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Observation Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-xl font-bold text-primary tracking-tight mb-6">Observaciones</h3>
            <textarea 
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              className="w-full h-40 border border-outline bg-surface-container/30 p-4 text-sm focus:border-primary outline-none transition-all rounded-2xl resize-none mb-8"
              placeholder="Ingrese observaciones para esta causa..."
            />
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setSelectedCase(null)}
                className="px-6 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSaveObservation(selectedCase)}
                className="px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary">Nuevo Cliente</h3>
              <button onClick={() => setShowNewClientModal(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre / Razón Social</label>
                <input 
                  type="text" 
                  value={newClientData.name}
                  onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                  className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl"
                  placeholder="Ej. Empresa SpA"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tipo de Cliente</label>
                <select 
                  value={newClientData.type}
                  onChange={e => setNewClientData({...newClientData, type: e.target.value as any})}
                  className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none"
                >
                  <option value="Abogado Independiente">Abogado Independiente</option>
                  <option value="Estudio Jurídico">Estudio Jurídico</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Persona Natural">Persona Natural</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Forma de Pago</label>
                <select 
                  value={newClientData.paymentTerm}
                  onChange={e => setNewClientData({...newClientData, paymentTerm: e.target.value as any})}
                  className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none"
                >
                  <option value="inmediato">Pago Inmediato</option>
                  <option value="15_dias">15 Días</option>
                  <option value="30_dias">30 Días</option>
                  <option value="45_dias">45 Días</option>
                  <option value="60_dias">60 Días</option>
                </select>
              </div>
              
              <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex items-start gap-3 mt-4">
                <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-secondary font-medium leading-relaxed">
                  Para una mejor operación del sistema, recuerde completar el resto de los datos (RUT, email, teléfono, dirección) posteriormente desde el módulo de Clientes.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="px-4 py-2 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateClient}
                className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
              >
                Crear Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Cartera */}
      {showNewPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary">Nueva Cartera</h3>
              <button onClick={() => setShowNewPortfolioModal(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre de la Cartera</label>
                <input 
                  type="text" 
                  value={newPortfolioData.name}
                  onChange={e => setNewPortfolioData({name: e.target.value})}
                  className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl"
                  placeholder="Ej. Cobranza 2024"
                />
              </div>
              
              <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex items-start gap-3 mt-4">
                <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-secondary font-medium leading-relaxed">
                  Esta cartera se asociará al cliente <strong>{editingCase?.cliente}</strong>. Puede agregar el RUT de la institución posteriormente desde el módulo de Clientes.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowNewPortfolioModal(false)}
                className="px-4 py-2 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreatePortfolio}
                className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
              >
                Crear Cartera
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
