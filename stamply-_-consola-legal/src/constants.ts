import { Case, Protocol } from './types';

export const MOCK_CASES: Case[] = [
  {
    id: '1',
    rol: 'C-4523-2023',
    court: '1er Juzgado Civil de Santiago',
    type: 'Auditoría Procesal',
    dueDate: '2024-10-24',
    assignee: { name: 'Juan Pérez', initials: 'JP' },
    status: 'CRITICAL',
  },
  {
    id: '2',
    rol: 'V-8902-2024',
    court: 'Corte Suprema Sección 4',
    type: 'Disposición Final',
    dueDate: '2024-10-28',
    assignee: { name: 'Alicia M.', initials: 'AM' },
    status: 'PENDING',
  },
  {
    id: '3',
    rol: 'E-1122-2023',
    court: 'Corte de Apelaciones Sala B',
    type: 'Presentación de Pruebas',
    dueDate: '2024-11-02',
    assignee: { name: 'Roberto S.', initials: 'RS' },
    status: 'PENDING',
  },
];

export const MOCK_PROTOCOLS: Protocol[] = [
  {
    id: '1',
    title: 'Sello de Verificación #A29',
    subtitle: 'Aprobación Corte de Apelaciones',
    status: 'FIRMADO',
    icon: 'task',
  },
  {
    id: '2',
    title: 'Declaración de Testigo E-02',
    subtitle: 'Fase de Borrador',
    status: 'NOTIFICADO',
    icon: 'history_edu',
  },
  {
    id: '3',
    title: 'Archivo de Cierre de Caso',
    subtitle: 'Esperando Timbre Final',
    status: 'PENDIENTE',
    icon: 'archive',
  },
];
