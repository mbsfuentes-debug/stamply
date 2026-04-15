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
