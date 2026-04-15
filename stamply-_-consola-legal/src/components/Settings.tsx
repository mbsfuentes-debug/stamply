import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cloud, Database, Shield, Key, CheckCircle2, User, Mail, Lock, Camera, Users, Building } from 'lucide-react';
import { cn, formatRut, validateRut } from '../lib/utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'integration' | 'receiver' | 'profiles'>('integration');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receptorRut, setReceptorRut] = useState('12.345.678-9');

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
