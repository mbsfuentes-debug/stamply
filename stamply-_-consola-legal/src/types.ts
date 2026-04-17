export interface Case {
  id: string;
  rol: string;
  court: string;
  type: string;
  dueDate: string;
  assignee: {
    name: string;
    initials: string;
  };
  status: 'CRITICAL' | 'PENDING' | 'COMPLETED';
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isUrgent: boolean;
}

export interface Protocol {
  id: string;
  title: string;
  subtitle: string;
  status: 'FIRMADO' | 'NOTIFICADO' | 'PENDIENTE';
  icon: string;
}

export const TRAMITE_TYPES = [
  'Notificación Personal (Art. 40 CPC)',
  'Búsqueda (Art. 44 CPC)',
  'Notificación Art. 44',
  'Requerimiento de Pago',
  'Embargo',
  'Lanzamiento',
  'Receptor Parte',
  'Certificado de Rebeldía',
  'Notificación Ley 17.322',
] as const;

export interface Tramite {
  id: string;
  causaId: string;
  causaRol: string;
  clienteNombre: string;
  type: string;
  status: 'pendiente' | 'en_proceso' | 'completado' | 'fallido';
  fechaRealizado: string;
  horaRealizado: string;
  resultado: string;
  monto: number;
  distanceFee: number;
  urgente: boolean;
  payment_term_snapshot: string;
  createdAt: string;
  facturado: boolean;
}
