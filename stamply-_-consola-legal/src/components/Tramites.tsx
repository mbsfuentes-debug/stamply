import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, AlertTriangle, CheckCircle2, DollarSign, FileText, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Tramite, TRAMITE_TYPES } from '../types';
import TramiteStatusBadge from './TramiteStatusBadge';
import TramiteForm from './TramiteForm';
import { motion, AnimatePresence } from 'motion/react';

interface TramitesProps {
  tramites: Tramite[];
  setTramites: (t: Tramite[]) => void;
  cases?: any[];
}

const STATUS_OPTIONS = ['Todos', 'pendiente', 'en_proceso', 'completado', 'fallido'];

export default function Tramites({ tramites, setTramites, cases = [] }: TramitesProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);

  const filtered = useMemo(() => {
    return tramites.filter(t => {
      const matchSearch = !search ||
        t.causaRol.toLowerCase().includes(search.toLowerCase()) ||
        t.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
        t.type.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || t.status === statusFilter;
      const matchType = typeFilter === 'Todos' || t.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [tramites, search, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: tramites.length,
    pendiente: tramites.filter(t => t.status === 'pendiente').length,
    completado: tramites.filter(t => t.status === 'completado').length,
    urgente: tramites.filter(t => t.urgente).length,
    porCobrar: tramites.filter(t => t.status === 'completado' && !t.facturado).reduce((s, t) => s + t.monto + t.distanceFee, 0),
  }), [tramites]);

  const handleSave = async (tramite: Tramite) => {
    if (editingTramite) {
      try {
        const saved = await fetch(`/api/tramites/${tramite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tramite),
        }).then(r => r.json());
        setTramites(tramites.map(t => t.id === tramite.id ? saved : t));
      } catch {
        setTramites(tramites.map(t => t.id === tramite.id ? tramite : t));
      }
    } else {
      try {
        const saved = await fetch('/api/tramites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tramite),
        }).then(r => r.json());
        setTramites([saved, ...tramites]);
      } catch {
        setTramites([tramite, ...tramites]);
      }
    }
    setShowForm(false);
    setEditingTramite(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este trámite?')) {
      try {
        await fetch(`/api/tramites/${id}`, { method: 'DELETE' });
      } catch {
        // ignore — remove from state anyway
      }
      setTramites(tramites.filter(t => t.id !== id));
    }
  };

  const handleEdit = (t: Tramite) => {
    setEditingTramite(t);
    setShowForm(true);
  };

  // For the form, we need a causa context. If creating from here, pick first case.
  const defaultCausa = cases[0] || { id: '', rol: 'Sin causa', cliente: '' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Trámites</h1>
          <p className="text-on-surface-variant text-sm mt-1">Gestión de diligencias judiciales</p>
        </div>
        <button
          onClick={() => { setEditingTramite(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trámite
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-primary' },
          { label: 'Pendientes', value: stats.pendiente, color: 'text-warning' },
          { label: 'Completados', value: stats.completado, color: 'text-success' },
          { label: 'Urgentes', value: stats.urgente, color: 'text-error' },
          { label: 'Por Cobrar', value: `$${stats.porCobrar.toLocaleString('es-CL')}`, color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="minimal-card p-4 bg-white text-center">
            <p className={cn('text-2xl font-extrabold', s.color)}>{s.value}</p>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por ROL, cliente o tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none bg-white"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos los estados' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none bg-white max-w-[220px]"
        >
          <option value="Todos">Todos los tipos</option>
          {TRAMITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="minimal-card p-16 bg-white text-center">
          <FileText className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="text-sm font-bold text-on-surface-variant">No hay trámites registrados</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Crea el primer trámite usando el botón superior</p>
        </div>
      ) : (
        <div className="minimal-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline">
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ROL / Cliente</th>
                  <th className="text-left px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</th>
                  <th className="text-left px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Fecha</th>
                  <th className="text-right px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Monto</th>
                  <th className="text-center px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(t => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-outline/50 hover:bg-surface-container/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.urgente && <AlertTriangle className="w-3.5 h-3.5 text-error shrink-0" />}
                          <div>
                            <p className="text-sm font-bold text-primary">{t.causaRol}</p>
                            <p className="text-xs text-on-surface-variant">{t.clienteNombre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-on-surface max-w-[160px] leading-tight">{t.type}</p>
                      </td>
                      <td className="px-4 py-4">
                        <TramiteStatusBadge status={t.status} />
                        {t.facturado && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Facturado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-on-surface-variant">{formatDate(t.fechaRealizado)}</p>
                        <p className="text-[10px] text-on-surface-variant/60">{t.horaRealizado} hrs</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-secondary">${(t.monto + t.distanceFee).toLocaleString('es-CL')}</p>
                        {t.distanceFee > 0 && (
                          <p className="text-[10px] text-on-surface-variant">+${t.distanceFee.toLocaleString('es-CL')} viático</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5 text-on-surface-variant" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 hover:bg-error/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-error" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TramiteForm
          causaId={editingTramite?.causaId ?? defaultCausa.id}
          causaRol={editingTramite?.causaRol ?? defaultCausa.rol}
          clienteNombre={editingTramite?.clienteNombre ?? defaultCausa.cliente}
          paymentTermSnapshot={editingTramite?.payment_term_snapshot ?? '30_dias'}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingTramite(null); }}
          existing={editingTramite ?? undefined}
        />
      )}
    </div>
  );
}
