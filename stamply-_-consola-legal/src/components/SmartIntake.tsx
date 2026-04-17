import React, { useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Save, ArrowLeft, Edit2, Search, ExternalLink } from 'lucide-react';
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
  gender: string;        // 'Masculino' | 'Femenino' | ''
  legalRep: string;
  legalRepRut: string;
  legalRepGender: string;
  hasLegalRep: boolean;  // toggle UI
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
  cases?: any[];
  onGoToCase?: (caseId: string) => void;
}

export default function SmartIntake({ clients = [], setClients, onSuccess, cases = [], onGoToCase }: SmartIntakeProps) {
  const [step, setStep] = useState<'rol-check' | 'upload' | 'edit' | 'success'>('rol-check');
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

  // Consentimiento IA — persiste en la sesión del tab
  const [consentGiven, setConsentGiven] = useState<boolean>(
    () => sessionStorage.getItem('ai_consent_given') === 'true'
  );

  // Paso 0: ROL check
  const [rolInput, setRolInput] = useState('');
  const [rolFound, setRolFound] = useState<any | null>(null);
  const [rolChecked, setRolChecked] = useState(false);

  const handleRolCheck = () => {
    if (!rolInput.trim()) return;
    const found = cases.find(c => c.rol.toLowerCase() === rolInput.trim().toLowerCase());
    setRolFound(found || null);
    setRolChecked(true);
  };

  const handleProceedWithRol = () => {
    // ROL not found: proceed to upload/manual with ROL pre-filled (locked)
    setFormData({
      rolNumber: rolInput.trim(),
      plaintiffName: '',
      defendantName: '',
      court: 'Corte de Apelaciones de Santiago',
      competencia: 'Civil',
      cliente: '',
      cartera: '',
      numeroInterno: '',
      caratulaConservador: '',
      isUrgent: false,
      defendants: [{ name: '', rut: '', address: '', city: '', gender: '', legalRep: '', legalRepRut: '', legalRepGender: '', hasLegalRep: false }]
    });
    setStep('upload');
  };

  const handleCreateClient = () => {
    if (!newClientData.name) {
      alert('Por favor ingrese un nombre.');
      return;
    }

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClientData.name,
      rut: '',
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
      
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type || 'application/pdf',
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Error al procesar el documento con el servidor.';
        let shouldFallback = false;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          shouldFallback = errorData.fallback === true;
        } catch (e) {
          errorMsg = `Error del servidor (${response.status}): ${response.statusText}`;
        }
        if (shouldFallback) {
          // IA no disponible: ir al formulario manual con ROL pre-llenado
          setFormData({
            rolNumber: rolInput.trim(),
            plaintiffName: '', defendantName: '', court: '', competencia: 'Civil',
            cliente: '', cartera: '', numeroInterno: '', caratulaConservador: '',
            defendants: [{ name: '', rut: '', address: '', city: '', gender: '', legalRep: '', legalRepRut: '', legalRepGender: '', hasLegalRep: false }]
          });
          setError(`⚠️ ${errorMsg} Se abrió el formulario manual.`);
          setStep('edit');
          return;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      setFormData(prev => ({
        rolNumber: prev?.rolNumber || rolInput.trim(),
        plaintiffName: data.plaintiffName || '',
        defendantName: data.defendantName || '',
        court: data.court || 'Corte de Apelaciones de Santiago',
        competencia: data.competencia || 'Civil',
        cliente: prev?.cliente || '',
        cartera: prev?.cartera || '',
        numeroInterno: prev?.numeroInterno || '',
        caratulaConservador: prev?.caratulaConservador || '',
        defendants: data.defendants && data.defendants.length > 0
          ? data.defendants
          : [{ name: data.defendantName || '', rut: '', address: '', city: '', gender: '', legalRep: '', legalRepRut: '', legalRepGender: '', hasLegalRep: false }]
      }));

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
      defendants: [...formData.defendants, { name: '', rut: '', address: '', city: '', gender: '', legalRep: '', legalRepRut: '', legalRepGender: '', hasLegalRep: false }]
    });
  };

  const handleRemoveDefendant = (index: number) => {
    if (!formData) return;
    const newDefendants = [...formData.defendants];
    newDefendants.splice(index, 1);
    setFormData({ ...formData, defendants: newDefendants });
  };

  const handleDefendantChange = (index: number, field: keyof Defendant | 'hasLegalRep', value: string | boolean) => {
    if (!formData) return;
    const newDefendants = [...formData.defendants];

    if (field === 'rut' || field === 'legalRepRut') {
      (newDefendants[index] as any)[field] = formatRut(value as string);
    } else {
      (newDefendants[index] as any)[field] = value;
    }

    // Si se desactiva el toggle, limpiar los campos del rep. legal
    if (field === 'hasLegalRep' && !value) {
      newDefendants[index].legalRep = '';
      newDefendants[index].legalRepRut = '';
      newDefendants[index].legalRepGender = '';
    }

    setFormData({ ...formData, defendants: newDefendants });
  };

  const handleManualEntry = () => {
    setFormData(prev => ({
      rolNumber: prev?.rolNumber || rolInput.trim(),
      plaintiffName: prev?.plaintiffName || '',
      defendantName: prev?.defendantName || '',
      court: prev?.court || 'Corte de Apelaciones de Santiago',
      competencia: prev?.competencia || 'Civil',
      cliente: prev?.cliente || '',
      cartera: prev?.cartera || '',
      numeroInterno: prev?.numeroInterno || '',
      caratulaConservador: prev?.caratulaConservador || '',
      isUrgent: false,
      defendants: prev?.defendants || [{ name: '', rut: '', address: '', city: '', gender: '', legalRep: '', legalRepRut: '', legalRepGender: '', hasLegalRep: false }]
    }));
    setStep('edit');
  };

  // ─── PASO 0: Verificación de ROL ──────────────────────────────────────────
  if (step === 'rol-check') {
    return (
      <div className="minimal-card p-8 md:p-12 max-w-2xl mx-auto bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-primary tracking-tight">Ingreso de Causa</h3>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">
            Ingrese el ROL para verificar si la causa ya existe en el sistema.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
              ROL de la Causa
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={rolInput}
                onChange={e => { setRolInput(e.target.value); setRolChecked(false); setRolFound(null); }}
                onKeyDown={e => e.key === 'Enter' && handleRolCheck()}
                placeholder="Ej: C-1452-2023"
                className="flex-1 border border-outline bg-transparent p-3 text-sm focus:border-primary outline-none transition-all rounded-xl font-mono tracking-wider"
                autoFocus
              />
              <button
                onClick={handleRolCheck}
                disabled={!rolInput.trim()}
                className="px-5 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>
          </div>

          {/* Resultado de la búsqueda */}
          {rolChecked && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {rolFound ? (
                // CAUSA ENCONTRADA
                <div className="p-5 bg-secondary/5 border border-secondary/30 rounded-2xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary">Causa encontrada en el sistema</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Esta causa ya fue ingresada. Puede ir directamente a ella.</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-outline p-4 space-y-2 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">ROL</span>
                      <span className="text-sm font-bold text-primary font-mono">{rolFound.rol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Demandado</span>
                      <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">{rolFound.demandado}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Cliente</span>
                      <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">{rolFound.cliente || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tribunal</span>
                      <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">{rolFound.competencia}</span>
                    </div>
                    {rolFound.urgente && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-4 h-4 text-error" />
                        <span className="text-xs font-bold text-error uppercase tracking-widest">Causa Urgente</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onGoToCase?.(rolFound.id)}
                      className="flex-1 py-3 bg-secondary text-white font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ir a la Causa
                    </button>
                    <button
                      onClick={() => { setRolInput(''); setRolChecked(false); setRolFound(null); }}
                      className="flex-1 sm:flex-none px-4 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all text-center"
                    >
                      Buscar Otro ROL
                    </button>
                  </div>
                </div>
              ) : (
                // CAUSA NO ENCONTRADA
                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">ROL disponible — Causa nueva</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        El ROL <span className="font-mono font-bold">{rolInput.trim()}</span> no existe. Puede continuar con el ingreso.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleProceedWithRol}
                    className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar con Ingreso
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SUCCESS ─────────────────────────────────────────────────────────────
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
          <button onClick={() => { setStep('rol-check'); setFormData(null); setRolInput(''); setRolChecked(false); setRolFound(null); }} className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all">
            Ingresar Nueva Causa
          </button>
        </div>
      </div>
    );
  }

  // ─── PASO 1: Upload / Selección de método ────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="minimal-card p-8 md:p-12 max-w-3xl mx-auto bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setStep('rol-check')} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-primary tracking-tight">Ingresar Causa</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">ROL:</span>
              <span className="text-sm font-mono font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg">{formData?.rolNumber || rolInput}</span>
              <span className="text-[10px] text-on-surface-variant font-medium">(bloqueado)</span>
            </div>
          </div>
        </div>

        {/* Banner de consentimiento IA — visible solo si no fue aceptado en esta sesión */}
        {!consentGiven && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Procesamiento de datos por IA
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Al subir un PDF, el documento será enviado a <strong>Groq AI (Llama 4)</strong> para
              extraer automáticamente los datos de la causa (partes, tribunal, domicilios).
              Los datos se procesan según la política de privacidad de Groq.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-amber-600"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked) {
                    sessionStorage.setItem('ai_consent_given', 'true');
                    setConsentGiven(true);
                  }
                }}
              />
              <span className="text-xs text-amber-800 font-medium">
                Entiendo que el documento será procesado por Groq AI para extraer datos.
              </span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cn("relative group", !consentGiven && "opacity-50 pointer-events-none")}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing || !consentGiven}
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
                  <p className="text-xs font-medium text-on-surface-variant mt-2 text-center">
                    {consentGiven ? 'Extracción automática con IA' : 'Acepta el consentimiento para habilitar'}
                  </p>
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

  // ─── PASO 2: Formulario de edición ───────────────────────────────────────
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

        {error && (
          <div className="mb-6 p-4 bg-warning/10 text-warning rounded-xl flex items-start gap-3 border border-warning/20">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-10">
          {/* Datos Generales */}
          <section>
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2"/> Datos Generales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">ROL Causa</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.rolNumber}
                    readOnly
                    className="w-full border border-outline/50 bg-surface-container/30 p-3 text-sm rounded-xl font-mono font-bold text-primary cursor-not-allowed pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg">BLOQUEADO</span>
                </div>
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
                    {/* Nombre */}
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre / Razón Social</label>
                      <input type="text" value={def.name} onChange={e => handleDefendantChange(idx, 'name', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>

                    {/* RUT */}
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

                    {/* Género del Notificado */}
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Género del Notificado</label>
                      <div className="flex gap-2">
                        {(['Masculino', 'Femenino'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleDefendantChange(idx, 'gender', def.gender === g ? '' : g)}
                            className={cn(
                              "flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-200",
                              def.gender === g
                                ? g === 'Masculino'
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-secondary bg-secondary/10 text-secondary"
                                : "border-outline text-on-surface-variant hover:border-primary/50"
                            )}
                          >
                            {g === 'Masculino' ? '♂ Masculino' : '♀ Femenino'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Domicilio */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Domicilio</label>
                      <input type="text" value={def.address} onChange={e => handleDefendantChange(idx, 'address', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>

                    {/* Comuna */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Comuna</label>
                      <input type="text" value={def.city} onChange={e => handleDefendantChange(idx, 'city', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" />
                    </div>

                    {/* Toggle Representante Legal */}
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleDefendantChange(idx, 'hasLegalRep', !def.hasLegalRep)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all duration-200",
                          def.hasLegalRep
                            ? "border-tertiary bg-tertiary/5 text-tertiary"
                            : "border-outline text-on-surface-variant hover:border-tertiary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            def.hasLegalRep ? "border-tertiary bg-tertiary" : "border-on-surface-variant/40"
                          )}>
                            {def.hasLegalRep && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">¿Tiene Representante Legal?</span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors",
                          def.hasLegalRep ? "bg-tertiary/10 text-tertiary" : "bg-surface-container text-on-surface-variant"
                        )}>
                          {def.hasLegalRep ? 'Sí' : 'No'}
                        </span>
                      </button>
                    </div>

                    {/* Campos de Representante Legal — solo visibles si toggle activo */}
                    {def.hasLegalRep && (
                      <>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Representante Legal</label>
                          <input type="text" value={def.legalRep} onChange={e => handleDefendantChange(idx, 'legalRep', e.target.value)} className="w-full border border-outline bg-white p-3 text-sm focus:border-primary outline-none transition-all rounded-xl" placeholder="Nombre completo" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">RUT Representante Legal</label>
                          <input
                            type="text"
                            value={def.legalRepRut}
                            onChange={e => handleDefendantChange(idx, 'legalRepRut', e.target.value)}
                            className={cn(
                              "w-full border bg-white p-3 text-sm outline-none transition-all rounded-xl",
                              def.legalRepRut && validateRut(def.legalRepRut).isComplete
                                ? (validateRut(def.legalRepRut).isValid ? "border-success text-success focus:border-success" : "border-error text-error focus:border-error")
                                : "border-outline focus:border-primary"
                            )}
                            placeholder="Ej. 12.345.678-9"
                          />
                          {def.legalRepRut && validateRut(def.legalRepRut).isComplete && (
                            <p className={cn("text-xs mt-1 font-medium", validateRut(def.legalRepRut).isValid ? "text-success" : "text-error")}>
                              {validateRut(def.legalRepRut).message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Género Rep. Legal</label>
                          <div className="flex gap-2">
                            {(['Masculino', 'Femenino'] as const).map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleDefendantChange(idx, 'legalRepGender', def.legalRepGender === g ? '' : g)}
                                className={cn(
                                  "flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-200",
                                  def.legalRepGender === g
                                    ? g === 'Masculino'
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-secondary bg-secondary/10 text-secondary"
                                    : "border-outline text-on-surface-variant hover:border-primary/50"
                                )}
                              >
                                {g === 'Masculino' ? '♂ Masculino' : '♀ Femenino'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
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

  return null;
}
