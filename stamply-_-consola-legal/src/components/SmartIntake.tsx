import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { FileUp, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Save, ArrowLeft, Edit2 } from 'lucide-react';
import { cn, formatRut, validateRut } from '../lib/utils';
import { Client, Portfolio } from './Clients';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

interface Defendant {
  name: string;
  rut: string;
  address: string;
  city: string;
  legalRep: string;
}

interface CaseData {
  rolNumber: string;
  plaintiffName: string;
  defendantName: string;
  court: string;
  competencia: string;
  cliente: string;
  cartera: string;
  numeroInterno: string;
  caratulaConservador: string;
  isUrgent?: boolean;
  defendants: Defendant[];
}

interface SmartIntakeProps {
  clients?: Client[];
  setClients?: (clients: Client[]) => void;
  onSuccess?: (newCase: any) => void;
}

export default function SmartIntake({ clients = [], setClients, onSuccess }: SmartIntakeProps) {
  const [step, setStep] = useState<'upload' | 'edit' | 'success'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewPortfolioModal, setShowNewPortfolioModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ 
    name: '', 
    type: 'Abogado Independiente' as const,
    paymentTerm: 'inmediato' as const
  });
  const [newPortfolioData, setNewPortfolioData] = useState({ name: '' });

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
    if (formData) {
      setFormData({ ...formData, cliente: newClient.name, cartera: '' });
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
      if (c.name === formData?.cliente) {
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
    if (formData) {
      setFormData({ ...formData, cartera: newPortfolioData.name });
    }
    setShowNewPortfolioModal(false);
    setNewPortfolioData({ name: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || "application/pdf"
            }
          },
          {
            text: "Extrae la siguiente información legal del documento judicial adjunto. Si algún dato no existe, déjalo vacío. Proporciona un objeto JSON con: rolNumber (ROL CAUSA), plaintiffName (Demandante), defendantName (Demandado principal), court (Tribunal), competencia (Competencia, ej. Corte Suprema, Corte Apelaciones, Civil, Laboral, Penal, Cobranza, Familia). Además, propone una lista 'defendants' (Notificados propuestos) basándote en el demandado, su domicilio y ciudad extraídos del documento, donde cada notificado tenga name (Nombre o Razón social), rut (RUT si aparece, formato 12.345.678-9), address (Domicilio), city (Comuna/Ciudad), y legalRep (Representante legal, solo si existe)."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rolNumber: { type: Type.STRING, description: "Número de ROL de la causa" },
              plaintiffName: { type: Type.STRING, description: "Nombre del demandante" },
              defendantName: { type: Type.STRING, description: "Nombre del demandado principal" },
              court: { type: Type.STRING, description: "Tribunal de la causa" },
              competencia: { type: Type.STRING, description: "Competencia de la causa" },
              defendants: {
                type: Type.ARRAY,
                description: "Lista de notificados propuestos",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nombre o Razón Social del notificado" },
                    rut: { type: Type.STRING, description: "RUT del notificado" },
                    address: { type: Type.STRING, description: "Domicilio del notificado" },
                    city: { type: Type.STRING, description: "Comuna o Ciudad del notificado" },
                    legalRep: { type: Type.STRING, description: "Representante legal del notificado (si existe)" }
                  }
                }
              }
            },
            required: ["rolNumber", "plaintiffName", "defendantName", "defendants"]
          }
        }
      });

      let jsonStr = response.text?.trim() || "{}";
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const data = JSON.parse(jsonStr);
      
      setFormData({
        rolNumber: data.rolNumber || '',
        plaintiffName: data.plaintiffName || '',
        defendantName: data.defendantName || '',
        court: data.court || 'Corte de Apelaciones de Santiago',
        competencia: data.competencia || 'Civil',
        cliente: '',
        cartera: '',
        numeroInterno: '',
        caratulaConservador: '',
        defendants: data.defendants && data.defendants.length > 0 
          ? data.defendants 
          : [{ name: data.defendantName || '', rut: '', address: '', city: '', legalRep: '' }]
      });
      
      setStep('edit');
    } catch (err: any) {
      console.error("Error generating content:", err);
      setError(err.message || "Error al procesar el documento. Por favor, intente de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDefendant = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      defendants: [...formData.defendants, { name: '', rut: '', address: '', city: '', legalRep: '' }]
    });
  };

  const handleRemoveDefendant = (index: number) => {
    if (!formData) return;
    const newDefendants = [...formData.defendants];
    newDefendants.splice(index, 1);
    setFormData({ ...formData, defendants: newDefendants });
  };

  const handleDefendantChange = (index: number, field: keyof Defendant, value: string) => {
    if (!formData) return;
    const newDefendants = [...formData.defendants];
    
    if (field === 'rut') {
      newDefendants[index][field] = formatRut(value);
    } else {
      newDefendants[index][field] = value;
    }
    
    setFormData({ ...formData, defendants: newDefendants });
  };

  const handleManualEntry = () => {
    setFormData({
      rolNumber: '',
      plaintiffName: '',
      defendantName: '',
      court: 'Corte de Apelaciones de Santiago',
      competencia: 'Civil',
      cliente: '',
      cartera: '',
      numeroInterno: '',
      caratulaConservador: '',
      isUrgent: false,
      defendants: [{ name: '', rut: '', address: '', city: '', legalRep: '' }]
    });
    setStep('edit');
  };

  if (step === 'success') {
    return (
      <div className="minimal-card p-12 max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-500 bg-white">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-primary tracking-tight mb-2">Causa Guardada</h3>
        <p className="text-on-surface-variant text-sm font-medium mb-8">La causa ha sido ingresada exitosamente al sistema.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => setStep('edit')} className="px-6 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all">
            Editar Datos
          </button>
          <button onClick={() => { setStep('upload'); setFormData(null); }} className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all">
            Ingresar Nueva Causa
          </button>
        </div>
      </div>
    );
  }

  if (step === 'edit' && formData) {
    return (
      <div className="minimal-card p-8 md:p-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline">
          <div>
            <h3 className="text-2xl font-bold text-primary tracking-tight">Completar Datos de Causa</h3>
            <p className="text-on-surface-variant mt-2 text-sm font-medium">Verifique los datos extraídos y complete la información interna.</p>
          </div>
          <button onClick={() => setStep('upload')} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors" title="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-10">
          {/* Datos Extraídos */}
          <section>
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2"/> Datos Generales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">ROL Causa</label>
                <input type="text" value={formData.rolNumber} onChange={e => setFormData({...formData, rolNumber: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tribunal</label>
                <input type="text" value={formData.court} onChange={e => setFormData({...formData, court: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" placeholder="Ej. 1º Juzgado Civil" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Competencia</label>
                <select value={formData.competencia} onChange={e => setFormData({...formData, competencia: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none">
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
                <input type="text" value={formData.plaintiffName} onChange={e => setFormData({...formData, plaintiffName: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Demandado Principal</label>
                <input type="text" value={formData.defendantName} onChange={e => setFormData({...formData, defendantName: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
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
                <select value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value, cartera: ''})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none">
                  <option value="">Seleccione un cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">Cartera</label>
                  {formData.cliente && (
                    <button onClick={() => setShowNewPortfolioModal(true)} className="flex items-center text-xs font-bold text-secondary hover:underline transition-colors">
                      <Plus className="w-3 h-3 mr-1" /> Nueva
                    </button>
                  )}
                </div>
                <select value={formData.cartera} onChange={e => setFormData({...formData, cartera: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl appearance-none" disabled={!formData.cliente}>
                  <option value="">Seleccione una cartera</option>
                  {clients.find(c => c.name === formData.cliente)?.portfolios.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">N° Interno</label>
                <input type="text" value={formData.numeroInterno} onChange={e => setFormData({...formData, numeroInterno: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" placeholder="Ej. 102938" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Carátula Conservador</label>
                <input type="text" value={formData.caratulaConservador} onChange={e => setFormData({...formData, caratulaConservador: e.target.value})} className="w-full border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" placeholder="Ej. 450-2024" />
              </div>
            </div>
          </section>

          {/* Notificados */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Notificados Propuestos</h4>
              <button onClick={handleAddDefendant} className="flex items-center text-xs font-bold text-secondary hover:underline transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Agregar Notificado
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.defendants.map((def, idx) => (
                <div key={idx} className="p-6 border border-outline rounded-2xl bg-surface-container/30 relative group">
                  {formData.defendants.length > 1 && (
                    <button onClick={() => handleRemoveDefendant(idx)} className="absolute top-4 right-4 text-on-surface-variant hover:text-error hover:bg-error/10 p-2 rounded-xl transition-colors" title="Eliminar Notificado">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Notificado {idx + 1}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre / Razón Social</label>
                      <input type="text" value={def.name} onChange={e => handleDefendantChange(idx, 'name', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">RUT</label>
                      <input 
                        type="text" 
                        value={def.rut} 
                        onChange={e => handleDefendantChange(idx, 'rut', e.target.value)} 
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
                      <input type="text" value={def.legalRep} onChange={e => handleDefendantChange(idx, 'legalRep', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" placeholder="Solo si es empresa" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Domicilio</label>
                      <input type="text" value={def.address} onChange={e => handleDefendantChange(idx, 'address', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Comuna</label>
                      <input type="text" value={def.city} onChange={e => handleDefendantChange(idx, 'city', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline">
            <button
              type="button"
              onClick={() => setFormData({...formData, isUrgent: !formData.isUrgent})}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 w-full sm:w-auto min-w-[200px]",
                formData.isUrgent 
                  ? "bg-error/10 border-error text-error shadow-sm shadow-error/10" 
                  : "bg-surface-container/20 border-outline text-on-surface-variant hover:border-error/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                  formData.isUrgent ? "bg-error text-white" : "bg-surface-container text-on-surface-variant"
                )}>
                  <AlertCircle className={cn("w-3 h-3", formData.isUrgent && "animate-pulse")} />
                </div>
                <span className="text-xs font-bold">Causa Urgente</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors duration-300",
                formData.isUrgent ? "bg-error" : "bg-outline"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300",
                  formData.isUrgent ? "left-4.5" : "left-0.5"
                )} />
              </div>
            </button>

            <button onClick={() => { 
              const newCase = {
                id: Math.random().toString(36).substr(2, 9),
                rol: formData.rolNumber,
                tribunal: formData.court,
                competencia: formData.competencia,
                demandante: formData.plaintiffName,
                fechaIngreso: new Date().toISOString().split('T')[0],
                cliente: formData.cliente,
                cartera: formData.cartera,
                numeroInterno: formData.numeroInterno,
                caratulaConservador: formData.caratulaConservador,
                demandado: formData.defendantName,
                domicilio: formData.defendants[0]?.address || '',
                comuna: formData.defendants[0]?.city || '',
                rutNotificado: formData.defendants[0]?.rut || '',
                defendants: formData.defendants,
                fechaPjud: new Date().toISOString().split('T')[0],
                boleta: '',
                fechaEmision: '',
                monto: '',
                estadoPago: 'Pendiente',
                urgente: formData.isUrgent || false,
                observations: ''
              };
              setStep('success'); 
              onSuccess?.(newCase); 
            }} className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center">
              <Save className="w-4 h-4 mr-2" /> Guardar Causa
            </button>
          </div>
        </div>

        {/* Modal Nuevo Cliente */}
        {showNewClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-primary">Nuevo Cliente</h3>
                <button onClick={() => setShowNewClientModal(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Nombre o Razón Social</label>
                  <input 
                    type="text" 
                    value={newClientData.name}
                    onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                    className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl"
                    placeholder="Ej. Estudio Jurídico ABC"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Tipo de Cliente</label>
                    <select 
                      value={newClientData.type}
                      onChange={e => setNewClientData({...newClientData, type: e.target.value as any})}
                      className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl"
                    >
                      <option value="Abogado Independiente">Abogado Independiente</option>
                      <option value="Estudio Jurídico">Estudio Jurídico</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Forma de Pago</label>
                    <select 
                      value={newClientData.paymentTerm}
                      onChange={e => setNewClientData({...newClientData, paymentTerm: e.target.value as any})}
                      className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl"
                    >
                      <option value="inmediato">Inmediato</option>
                      <option value="10_dias">10 Días</option>
                      <option value="30_dias">30 Días</option>
                      <option value="45_dias">45 Días</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-secondary font-medium leading-relaxed">
                    Para una mejor operación del sistema, deberá completar el RUT y otros datos posteriormente desde el módulo Clientes.
                  </p>
                </div>

                <button 
                  onClick={handleCreateClient}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all mt-4"
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
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 font-medium">Agregando cartera para: <span className="text-primary font-bold">{formData.cliente}</span></p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Nombre Institución</label>
                  <input 
                    type="text" 
                    value={newPortfolioData.name}
                    onChange={e => setNewPortfolioData({...newPortfolioData, name: e.target.value})}
                    className="w-full p-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl"
                    placeholder="Ej. Banco Estado"
                  />
                </div>

                <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-secondary font-medium leading-relaxed">
                    Para una mejor operación del sistema, deberá completar el RUT de la institución posteriormente desde el módulo Clientes.
                  </p>
                </div>

                <button 
                  onClick={handleCreatePortfolio}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all mt-4"
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

  return (
    <div className="minimal-card p-12 max-w-3xl mx-auto bg-white">
      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold text-primary tracking-tight">Ingreso de Causa</h3>
        <p className="text-on-surface-variant mt-3 text-sm font-medium">Suba un PDF judicial para extraer detalles automáticamente o ingrese los datos manualmente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={cn(
            "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all h-full min-h-[240px]",
            isProcessing ? "bg-surface-container border-primary" : "bg-surface-container/30 border-outline group-hover:border-primary group-hover:bg-primary/5"
          )}>
            {isProcessing ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-bold text-primary">Procesando Documento...</p>
                <p className="text-xs font-medium text-on-surface-variant mt-2 text-center">Google AI leyendo el archivo PDF</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-bold text-primary">Subir PDF Judicial</p>
                <p className="text-xs font-medium text-on-surface-variant mt-2 text-center">Extracción automática con IA</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleManualEntry}
          disabled={isProcessing}
          className="border-2 border-outline rounded-2xl p-8 flex flex-col items-center justify-center transition-all h-full min-h-[240px] bg-white hover:border-secondary hover:bg-secondary/5 group"
        >
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Edit2 className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-sm font-bold text-secondary">Ingreso Manual</p>
          <p className="text-xs font-medium text-on-surface-variant mt-2 text-center">Completar formulario desde cero</p>
        </button>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-error/10 text-error rounded-xl flex items-center border border-error/20">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
