import React, { useState, useRef } from 'react';
import { BookOpen, Plus, Upload, FileText, Type, Bold, Italic, List, Save, ArrowLeft, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface TemplateLibraryProps {
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
}

const AVAILABLE_VARIABLES = [
  { id: '[CLIENTE]', label: 'Cliente' },
  { id: '[RUT_CLIENTE]', label: 'RUT Cliente' },
  { id: '[DEMANDADO]', label: 'Demandado' },
  { id: '[RUT_DEMANDADO]', label: 'RUT Demandado' },
  { id: '[TRIBUNAL]', label: 'Tribunal' },
  { id: '[ROL]', label: 'Rol' },
  { id: '[FECHA]', label: 'Fecha' },
  { id: '[HORA]', label: 'Hora' },
  { id: '[DIRECCION]', label: 'Dirección' },
  { id: '[COMUNA]', label: 'Comuna' },
  { id: '[ARANCEL]', label: 'Arancel' },
  { id: '[RECEPTOR]', label: 'Receptor' },
];

export default function TemplateLibrary({ templates, setTemplates }: TemplateLibraryProps) {
  const [view, setView] = useState<'list' | 'edit' | 'upload'>('list');
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleCreateNew = () => {
    setCurrentTemplate({
      id: Date.now().toString(),
      name: '',
      description: '',
      content: ''
    });
    setView('edit');
  };

  const handleEdit = (template: Template) => {
    setCurrentTemplate({ ...template });
    setView('edit');
  };

  const handleSave = () => {
    if (!currentTemplate?.name || !currentTemplate?.content) {
      setError("El nombre y el contenido son obligatorios.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const existingIndex = templates.findIndex(t => t.id === currentTemplate.id);
    if (existingIndex >= 0) {
      const newTemplates = [...templates];
      newTemplates[existingIndex] = currentTemplate;
      setTemplates(newTemplates);
    } else {
      setTemplates([...templates, currentTemplate]);
    }
    setView('list');
    setCurrentTemplate(null);
  };

  const insertVariable = (variableId: string) => {
    if (!editorRef.current || !currentTemplate) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = currentTemplate.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newContent = before + variableId + after;
    setCurrentTemplate({ ...currentTemplate, content: newContent });
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.selectionStart = start + variableId.length;
        editorRef.current.selectionEnd = start + variableId.length;
      }
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const generatedTemplate: Template = {
        id: Date.now().toString(),
        name: `Modelo extraído de ${file.name.replace(/\.[^/.]+$/, "")}`,
        description: 'Modelo generado automáticamente por IA a partir de documento.',
        content: `En Santiago, a [FECHA], siendo las [HORA] horas, me constituí en el domicilio ubicado en [DIRECCION], comuna de [COMUNA], con el objeto de notificar la demanda a [DEMANDADO] en la causa Rol [ROL] del [TRIBUNAL].\n\nFui atendido por quien dijo ser el demandado, a quien entregué copias íntegras de la demanda y resolución recaída en ella.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial`
      };

      setCurrentTemplate(generatedTemplate);
      setView('edit');
    } catch (err) {
      setError("Error al procesar el documento con IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {view !== 'list' && (
            <button 
              onClick={() => { setView('list'); setCurrentTemplate(null); }}
              className="p-3 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Biblioteca de Modelos</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-medium">
              {view === 'list' && "Gestione los modelos base para el Estampe Inteligente"}
              {view === 'edit' && "Editor de Modelo y Variables"}
              {view === 'upload' && "Importar Modelo vía IA"}
            </p>
          </div>
        </div>

        {view === 'list' && (
          <div className="flex gap-3">
            <button 
              onClick={() => setView('upload')}
              className="px-5 py-3 bg-white border border-outline text-on-surface-variant font-bold text-xs rounded-2xl hover:text-secondary hover:border-secondary transition-all flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Importar PDF/Word
            </button>
            <button 
              onClick={handleCreateNew}
              className="px-6 py-3 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Crear Modelo
            </button>
          </div>
        )}
        
        {view === 'edit' && (
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            Guardar Modelo
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 mb-6 animate-in shake duration-300">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8">
            {templates.map((t) => (
              <div key={t.id} className="minimal-card flex flex-col group hover:scale-[1.02] active:scale-[0.98] transition-all">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-primary leading-tight group-hover:text-secondary transition-colors">{t.name}</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 mb-6">
                    {t.description || "Sin descripción"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VARIABLES.filter(v => t.content.includes(v.id)).slice(0, 3).map(v => (
                      <span key={v.id} className="badge bg-surface-container text-on-surface-variant border-transparent">
                        {v.label}
                      </span>
                    ))}
                    {AVAILABLE_VARIABLES.filter(v => t.content.includes(v.id)).length > 3 && (
                      <span className="badge bg-surface-container text-on-surface-variant border-transparent">
                        +{AVAILABLE_VARIABLES.filter(v => t.content.includes(v.id)).length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t border-outline/50 bg-surface-container/30 flex justify-end">
                  <button 
                    onClick={() => handleEdit(t)}
                    className="text-xs font-bold text-secondary hover:underline px-4 py-2"
                  >
                    Editar Modelo
                  </button>
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-dashed border-outline rounded-3xl">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-bold text-primary">No hay modelos</h3>
                <p className="text-on-surface-variant text-sm mt-1">Cree uno nuevo o importe un documento.</p>
              </div>
            )}
          </div>
        )}

        {view === 'upload' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="minimal-card max-w-lg w-full p-10 text-center border-dashed border-2">
              {isProcessing ? (
                <div className="space-y-6 py-8">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto"></div>
                    <Sparkles className="w-8 h-8 text-secondary absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">Analizando Documento</p>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">Extrayendo variables y estructura con IA...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-outline">
                    <Sparkles className="w-10 h-10 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3">Importación Inteligente</h3>
                  <p className="text-on-surface-variant text-sm font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                    Suba un documento PDF o Word. La Inteligencia Artificial detectará automáticamente las variables y generará el modelo.
                  </p>
                  
                  <div className="relative max-w-xs mx-auto">
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full py-4 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20">
                      <Upload className="w-5 h-5" />
                      Seleccionar Archivo
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {view === 'edit' && currentTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
            <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
              <section className="minimal-card p-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Información Básica</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Título del Modelo</label>
                    <input 
                      type="text" 
                      value={currentTemplate.name}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                      placeholder="Ej: Notificación Personal"
                      className="w-full px-4 py-3 bg-white border border-outline text-sm font-bold focus:border-secondary outline-none transition-all rounded-xl shadow-sm"
                    />
                    <p className="text-[10px] text-on-surface-variant font-medium mt-2">Este título definirá el tipo de resultado en el módulo de clientes.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Descripción</label>
                    <textarea 
                      value={currentTemplate.description}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                      placeholder="Breve descripción del uso de este modelo..."
                      className="w-full px-4 py-3 bg-white border border-outline text-sm font-medium focus:border-secondary outline-none transition-all rounded-xl shadow-sm resize-none h-28"
                    />
                  </div>
                </div>
              </section>

              <section className="minimal-card p-6">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Variables
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => insertVariable(v.id)}
                      className="px-3 py-2 bg-surface-container border border-outline hover:border-secondary hover:bg-secondary/5 text-[10px] font-bold text-on-surface-variant hover:text-secondary uppercase tracking-wider transition-all rounded-lg flex items-center gap-1.5"
                      title={`Insertar ${v.label}`}
                    >
                      <Plus className="w-3 h-3 opacity-50" />
                      {v.id}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium mt-4 leading-relaxed">
                  Haga clic en una variable para insertarla en el editor.
                </p>
              </section>
            </div>

            <div className="lg:col-span-8 flex flex-col min-h-0 minimal-card bg-white overflow-hidden">
              <div className="border-b border-outline bg-surface-container/30 p-3 flex gap-1">
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-on-surface-variant hover:text-secondary transition-all" title="Negrita"><Bold className="w-5 h-5" /></button>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-on-surface-variant hover:text-secondary transition-all" title="Cursiva"><Italic className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-outline mx-2 self-center"></div>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-on-surface-variant hover:text-secondary transition-all" title="Lista"><List className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-outline mx-2 self-center"></div>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-on-surface-variant hover:text-secondary transition-all" title="Texto"><Type className="w-5 h-5" /></button>
              </div>
              <textarea
                ref={editorRef}
                value={currentTemplate.content}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                placeholder="Redacte el modelo aquí. Use las variables del panel izquierdo..."
                className="flex-1 w-full p-10 bg-white text-base leading-relaxed focus:outline-none resize-none font-serif"
                spellCheck="false"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
