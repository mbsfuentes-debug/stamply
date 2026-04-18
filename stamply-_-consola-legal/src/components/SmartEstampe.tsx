import React, { useState } from 'react';
import { Search, FileText, Sparkles, Send, CheckCircle2, ChevronRight, Landmark, User, Building2, DollarSign, Users, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

import { Template } from './TemplateLibrary';
import { Client } from './Clients';

// Mock data removed — using real cases from props

type EntityType = 'MALE' | 'FEMALE' | 'CORP' | 'PLURAL';

interface SmartEstampeProps {
  templates: Template[];
  clients: Client[];
  cases: any[];
  onSendToAuthorize: (estampe: any) => void;
}

export default function SmartEstampe({ templates, clients, cases, onSendToAuthorize }: SmartEstampeProps) {
  const [step, setStep] = useState(1);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [entityType, setEntityType] = useState<EntityType>('MALE');
  const [montoFinal, setMontoFinal] = useState<number>(45000);
  const [resultDate, setResultDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resultTime, setResultTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [resultDetails, setResultDetails] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCase = (c: any) => {
    setSelectedCase(c);
    setStep(2);
  };

  const handleSelectTemplate = (t: any) => {
    setSelectedTemplate(t);
    
    // Auto-fill montoFinal based on client's tariff
    if (selectedCase) {
      const client = clients.find(c => c.name === selectedCase.cliente);
      if (client && client.tariffs) {
        let tariff;
        if (client.tariffType === 'Por Cartera') {
          tariff = client.tariffs.find(tr => tr.service === t.name && tr.portfolio === selectedCase.cartera);
        } else {
          tariff = client.tariffs.find(tr => tr.service === t.name);
        }
        
        if (tariff) {
          setMontoFinal(tariff.amount);
        } else {
          setMontoFinal(45000);
        }
      } else {
        setMontoFinal(45000);
      }
    }
    
    setStep(3);
  };

  const generateEstampe = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-estampe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateContent: selectedTemplate.content,
          caseData: {
            rol: selectedCase.rol,
            tribunal: selectedCase.tribunal,
            defendant: selectedCase.defendant,
            address: selectedCase.address,
            city: selectedCase.city,
            cliente: selectedCase.cliente,
          },
          resultData: {
            date: resultDate,
            time: resultTime,
            details: resultDetails,
          },
          entityType,
          montoFinal,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errData.error || 'Límite de solicitudes de IA alcanzado. Intente más tarde.');
        }
        throw new Error(errData.error || 'Error al generar el acta.');
      }

      const data = await response.json();
      const text = data.content || "";

      const formattedText = `<div class="font-serif p-12 bg-white text-on-surface shadow-inner min-h-[400px] leading-relaxed text-justify">
        ${text.replace(/\n/g, '<br/>')}
      </div>`;

      setGeneratedContent(formattedText);
      setStep(4);
    } catch (err: any) {
      console.error("Error generating estampe:", err);
      setError(err.message || "Error al generar el acta. Por favor, intente de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    const newEstampe = {
      id: `est-${Date.now()}`,
      rol: selectedCase.rol,
      defendant: selectedCase.defendant,
      type: selectedTemplate.name,
      status: 'borrador',
      date: new Date().toISOString().split('T')[0],
      content: generatedContent
    };
    onSendToAuthorize(newEstampe);
    setStep(1);
    setSelectedCase(null);
    setSelectedTemplate(null);
    setGeneratedContent('');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) setSelectedCase(null);
      if (step === 3) setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="p-3 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Estampe Inteligente</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-medium">
              {step === 1 && "Seleccione la causa para el estampe"}
              {step === 2 && "Seleccione el modelo de acta"}
              {step === 3 && "Configure los parámetros de redacción"}
              {step === 4 && "Revise y envíe el acta redactada"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-outline">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                step === s ? "bg-secondary text-white shadow-lg shadow-secondary/20" : 
                step > s ? "bg-success/10 text-success" : "bg-surface-container text-on-surface-variant"
              )}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Step 1: Select Case */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold text-primary">1. Seleccionar Causa</h3>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Buscar por ROL o demandado..." 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-outline text-sm focus:border-secondary outline-none transition-all rounded-2xl shadow-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="minimal-card p-6 text-left group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-xs font-bold tracking-tight">
                      {c.rol}
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-base font-bold text-primary mb-1 group-hover:text-secondary transition-colors">{c.defendant}</h4>
                  <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {c.cliente}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Template */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-lg font-bold text-primary">2. Modelo de Acta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="minimal-card p-6 text-left group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-tertiary/10 text-tertiary rounded-xl group-hover:bg-tertiary group-hover:text-white transition-all">
                      <FileText className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-base font-bold text-primary mb-2 group-hover:text-secondary transition-colors">{t.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Config & Generation */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="lg:col-span-4 space-y-6">
              <section className="minimal-card p-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Configuración</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 block">Tipo de Entidad (Género)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'MALE', label: 'Masculino', icon: User },
                        { id: 'FEMALE', label: 'Femenino', icon: User },
                        { id: 'CORP', label: 'Empresa', icon: Building2 },
                        { id: 'PLURAL', label: 'Plural', icon: Users },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setEntityType(type.id as EntityType)}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                            entityType === type.id ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : "bg-white border-outline text-on-surface-variant hover:border-secondary/50"
                          )}
                        >
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 block">Monto Final (Arancel)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="number" 
                        value={montoFinal}
                        onChange={(e) => setMontoFinal(Number(e.target.value))}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-outline text-sm font-bold focus:border-secondary outline-none transition-all rounded-2xl shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="minimal-card p-6 border-l-4 border-l-secondary">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Resultado en Terreno</h3>
                <p className="text-xs text-on-surface-variant mb-4">Ingrese los datos obtenidos en la diligencia. La IA los incorporará al acta.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Fecha</label>
                      <input 
                        type="date" 
                        value={resultDate}
                        onChange={(e) => setResultDate(e.target.value)}
                        className="w-full px-3 py-3 bg-surface-container/30 border border-outline text-sm focus:border-secondary outline-none transition-all rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Hora</label>
                      <input 
                        type="time" 
                        value={resultTime}
                        onChange={(e) => setResultTime(e.target.value)}
                        className="w-full px-3 py-3 bg-surface-container/30 border border-outline text-sm focus:border-secondary outline-none transition-all rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Detalles del Resultado</label>
                    <textarea 
                      value={resultDetails}
                      onChange={(e) => setResultDetails(e.target.value)}
                      placeholder="Ej: Fui atendido por Juan Pérez, quien se identificó como conserje. El lugar corresponde a un edificio residencial..."
                      className="w-full px-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-secondary outline-none transition-all rounded-xl resize-none h-24"
                    />
                  </div>
                </div>
              </section>

              <section className="minimal-card p-6">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">Resumen de Contexto</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-surface-container rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Cliente</p>
                      <p className="text-xs font-bold text-primary">{selectedCase?.cliente}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-surface-container rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-tertiary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Modelo</p>
                      <p className="text-xs font-bold text-primary">{selectedTemplate?.name}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-8">
              <div className="minimal-card min-h-[500px] flex flex-col bg-surface-container-low overflow-hidden h-full border-dashed border-2">
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  {isGenerating ? (
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto"></div>
                        <Sparkles className="w-8 h-8 text-secondary absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">Redactando Acta Judicial...</p>
                        <p className="text-sm text-on-surface-variant font-medium mt-1">Aplicando reglas de concordancia y aranceles</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-outline">
                        <Sparkles className="w-10 h-10 text-secondary" />
                      </div>
                      <h4 className="text-2xl font-bold text-primary mb-3">Arquitecto Legal Listo</h4>
                      <p className="text-on-surface-variant text-sm font-medium mb-10 leading-relaxed">
                        Se generará un acta para <span className="text-primary font-bold">{selectedCase?.defendant}</span> con concordancia para entidad de tipo <span className="text-primary font-bold">{entityType}</span> y un arancel de <span className="text-primary font-bold">${montoFinal.toLocaleString('es-CL')}.-</span>
                      </p>
                      <button 
                        onClick={generateEstampe}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="w-5 h-5" />
                        Generar Acta Final
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
            <div className="minimal-card flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-6 border-b border-outline bg-surface-container/30 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-outline">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">Vista Previa del Acta</h4>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Documento generado por IA</p>
                  </div>
                </div>
                <button onClick={() => setStep(3)} className="text-xs font-bold text-secondary hover:bg-secondary/5 px-4 py-2 rounded-xl transition-all border border-secondary/20">
                  Ajustar Parámetros
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-surface-container-low">
                <div className="shadow-2xl mx-auto max-w-[800px] bg-white rounded-sm" dangerouslySetInnerHTML={{ __html: generatedContent }} />
              </div>
              <div className="p-6 border-t border-outline bg-white flex flex-col md:flex-row justify-end gap-4">
                <button 
                  onClick={() => setStep(3)}
                  className="px-8 py-4 border border-outline text-on-surface-variant font-bold text-sm rounded-2xl hover:bg-surface-container transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSend}
                  className="px-10 py-4 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="w-5 h-5" />
                  Enviar a Centro de Firmas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 animate-in shake duration-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
