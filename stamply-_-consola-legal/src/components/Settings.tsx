import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cloud, Database, Shield, Key, CheckCircle2, User, Mail, Lock, Camera, Users, Building, DollarSign, FileText, Edit3, Save, RotateCcw, Eye, AlertCircle } from 'lucide-react';
import { cn, formatRut, validateRut } from '../lib/utils';

// Tipos de trámite y aranceles oficiales de referencia (Ministerio de Justicia Chile)
const TRAMITE_TYPES = [
  { key: 'notificacion_personal', label: 'Notificación Personal (Art. 40 CPC)', defaultAmount: 45000 },
  { key: 'busqueda_art44', label: 'Búsqueda (Art. 44 CPC)', defaultAmount: 15000 },
  { key: 'notificacion_art44', label: 'Notificación Art. 44', defaultAmount: 30000 },
  { key: 'requerimiento_pago', label: 'Requerimiento de Pago', defaultAmount: 50000 },
  { key: 'embargo', label: 'Embargo', defaultAmount: 80000 },
  { key: 'lanzamiento', label: 'Lanzamiento', defaultAmount: 90000 },
  { key: 'receptor_parte', label: 'Receptor Parte', defaultAmount: 25000 },
  { key: 'certificado_rebeldia', label: 'Certificado de Rebeldía', defaultAmount: 20000 },
  { key: 'notificacion_ley17322', label: 'Notificación Ley 17.322', defaultAmount: 25000 },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'integration' | 'receiver' | 'profiles' | 'aranceles' | 'estampe'>('integration');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receptorRut, setReceptorRut] = useState('12.345.678-9');

  // Aranceles del receptor
  const [aranceles, setAranceles] = useState(
    TRAMITE_TYPES.map(t => ({ ...t, amount: t.defaultAmount, isActive: true, notes: '' }))
  );
  const [arancelesEdited, setArancelesEdited] = useState(false);

  const handleArancelChange = (key: string, field: 'amount' | 'isActive' | 'notes', value: any) => {
    setAranceles(prev => prev.map(a => a.key === key ? { ...a, [field]: value } : a));
    setArancelesEdited(true);
  };

  const resetAranceles = () => {
    setAranceles(TRAMITE_TYPES.map(t => ({ ...t, amount: t.defaultAmount, isActive: true, notes: '' })));
    setArancelesEdited(false);
  };

  const formatCLP = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  // Configuración base del estampe
  const [estampeConfig, setEstampeConfig] = useState({
    receptorNombre: 'Juan Pérez González',
    receptorRut: '12.345.678-9',
    receptorCargo: 'Receptor Judicial',
    receptorTribunal: 'Primer Juzgado Civil de Santiago',
    receptorDomicilio: 'Huérfanos 1234, Of. 56, Santiago',
    receptorTelefono: '+56 9 1234 5678',
    footerTemplate: 'Causa Rol {{ROL}} del {{TRIBUNAL}} — Diligencia ejecutada el {{FECHA}}',
    footerIncludePageNumbers: true,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 25,
  });
  const [showEstampePreview, setShowEstampePreview] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsDriveConnected(data.connected);
      setConnectedEmail(data.email || null);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    if (isDriveConnected) {
      // Disconnect
      try {
        await fetch('/api/auth/disconnect', { method: 'POST' });
        setIsDriveConnected(false);
        setConnectedEmail(null);
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      return;
    }

    // Connect
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Por favor, permita las ventanas emergentes (popups) para conectar la cuenta.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Error al iniciar la conexión con Google Drive.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-bold text-primary tracking-tight">Configuración</h2>
        <p className="text-on-surface-variant mt-1 text-sm font-medium">Gestione su perfil, integraciones y preferencias del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Settings Navigation */}
        <div className="col-span-1 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('integration')}
            className={cn(
              "flex items-center p-4 text-sm font-bold transition-all rounded-2xl",
              activeTab === 'integration' 
                ? "bg-secondary/10 text-secondary border border-secondary/20" 
                : "bg-white border border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
            )}
          >
            <Cloud className="w-4 h-4 mr-3" />
            Integración
          </button>
          <button 
            onClick={() => setActiveTab('receiver')}
            className={cn(
              "flex items-center p-4 text-sm font-bold transition-all rounded-2xl",
              activeTab === 'receiver' 
                ? "bg-secondary/10 text-secondary border border-secondary/20" 
                : "bg-white border border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
            )}
          >
            <Building className="w-4 h-4 mr-3" />
            Datos del Receptor
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={cn(
              "flex items-center p-4 text-sm font-bold transition-all rounded-2xl",
              activeTab === 'profiles'
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : "bg-white border border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
            )}
          >
            <Users className="w-4 h-4 mr-3" />
            Crear Perfiles
          </button>
          <div className="h-px bg-outline/50 my-1" />
          <button
            onClick={() => setActiveTab('aranceles')}
            className={cn(
              "flex items-center p-4 text-sm font-bold transition-all rounded-2xl",
              activeTab === 'aranceles'
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : "bg-white border border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
            )}
          >
            <DollarSign className="w-4 h-4 mr-3" />
            Aranceles
          </button>
          <button
            onClick={() => setActiveTab('estampe')}
            className={cn(
              "flex items-center p-4 text-sm font-bold transition-all rounded-2xl",
              activeTab === 'estampe'
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : "bg-white border border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
            )}
          >
            <FileText className="w-4 h-4 mr-3" />
            Config. Estampe
          </button>
        </div>

        {/* Settings Content */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {activeTab === 'integration' && (
            <>
              <div className="minimal-card p-8 bg-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary flex items-center">
                      <Cloud className="w-5 h-5 mr-2" />
                      Google Drive (Respaldo Central)
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 font-medium">
                      Conecte la cuenta central de Google Drive del sistema. Todos los documentos firmados por cualquier usuario se respaldarán automáticamente en esta cuenta.
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg border",
                    isLoading ? "bg-surface-container border-outline text-on-surface-variant" :
                    isDriveConnected ? "bg-success/10 border-success/20 text-success" : "bg-surface-container border-outline text-on-surface-variant"
                  )}>
                    {isLoading ? 'Cargando...' : isDriveConnected ? `Conectado${connectedEmail ? ` (${connectedEmail})` : ''}` : 'Desconectado'}
                  </div>
                </div>

                <div className="p-4 bg-surface-container/30 rounded-xl border border-outline mb-6">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Carpeta de Destino
                  </label>
                  <input 
                    type="text" 
                    disabled={!isDriveConnected}
                    defaultValue={isDriveConnected ? "Stamply_Documentos_Firmados" : ""}
                    placeholder="Ej: Stamply_Documentos"
                    className="w-full p-3 bg-white border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl disabled:opacity-50 disabled:bg-surface-container/50"
                  />
                </div>

                <button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className={cn(
                    "px-6 py-3 font-bold text-sm rounded-xl transition-all flex items-center justify-center w-full md:w-auto disabled:opacity-50",
                    isDriveConnected 
                      ? "border border-error text-error hover:bg-error/5" 
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {isLoading ? 'Verificando...' : isDriveConnected ? 'Desconectar Cuenta Central' : 'Conectar Cuenta Central'}
                </button>
              </div>

              <div className="minimal-card p-8 bg-white opacity-50 pointer-events-none">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary flex items-center">
                      <Cloud className="w-5 h-5 mr-2" />
                      Dropbox
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 font-medium">
                      Respaldo alternativo en Dropbox. (Próximamente)
                    </p>
                  </div>
                  <div className="px-3 py-1 text-xs font-bold rounded-lg border bg-surface-container border-outline text-on-surface-variant">
                    Próximamente
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'receiver' && (
            <div className="minimal-card p-8 bg-white">
              <h3 className="text-xl font-bold text-primary tracking-tight mb-6">Datos del Receptor</h3>
              <p className="text-sm text-on-surface-variant font-medium mb-8">Configure la información oficial del receptor judicial que aparecerá en los documentos.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Identificación</label>
                  <select className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl">
                    <option value="receptor">Receptor Judicial</option>
                    <option value="receptora">Receptora Judicial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre Completo</label>
                  <input type="text" defaultValue="Juan Pérez González" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">RUT</label>
                  <input 
                    type="text" 
                    value={receptorRut}
                    onChange={(e) => setReceptorRut(formatRut(e.target.value))}
                    className={cn(
                      "w-full p-3 bg-surface-container/30 border text-sm outline-none transition-all rounded-xl",
                      receptorRut && validateRut(receptorRut).isComplete
                        ? (validateRut(receptorRut).isValid ? "border-success text-success focus:border-success" : "border-error text-error focus:border-error")
                        : "border-outline focus:border-primary"
                    )} 
                  />
                  {receptorRut && validateRut(receptorRut).isComplete && (
                    <p className={cn(
                      "text-xs mt-1 font-medium",
                      validateRut(receptorRut).isValid ? "text-success" : "text-error"
                    )}>
                      {validateRut(receptorRut).message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Jurisdicción / Tribunal</label>
                  <input type="text" defaultValue="Corte de Apelaciones de Santiago" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Dirección Oficial</label>
                  <input type="text" defaultValue="Huérfanos 1234, Of. 56" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Comuna</label>
                  <input type="text" defaultValue="Santiago" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Correo Electrónico</label>
                  <input type="email" defaultValue="j.perez@receptores.cl" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Número de Contacto</label>
                  <input type="tel" defaultValue="+56 9 1234 5678" className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all">
                  Guardar Datos
                </button>
              </div>
            </div>
          )}

          {/* ── ARANCELES ── */}
          {activeTab === 'aranceles' && (
            <div className="space-y-6">
              <div className="minimal-card p-8 bg-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-secondary" />
                      Aranceles del Receptor
                    </h3>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">
                      Configure los montos por tipo de trámite. Estos valores se aplican cuando el cliente usa "Arancel Receptor".
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetAranceles}
                      className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-container transition-all"
                      title="Restaurar valores por defecto"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </button>
                    {arancelesEdited && (
                      <button
                        onClick={() => { setArancelesEdited(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Guardar
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-outline rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-surface-container/30 border-b border-outline p-4">
                    <div className="col-span-5 text-xs font-bold text-primary uppercase tracking-wider">Tipo de Trámite</div>
                    <div className="col-span-3 text-xs font-bold text-primary uppercase tracking-wider text-right">Monto (CLP)</div>
                    <div className="col-span-2 text-xs font-bold text-primary uppercase tracking-wider text-center">Activo</div>
                    <div className="col-span-2 text-xs font-bold text-primary uppercase tracking-wider text-center">Notas</div>
                  </div>
                  <div className="divide-y divide-outline/50">
                    {aranceles.map(arancel => (
                      <div key={arancel.key} className={cn("grid grid-cols-12 items-center p-4 gap-3 transition-colors", !arancel.isActive && "opacity-40")}>
                        <div className="col-span-5">
                          <p className="text-sm font-medium text-on-surface">{arancel.label}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Por defecto: {formatCLP(arancel.defaultAmount)}</p>
                        </div>
                        <div className="col-span-3 text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">$</span>
                            <input
                              type="number"
                              value={arancel.amount}
                              onChange={e => handleArancelChange(arancel.key, 'amount', Number(e.target.value))}
                              disabled={!arancel.isActive}
                              className="w-full pl-6 pr-3 py-2 border border-outline bg-surface-container/30 text-sm font-bold text-right focus:border-primary outline-none rounded-xl disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={arancel.isActive}
                              onChange={e => handleArancelChange(arancel.key, 'isActive', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <input
                            type="text"
                            value={arancel.notes}
                            onChange={e => handleArancelChange(arancel.key, 'notes', e.target.value)}
                            placeholder="—"
                            className="w-full px-2 py-1.5 border border-outline/50 bg-transparent text-xs focus:border-primary outline-none rounded-lg text-center text-on-surface-variant"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-secondary/5 border border-secondary/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-secondary font-medium leading-relaxed">
                    Estos aranceles se usan como valores base del receptor. Los clientes con tarifas propias o "Por Cartera" conservarán sus valores configurados en su ficha.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIGURACIÓN DEL ESTAMPE ── */}
          {activeTab === 'estampe' && (
            <div className="space-y-6">
              <div className="minimal-card p-8 bg-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary" />
                      Configuración Base del Estampe
                    </h3>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">
                      Configure el encabezado y pie de página que aparecen en todos los estampes generados.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEstampePreview(!showEstampePreview)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-xl transition-all",
                      showEstampePreview ? "bg-secondary text-white border-secondary" : "border-outline text-on-surface-variant hover:border-secondary hover:text-secondary"
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    {showEstampePreview ? 'Ocultar Preview' : 'Ver Preview'}
                  </button>
                </div>

                <div className={cn("grid gap-8", showEstampePreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
                  {/* Formulario */}
                  <div className="space-y-8">
                    {/* Encabezado */}
                    <section>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 pb-2 border-b border-outline">
                        Encabezado — Datos del Receptor
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre Completo</label>
                          <input type="text" value={estampeConfig.receptorNombre} onChange={e => setEstampeConfig({...estampeConfig, receptorNombre: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">RUT</label>
                          <input type="text" value={estampeConfig.receptorRut} onChange={e => setEstampeConfig({...estampeConfig, receptorRut: formatRut(e.target.value)})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Cargo</label>
                          <select value={estampeConfig.receptorCargo} onChange={e => setEstampeConfig({...estampeConfig, receptorCargo: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl appearance-none">
                            <option value="Receptor Judicial">Receptor Judicial</option>
                            <option value="Receptora Judicial">Receptora Judicial</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tribunal / Jurisdicción</label>
                          <input type="text" value={estampeConfig.receptorTribunal} onChange={e => setEstampeConfig({...estampeConfig, receptorTribunal: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Domicilio Oficial</label>
                          <input type="text" value={estampeConfig.receptorDomicilio} onChange={e => setEstampeConfig({...estampeConfig, receptorDomicilio: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Teléfono</label>
                          <input type="tel" value={estampeConfig.receptorTelefono} onChange={e => setEstampeConfig({...estampeConfig, receptorTelefono: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                      </div>
                    </section>

                    {/* Pie de página */}
                    <section>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 pb-2 border-b border-outline">
                        Pie de Página — Variables de la Causa
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                            Plantilla del Pie
                            <span className="ml-2 font-normal normal-case text-secondary">Variables: {'{{ROL}}'} {'{{TRIBUNAL}}'} {'{{FECHA}}'}</span>
                          </label>
                          <textarea
                            value={estampeConfig.footerTemplate}
                            onChange={e => setEstampeConfig({...estampeConfig, footerTemplate: e.target.value})}
                            rows={3}
                            className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl resize-none font-mono"
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-surface-container/20 rounded-xl border border-outline/50">
                          <div>
                            <p className="text-xs font-bold text-primary">Numeración de páginas</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">Mostrar número de página en el pie</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={estampeConfig.footerIncludePageNumbers} onChange={e => setEstampeConfig({...estampeConfig, footerIncludePageNumbers: e.target.checked})} />
                            <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                      </div>
                    </section>

                    {/* Formato */}
                    <section>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 pb-2 border-b border-outline">
                        Formato del Documento
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Fuente</label>
                          <select value={estampeConfig.fontFamily} onChange={e => setEstampeConfig({...estampeConfig, fontFamily: e.target.value})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl appearance-none">
                            <option>Times New Roman</option>
                            <option>Arial</option>
                            <option>Calibri</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tamaño</label>
                          <input type="number" min={8} max={16} value={estampeConfig.fontSize} onChange={e => setEstampeConfig({...estampeConfig, fontSize: Number(e.target.value)})} className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Margen Sup.</label>
                          <div className="relative">
                            <input type="number" min={10} max={60} value={estampeConfig.marginTop} onChange={e => setEstampeConfig({...estampeConfig, marginTop: Number(e.target.value)})} className="w-full p-3 pr-8 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant font-bold">mm</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Margen Inf.</label>
                          <div className="relative">
                            <input type="number" min={10} max={60} value={estampeConfig.marginBottom} onChange={e => setEstampeConfig({...estampeConfig, marginBottom: Number(e.target.value)})} className="w-full p-3 pr-8 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none rounded-xl" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant font-bold">mm</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Preview */}
                  {showEstampePreview && (
                    <div className="lg:sticky lg:top-4 h-fit">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Vista Previa</h4>
                      <div className="border-2 border-outline rounded-2xl overflow-hidden bg-white shadow-lg" style={{ fontFamily: estampeConfig.fontFamily, fontSize: `${estampeConfig.fontSize}px` }}>
                        {/* Header preview */}
                        <div className="p-6 border-b-2 border-outline bg-surface-container/10">
                          <div className="text-center space-y-1">
                            <p className="font-bold text-primary uppercase tracking-wide" style={{ fontSize: `${estampeConfig.fontSize + 1}px` }}>
                              {estampeConfig.receptorCargo.toUpperCase()}
                            </p>
                            <p className="font-bold" style={{ fontSize: `${estampeConfig.fontSize + 2}px` }}>{estampeConfig.receptorNombre}</p>
                            <p className="text-on-surface-variant">RUT: {estampeConfig.receptorRut}</p>
                            <p className="text-on-surface-variant">{estampeConfig.receptorTribunal}</p>
                            <p className="text-on-surface-variant">{estampeConfig.receptorDomicilio}</p>
                            <p className="text-on-surface-variant">{estampeConfig.receptorTelefono}</p>
                          </div>
                        </div>
                        {/* Content placeholder */}
                        <div className="p-6">
                          <div className="h-24 flex items-center justify-center">
                            <p className="text-on-surface-variant text-xs italic text-center">[ Contenido del Estampe — editado en el Centro de Estampes ]</p>
                          </div>
                        </div>
                        {/* Footer preview */}
                        <div className="p-4 border-t border-outline bg-surface-container/10">
                          <div className="flex items-center justify-between">
                            <p className="text-on-surface-variant text-[11px]">
                              {estampeConfig.footerTemplate
                                .replace('{{ROL}}', 'C-1452-2023')
                                .replace('{{TRIBUNAL}}', '1er Juzgado Civil')
                                .replace('{{FECHA}}', new Date().toLocaleDateString('es-CL'))}
                            </p>
                            {estampeConfig.footerIncludePageNumbers && (
                              <p className="text-on-surface-variant text-[11px] font-bold">Pág. 1</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between items-center pt-4 border-t border-outline">
                  <p className="text-[10px] text-on-surface-variant font-medium italic flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    El contenido del acta se gestiona en el Centro de Estampes y SmartEstampe.
                  </p>
                  <button className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="minimal-card p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-primary tracking-tight">Gestión de Perfiles</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">Cree y administre cuentas para su equipo de trabajo.</p>
                </div>
                <button className="px-4 py-2 bg-secondary text-white font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all flex items-center">
                  <User className="w-4 h-4 mr-2" /> Nuevo Perfil
                </button>
              </div>

              <div className="border border-outline rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/30 border-b border-outline">
                      <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Usuario</th>
                      <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Rol</th>
                      <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Estado</th>
                      <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/50">
                    <tr className="hover:bg-surface-container/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">A</div>
                          <div>
                            <p className="text-sm font-bold text-primary">Admin Usuario</p>
                            <p className="text-xs text-on-surface-variant">admin@stamply.cl</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="badge badge-secondary">Administrador</span></td>
                      <td className="p-4"><span className="badge badge-success">Activo</span></td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-secondary hover:underline">Editar</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-xs">A</div>
                          <div>
                            <p className="text-sm font-bold text-primary">Asistente 1</p>
                            <p className="text-xs text-on-surface-variant">asistente@stamply.cl</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="badge bg-surface-container text-on-surface-variant">Asistente</span></td>
                      <td className="p-4"><span className="badge badge-success">Activo</span></td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-secondary hover:underline">Editar</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
