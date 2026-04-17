import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tramite, TRAMITE_TYPES } from '../types';

interface TramiteFormProps {
  causaId: string;
  causaRol: string;
  clienteNombre: string;
  paymentTermSnapshot?: string;
  onSave: (tramite: Tramite) => void;
  onCancel: () => void;
  existing?: Tramite;
}

const DEFAULT_MONTOS: Record<string, number> = {
  'Notificación Personal (Art. 40 CPC)': 45000,
  'Búsqueda (Art. 44 CPC)': 35000,
  'Notificación Art. 44': 45000,
  'Requerimiento de Pago': 55000,
  'Embargo': 70000,
  'Lanzamiento': 80000,
  'Receptor Parte': 30000,
  'Certificado de Rebeldía': 25000,
  'Notificación Ley 17.322': 40000,
};

export default function TramiteForm({ causaId, causaRol, clienteNombre, paymentTermSnapshot = '30_dias', onSave, onCancel, existing }: TramiteFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    type: existing?.type ?? TRAMITE_TYPES[0],
    status: existing?.status ?? 'pendiente' as Tramite['status'],
    fechaRealizado: existing?.fechaRealizado ?? today,
    horaRealizado: existing?.horaRealizado ?? '10:00',
    resultado: existing?.resultado ?? '',
    monto: existing?.monto ?? DEFAULT_MONTOS[TRAMITE_TYPES[0]],
    distanceFee: existing?.distanceFee ?? 0,
    urgente: existing?.urgente ?? false,
  });

  const handleTypeChange = (type: string) => {
    setForm(f => ({ ...f, type, monto: DEFAULT_MONTOS[type] ?? 45000 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tramite: Tramite = {
      id: existing?.id ?? Math.random().toString(36).substr(2, 9),
      causaId,
      causaRol,
      clienteNombre,
      payment_term_snapshot: paymentTermSnapshot,
      facturado: existing?.facturado ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ...form,
    };
    onSave(tramite);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline">
          <div>
            <h2 className="text-lg font-bold text-primary">{existing ? 'Editar Trámite' : 'Nuevo Trámite'}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Causa: <span className="font-bold text-secondary">{causaRol}</span></p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo */}
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Tipo de Trámite</label>
            <select
              value={form.type}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full px-4 py-3 border border-outline rounded-xl text-sm text-on-surface bg-white focus:border-secondary focus:outline-none"
            >
              {TRAMITE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Estado</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as Tramite['status'] }))}
              className="w-full px-4 py-3 border border-outline rounded-xl text-sm text-on-surface bg-white focus:border-secondary focus:outline-none"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="fallido">Fallido</option>
            </select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Fecha</label>
              <input
                type="date"
                value={form.fechaRealizado}
                onChange={e => setForm(f => ({ ...f, fechaRealizado: e.target.value }))}
                className="w-full px-4 py-3 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Hora</label>
              <input
                type="time"
                value={form.horaRealizado}
                onChange={e => setForm(f => ({ ...f, horaRealizado: e.target.value }))}
                className="w-full px-4 py-3 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none"
              />
            </div>
          </div>

          {/* Resultado */}
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Resultado / Notas</label>
            <textarea
              rows={3}
              value={form.resultado}
              onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))}
              placeholder="Descripción del resultado del trámite..."
              className="w-full px-4 py-3 border border-outline rounded-xl text-sm resize-none focus:border-secondary focus:outline-none"
            />
          </div>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Monto (CLP)</label>
              <input
                type="number"
                min={0}
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Viático (CLP)</label>
              <input
                type="number"
                min={0}
                value={form.distanceFee}
                onChange={e => setForm(f => ({ ...f, distanceFee: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-outline rounded-xl text-sm focus:border-secondary focus:outline-none"
              />
            </div>
          </div>

          {/* Urgente */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-outline hover:border-error/40 transition-colors">
            <input
              type="checkbox"
              checked={form.urgente}
              onChange={e => setForm(f => ({ ...f, urgente: e.target.checked }))}
              className="w-4 h-4 accent-red-600"
            />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span className="text-sm font-bold text-on-surface">Marcar como Urgente</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-outline text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-3 bg-secondary text-white font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all">
              {existing ? 'Guardar Cambios' : 'Crear Trámite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
