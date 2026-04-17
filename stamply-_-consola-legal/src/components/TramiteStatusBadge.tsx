import React from 'react';
import { cn } from '../lib/utils';
import { Clock, Play, CheckCircle2, XCircle } from 'lucide-react';

export type TramiteStatus = 'pendiente' | 'en_proceso' | 'completado' | 'fallido';

interface TramiteStatusBadgeProps {
  status: TramiteStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<TramiteStatus, { label: string; className: string; Icon: React.ElementType }> = {
  pendiente:   { label: 'Pendiente',   className: 'bg-warning/10 text-warning border-warning/20',   Icon: Clock },
  en_proceso:  { label: 'En Proceso',  className: 'bg-info/10 text-info border-info/20',             Icon: Play },
  completado:  { label: 'Completado',  className: 'bg-success/10 text-success border-success/20',   Icon: CheckCircle2 },
  fallido:     { label: 'Fallido',     className: 'bg-error/10 text-error border-error/20',         Icon: XCircle },
};

export default function TramiteStatusBadge({ status, size = 'sm' }: TramiteStatusBadgeProps) {
  const { label, className, Icon } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-full',
      size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1',
      className
    )}>
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {label}
    </span>
  );
}
