import React, { useState } from 'react';
import { Search, Filter, Upload, FileText, Download, Eye, Trash2, File as FileIcon, ArrowLeft } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface DocumentsProps {
  documents: any[];
  setDocuments: (docs: any[]) => void;
}

export default function Documents({ documents, setDocuments }: DocumentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'preview'>('list');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/documents/${id}`, { method: 'DELETE' }); } catch {}
    setDocuments(documents.filter(doc => doc.id !== id));
    if (selectedDoc?.id === id) {
      setView('list');
      setSelectedDoc(null);
    }
  };

  const handlePreview = (doc: any) => {
    setSelectedDoc(doc);
    setView('preview');
  };

  if (view === 'preview' && selectedDoc) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
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
              <h2 className="text-2xl font-bold text-primary tracking-tight">Vista Previa</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-medium">{selectedDoc.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar
            </button>
            <button 
              onClick={() => handleDelete(selectedDoc.id)}
              className="px-4 py-2 border border-error/20 text-error font-bold text-sm rounded-xl hover:bg-error/5 transition-all flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
          <div className="lg:col-span-3 bg-surface-container/30 border border-outline rounded-2xl flex items-center justify-center p-12 relative overflow-hidden">
            {/* Mock PDF Viewer */}
            <div className="w-full max-w-3xl h-full bg-white shadow-sm rounded-xl border border-outline flex flex-col p-12 space-y-6 animate-in zoom-in-95 duration-500 overflow-y-auto">
              <div className="flex justify-between items-start border-b-2 border-primary pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">Documento Judicial</p>
                  <p className="text-xs font-medium text-on-surface-variant mt-1">ROL: {selectedDoc.rol}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-surface-container/50 rounded w-3/4"></div>
                <div className="h-4 bg-surface-container/50 rounded w-full"></div>
                <div className="h-4 bg-surface-container/50 rounded w-5/6"></div>
                <div className="h-4 bg-surface-container/50 rounded w-full"></div>
                <div className="h-32 bg-surface-container/50 rounded w-full"></div>
                <div className="h-4 bg-surface-container/50 rounded w-2/3"></div>
                <div className="h-4 bg-surface-container/50 rounded w-full"></div>
                <div className="h-4 bg-surface-container/50 rounded w-full"></div>
                <div className="h-4 bg-surface-container/50 rounded w-3/4"></div>
              </div>
              <div className="pt-12 border-t border-outline flex justify-center">
                <div className="w-48 h-12 border-b border-on-surface/30"></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="minimal-card p-6 bg-white">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Metadatos</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Tipo de Archivo</p>
                  <p className="text-sm font-bold text-on-surface">{selectedDoc.type}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Fecha de Carga</p>
                  <p className="text-sm font-bold text-on-surface">{formatDate(selectedDoc.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Tamaño</p>
                  <p className="text-sm font-bold text-on-surface">{selectedDoc.size}</p>
                </div>
              </div>
            </section>

            <section className="minimal-card p-6 bg-white">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Causa Asociada</h3>
              <div className="p-4 bg-surface-container/30 rounded-xl border border-outline">
                <p className="text-sm font-bold text-primary mb-1">{selectedDoc.rol}</p>
                <p className="text-xs font-medium text-on-surface-variant">Ver expediente completo</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Gestor de Documentos</h2>
          <p className="text-on-surface-variant mt-1 text-sm font-medium">Administre los archivos adjuntos y estampes de sus causas.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Buscar documento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-outline text-sm focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all rounded-2xl shadow-sm"
            />
          </div>
          <button className="p-3.5 bg-white border border-outline text-on-surface-variant hover:text-secondary hover:border-secondary transition-all rounded-2xl shadow-sm" title="Filtrar">
            <Filter className="w-5 h-5" />
          </button>
          <button className="px-6 py-3.5 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all flex items-center shadow-sm">
            <Upload className="w-4 h-4 mr-2" />
            Subir
          </button>
        </div>
      </div>

      <div className="minimal-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/30 border-b border-outline">
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Nombre del Archivo</th>
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Causa (ROL)</th>
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Fecha</th>
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider">Tamaño</th>
                <th className="p-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/50">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-container/10 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-primary">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="badge badge-secondary">
                      {doc.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-on-surface">{doc.rol}</td>
                  <td className="p-4 text-sm font-medium text-on-surface-variant">{formatDate(doc.date)}</td>
                  <td className="p-4 text-sm font-medium text-on-surface-variant">{doc.size}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePreview(doc)}
                        className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all" 
                        title="Ver Documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all" title="Descargar">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all" 
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-on-surface-variant" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">No se encontraron documentos</h3>
                    <p className="text-on-surface-variant text-sm mt-1">Intenta con otros términos de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
