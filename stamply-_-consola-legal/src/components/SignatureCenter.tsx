import React, { useState } from 'react';
import { Search, Filter, PenTool, CheckCircle2, Edit3, Save, FileSignature, AlertCircle, FileText, AlertTriangle, CloudUpload, Clock, FileCheck, Trash2, ChevronRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import RichTextEditor from './RichTextEditor';

interface SignatureCenterProps {
  estampes: any[];
  setEstampes: (estampes: any[]) => void;
  documents: any[];
  setDocuments: (docs: any[]) => void;
}

type TabType = 'por_autorizar' | 'por_firmar' | 'por_subir_pjud';

export default function SignatureCenter({ estampes, setEstampes, documents, setDocuments }: SignatureCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('por_autorizar');
  const [selectedEstampeId, setSelectedEstampeId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredEstampes = estampes.filter(e => 
    e.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.defendant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendientesAutorizar = filteredEstampes.filter(e => e.status === 'borrador');
  const porFirmar = filteredEstampes.filter(e => e.status === 'listo');
  const porSubirPjud = filteredEstampes.filter(e => e.status === 'firmado');

  const selectedEstampe = estampes.find(e => e.id === selectedEstampeId);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedEstampeId(null);
    setSelectedItemIds([]);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  const handleSelect = (estampe: any) => {
    setSelectedEstampeId(estampe.id);
    setEditContent(estampe.content);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  const handleDelete = () => {
    if (selectedEstampeId) {
      setEstampes(estampes.filter(e => e.id !== selectedEstampeId));
      setSelectedEstampeId(null);
      setShowDeleteConfirm(false);
      setSelectedItemIds(prev => prev.filter(id => id !== selectedEstampeId));
    }
  };

  const handleSaveDraft = () => {
    if (selectedEstampeId) {
      setEstampes(estampes.map(e => 
        e.id === selectedEstampeId ? { ...e, content: editContent, status: 'borrador' } : e
      ));
      setIsEditing(false);
    }
  };

  const handleAuthorize = () => {
    if (selectedEstampeId && selectedEstampe) {
      setEstampes(estampes.map(e => 
        e.id === selectedEstampeId ? { ...e, content: editContent, status: 'listo' } : e
      ));

      // Generate PDF (add to documents) when moving to "Por Firmar"
      const docName = `${selectedEstampe.type.replace(/\s+/g, '_')}_${selectedEstampe.rol}.pdf`;
      const newDoc = {
        id: `doc-pending-${Date.now()}`,
        name: docName,
        type: 'Pendiente de Firma',
        rol: selectedEstampe.rol,
        date: formatDate(new Date().toISOString().split('T')[0]),
        size: '150 KB'
      };
      setDocuments([newDoc, ...documents]);

      setIsEditing(false);
      setSelectedEstampeId(null);
      setSelectedItemIds(prev => prev.filter(id => id !== selectedEstampeId));
      setActiveTab('por_firmar');
    }
  };

  const handleReturnToAuthorize = () => {
    if (selectedEstampeId && selectedEstampe) {
      setEstampes(estampes.map(e => 
        e.id === selectedEstampeId ? { ...e, status: 'borrador' } : e
      ));

      // Remove the pending PDF from documents
      const docName = `${selectedEstampe.type.replace(/\s+/g, '_')}_${selectedEstampe.rol}.pdf`;
      setDocuments(documents.filter(d => d.name !== docName));

      setSelectedEstampeId(null);
      setActiveTab('por_autorizar');
    }
  };

  const handleSign = async () => {
    if (selectedEstampeId && selectedEstampe) {
      setEstampes(estampes.map(e => 
        e.id === selectedEstampeId ? { ...e, status: 'firmado' } : e
      ));

      const docName = `${selectedEstampe.type.replace(/\s+/g, '_')}_${selectedEstampe.rol}.pdf`;

      // Update the existing document type to "Firmado"
      setDocuments(documents.map(d => 
        d.name === docName ? { ...d, type: 'Estampe Firmado' } : d
      ));
      
      setSelectedEstampeId(null);
      setSelectedItemIds(prev => prev.filter(id => id !== selectedEstampeId));
      setActiveTab('por_subir_pjud');

      try {
        await fetch('/api/drive/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: docName.replace('.pdf', '.txt'),
            content: selectedEstampe.content,
            folderName: 'Stamply_Documentos_Firmados'
          })
        });
      } catch (error) {
        console.error('Network error uploading to Drive:', error);
      }
    }
  };

  const handleUploadPjud = () => {
    if (selectedEstampeId) {
      setEstampes(estampes.map(e => 
        e.id === selectedEstampeId ? { ...e, status: 'subido_pjud' } : e
      ));
      setSelectedEstampeId(null);
      setSelectedItemIds(prev => prev.filter(id => id !== selectedEstampeId));
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (confirm(`¿Está seguro de eliminar ${selectedItemIds.length} documentos?`)) {
      setEstampes(estampes.filter(e => !selectedItemIds.includes(e.id)));
      setSelectedItemIds([]);
      if (selectedEstampeId && selectedItemIds.includes(selectedEstampeId)) {
        setSelectedEstampeId(null);
      }
    }
  };

  const handleBulkAuthorize = () => {
    const toAuthorize = estampes.filter(e => selectedItemIds.includes(e.id));
    
    setEstampes(estampes.map(e => selectedItemIds.includes(e.id) ? { ...e, status: 'listo' } : e));

    // Generate PDFs for all authorized items
    const newDocs = toAuthorize.map(estampe => ({
      id: `doc-pending-${Date.now()}-${estampe.id}`,
      name: `${estampe.type.replace(/\s+/g, '_')}_${estampe.rol}.pdf`,
      type: 'Pendiente de Firma',
      rol: estampe.rol,
      date: formatDate(new Date().toISOString().split('T')[0]),
      size: '150 KB'
    }));
    setDocuments([...newDocs, ...documents]);

    setSelectedItemIds([]);
    if (selectedEstampeId && selectedItemIds.includes(selectedEstampeId)) {
      setSelectedEstampeId(null);
    }
  };

  const handleBulkReturnToAuthorize = () => {
    const toReturn = estampes.filter(e => selectedItemIds.includes(e.id));
    setEstampes(estampes.map(e => selectedItemIds.includes(e.id) ? { ...e, status: 'borrador' } : e));

    // Remove pending PDFs
    const docNamesToRemove = toReturn.map(e => `${e.type.replace(/\s+/g, '_')}_${e.rol}.pdf`);
    setDocuments(documents.filter(d => !docNamesToRemove.includes(d.name)));

    setSelectedItemIds([]);
    if (selectedEstampeId && selectedItemIds.includes(selectedEstampeId)) {
      setSelectedEstampeId(null);
    }
  };

  const handleBulkSign = async () => {
    const toSign = estampes.filter(e => selectedItemIds.includes(e.id));
    
    setEstampes(estampes.map(e => selectedItemIds.includes(e.id) ? { ...e, status: 'firmado' } : e));

    // Update existing documents to "Firmado"
    const docNamesToUpdate = toSign.map(e => `${e.type.replace(/\s+/g, '_')}_${e.rol}.pdf`);
    setDocuments(documents.map(d => 
      docNamesToUpdate.includes(d.name) ? { ...d, type: 'Estampe Firmado' } : d
    ));
    
    setSelectedItemIds([]);
    if (selectedEstampeId && selectedItemIds.includes(selectedEstampeId)) {
      setSelectedEstampeId(null);
    }

    for (const estampe of toSign) {
      const docName = `${estampe.type.replace(/\s+/g, '_')}_${estampe.rol}.pdf`;
      try {
        await fetch('/api/drive/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: docName.replace('.pdf', '.txt'),
            content: estampe.content,
            folderName: 'Stamply_Documentos_Firmados'
          })
        });
      } catch (error) {
        console.error('Error uploading bulk to Drive:', error);
      }
    }
  };

  const handleBulkUploadPjud = () => {
    setEstampes(estampes.map(e => selectedItemIds.includes(e.id) ? { ...e, status: 'subido_pjud' } : e));
    setSelectedItemIds([]);
    if (selectedEstampeId && selectedItemIds.includes(selectedEstampeId)) {
      setSelectedEstampeId(null);
    }
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'por_autorizar': return pendientesAutorizar;
      case 'por_firmar': return porFirmar;
      case 'por_subir_pjud': return porSubirPjud;
      default: return [];
    }
  };

  const activeList = getActiveList();
  const isAllSelected = activeList.length > 0 && selectedItemIds.length === activeList.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(activeList.map(e => e.id));
    }
  };

  const renderEstampeItem = (estampe: any) => (
    <div
      key={estampe.id}
      onClick={() => handleSelect(estampe)}
      className={cn(
        "w-full text-left p-5 border transition-all rounded-2xl group cursor-pointer flex gap-4",
        selectedEstampeId === estampe.id 
          ? "border-secondary bg-secondary/5 shadow-sm" 
          : "border-outline hover:border-secondary/50 bg-white hover:shadow-md"
      )}
    >
      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={selectedItemIds.includes(estampe.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedItemIds(prev => [...prev, estampe.id]);
            } else {
              setSelectedItemIds(prev => prev.filter(id => id !== estampe.id));
            }
          }}
          className="w-4 h-4 accent-secondary cursor-pointer rounded"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-bold text-primary tracking-tight">{estampe.rol}</span>
          <span className={cn(
            "badge",
            estampe.status === 'borrador' ? "badge-secondary" :
            estampe.status === 'listo' ? "badge-success" :
            "bg-amber-100 text-amber-700 border-amber-200"
          )}>
            {estampe.status === 'borrador' ? 'Borrador' : estampe.status === 'listo' ? 'Listo' : 'Firmado'}
          </span>
        </div>
        <p className="text-xs font-medium text-on-surface-variant truncate mb-2">{estampe.defendant}</p>
        <div className="flex items-center text-[10px] font-bold text-primary uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          {estampe.type}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Centro de Firmas</h2>
          <p className="text-on-surface-variant mt-1 text-sm font-medium">Redacción, revisión y autorización de estampes.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Buscar estampe..." 
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

      {/* Process Tabs */}
      <div className="flex flex-col md:flex-row p-1.5 bg-surface-container/30 rounded-2xl border border-outline gap-1.5">
        <button 
          onClick={() => handleTabChange('por_autorizar')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center rounded-xl",
            activeTab === 'por_autorizar' 
              ? "bg-white text-primary shadow-sm border border-outline" 
              : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
          )}
        >
          <Clock className="w-4 h-4 mr-2" />
          Por Autorizar
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded-lg text-[10px]",
            activeTab === 'por_autorizar' ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
          )}>
            {pendientesAutorizar.length}
          </span>
        </button>
        <button 
          onClick={() => handleTabChange('por_firmar')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center rounded-xl",
            activeTab === 'por_firmar' 
              ? "bg-white text-primary shadow-sm border border-outline" 
              : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
          )}
        >
          <PenTool className="w-4 h-4 mr-2" />
          Por Firmar
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded-lg text-[10px]",
            activeTab === 'por_firmar' ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
          )}>
            {porFirmar.length}
          </span>
        </button>
        <button 
          onClick={() => handleTabChange('por_subir_pjud')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center rounded-xl",
            activeTab === 'por_subir_pjud' 
              ? "bg-white text-amber-600 shadow-sm border border-outline" 
              : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
          )}
        >
          <CloudUpload className="w-4 h-4 mr-2" />
          Por Subir PJUD
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded-lg text-[10px]",
            activeTab === 'por_subir_pjud' ? "bg-amber-500 text-white" : "bg-surface-container-highest text-on-surface-variant"
          )}>
            {porSubirPjud.length}
          </span>
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-[500px]">
        {/* List View */}
        {!selectedEstampe ? (
          <div className="flex flex-col lg:flex-row gap-8 flex-1">
            {/* Left Column: Active List */}
            <div className="w-full flex flex-col gap-6 overflow-y-auto">
              <div className="minimal-card flex flex-col h-full bg-white">
                <div className={cn(
                  "p-4 md:p-5 border-b border-outline flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-2xl",
                  activeTab === 'por_autorizar' ? "bg-surface-container/20" :
                  activeTab === 'por_firmar' ? "bg-primary/5" : "bg-amber-50/50"
                )}>
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 accent-primary cursor-pointer rounded"
                      title="Seleccionar todos"
                    />
                    <h3 className={cn(
                      "text-sm font-bold uppercase tracking-widest",
                      activeTab === 'por_autorizar' ? "text-primary" :
                      activeTab === 'por_firmar' ? "text-primary" : "text-amber-700"
                    )}>
                      {activeTab === 'por_autorizar' ? 'Borradores' :
                       activeTab === 'por_firmar' ? 'Listos' : 'Pendientes PJUD'}
                    </h3>
                  </div>
                  
                  {selectedItemIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      {activeTab === 'por_autorizar' && (
                        <>
                          <button onClick={handleBulkDelete} className="p-2 text-error hover:bg-error/10 rounded-xl transition-all" title="Eliminar seleccionados"><Trash2 className="w-5 h-5"/></button>
                          <button onClick={handleBulkAuthorize} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all" title="Autorizar seleccionados"><CheckCircle2 className="w-5 h-5"/></button>
                        </>
                      )}
                      {activeTab === 'por_firmar' && (
                        <div className="flex items-center gap-1">
                          <button onClick={handleBulkDelete} className="p-2 text-error hover:bg-error/10 rounded-xl transition-all" title="Eliminar seleccionados"><Trash2 className="w-5 h-5"/></button>
                          <button onClick={handleBulkReturnToAuthorize} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-all" title="Volver a Autorizar seleccionados"><RotateCcw className="w-5 h-5"/></button>
                          <button onClick={handleBulkSign} className="p-2 text-success hover:bg-success/10 rounded-xl transition-all" title="Firmar seleccionados"><FileSignature className="w-5 h-5"/></button>
                        </div>
                      )}
                      {activeTab === 'por_subir_pjud' && (
                        <button onClick={handleBulkUploadPjud} className="p-2 text-amber-600 hover:bg-amber-600/10 rounded-xl transition-all" title="Marcar subidos a PJUD"><CloudUpload className="w-5 h-5"/></button>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto">
                  {activeList.map(renderEstampeItem)}
                  {activeList.length === 0 && (
                    <div className="col-span-full p-20 text-center flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                        <FileCheck className="w-10 h-10 text-on-surface-variant opacity-40" />
                      </div>
                      <h3 className="text-xl font-bold text-primary tracking-tight">No hay documentos en esta etapa</h3>
                      <p className="text-on-surface-variant text-sm mt-2">Todo está al día por ahora.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor/Preview View (Drill-down) */
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="mb-6">
              <button 
                onClick={() => setSelectedEstampeId(null)}
                className="flex items-center text-sm font-bold text-secondary hover:text-secondary/80 transition-all"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Listado
              </button>
            </div>

            <div className="minimal-card flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-4 md:p-6 border-b border-outline bg-surface-container/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-primary tracking-tight">{selectedEstampe.type}</h3>
                  <p className="text-xs md:text-sm font-medium text-on-surface-variant mt-1">ROL: {selectedEstampe.rol} | {selectedEstampe.defendant}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                  {activeTab === 'por_autorizar' && !isEditing && (
                    <>
                      {showDeleteConfirm ? (
                        <div className="flex items-center gap-3 bg-error/10 px-4 py-2 border border-error/20 rounded-xl animate-in zoom-in-95">
                          <span className="text-xs font-bold text-error uppercase tracking-widest">¿Seguro?</span>
                          <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-bold text-on-surface-variant hover:text-on-surface px-2">No</button>
                          <button onClick={handleDelete} className="text-xs font-bold text-error hover:text-error/80 px-2">Sí</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-3 border border-error/20 text-error rounded-xl hover:bg-error/5 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-3 border border-outline text-on-surface-variant rounded-xl hover:bg-surface-container transition-all"
                        title="Editar"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleAuthorize}
                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                        title="Autorizar"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {activeTab === 'por_firmar' && (
                    <div className="flex gap-3">
                      {showDeleteConfirm ? (
                        <div className="flex items-center gap-3 bg-error/10 px-4 py-2 border border-error/20 rounded-xl animate-in zoom-in-95">
                          <span className="text-xs font-bold text-error uppercase tracking-widest">¿Seguro?</span>
                          <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-bold text-on-surface-variant hover:text-on-surface px-2">No</button>
                          <button onClick={handleDelete} className="text-xs font-bold text-error hover:text-error/80 px-2">Sí</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-3 border border-error/20 text-error rounded-xl hover:bg-error/5 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={handleReturnToAuthorize}
                        className="p-3 border border-outline text-on-surface-variant rounded-xl hover:bg-surface-container transition-all"
                        title="Volver a Autorizar"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleSign}
                        className="p-3 bg-success text-white rounded-xl hover:bg-success/90 transition-all shadow-sm"
                        title="Firmar"
                      >
                        <FileSignature className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {activeTab === 'por_subir_pjud' && (
                    <button 
                      onClick={handleUploadPjud}
                      className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-sm"
                      title="Marcar Subido a PJUD"
                    >
                      <CloudUpload className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 md:p-8 bg-white overflow-y-auto">
                {isEditing ? (
                  <RichTextEditor value={editContent} onChange={setEditContent} />
                ) : (
                  <div className="max-w-4xl mx-auto bg-white p-6 md:p-12 shadow-sm border border-outline rounded-xl min-h-[600px]">
                    <div 
                      className="prose prose-sm max-w-none text-on-surface leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: selectedEstampe.content }}
                    />
                  </div>
                )}
              </div>

              {isEditing && activeTab === 'por_autorizar' && (
                <div className="p-4 md:p-6 border-t border-outline bg-surface-container/10 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto px-6 py-3 border border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Borrador
                  </button>
                  <button 
                    onClick={handleAuthorize}
                    className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Autorizar Firma
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
