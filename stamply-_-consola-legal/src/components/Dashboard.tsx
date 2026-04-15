import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2,
  PlusCircle,
  FileSignature,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Folder,
  FileText,
  DollarSign,
  Clock,
  Send,
  X,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { MOCK_CASES } from '../constants';

interface DashboardProps {
  setActiveTab?: (tab: string) => void;
  documents?: any[];
}

type TaskStatus = 'pending' | 'completed' | 'returned';

interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  timestamp: string;
  reply?: string;
  author: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    text: 'Revisar firma en exhorto C-123-2024, el PDF venía con error de capa.',
    status: 'pending',
    timestamp: '10:30 AM',
    author: 'Oficina'
  },
  {
    id: 't2',
    text: 'Falta adjuntar comprobante de notificación en causa C-892-2024.',
    status: 'pending',
    timestamp: '09:15 AM',
    author: 'Oficina'
  }
];

export default function Dashboard({ setActiveTab = () => {}, documents = [] }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const returnedTasks = tasks.filter(t => t.status === 'returned');

  const signedDocs = documents.filter(d => d.type === 'Estampe Firmado' || d.type === 'Acta Firmada').slice(0, 3);

  const handleCompleteTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t));
  };

  const handleReplyTask = (id: string) => {
    if (replyText.trim()) {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: 'returned', reply: replyText } : t));
      setReplyingTo(null);
      setReplyText('');
    }
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: `t${Date.now()}`,
        text: newTaskText,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        author: 'Yo'
      };
      setTasks([newTask, ...tasks]);
      setNewTaskText('');
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold font-headline text-primary tracking-tight">Panel de Control</h2>
        <p className="text-on-surface-variant mt-1 text-sm font-medium">Resumen y comunicación rápida</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Task Wall & Quick Actions */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Quick Actions */}
          <section>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveTab('new-case')}
                className="flex flex-col items-center justify-center p-4 bg-white border border-outline rounded-2xl hover:border-secondary hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-primary text-center">Nueva<br/>Causa</span>
              </button>
              <button 
                onClick={() => setActiveTab('smart-estampe')}
                className="flex flex-col items-center justify-center p-4 bg-white border border-outline rounded-2xl hover:border-secondary hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-primary text-center">Estampe<br/>Inteligente</span>
              </button>
              <button 
                onClick={() => setActiveTab('signatures')}
                className="flex flex-col items-center justify-center p-4 bg-white border border-outline rounded-2xl hover:border-secondary hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileSignature className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-primary text-center">Firmar<br/>Documentos</span>
              </button>
            </div>
          </section>

          {/* Task Wall (Muro de Comunicación) */}
          <section className="minimal-card p-6 bg-surface-container-low border-2 border-dashed border-outline">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  Comunicación
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">Mensajes y tareas del equipo</p>
              </div>
              <span className="badge badge-secondary">{pendingTasks.length} Pendientes</span>
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Escribir nuevo mensaje o tarea..."
                className="flex-1 p-3 text-sm bg-white border border-outline rounded-xl focus:border-secondary outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <button 
                onClick={handleAddTask}
                className="px-4 py-2 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors flex items-center justify-center"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {pendingTasks.map(task => (
                <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-outline relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{task.author}</span>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1 ml-2 inline-flex">
                        <Clock className="w-3 h-3" /> {task.timestamp}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-on-surface font-medium mb-4 leading-relaxed">{task.text}</p>
                  
                  {replyingTo === task.id ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe tu respuesta o instrucción..."
                        className="w-full p-3 text-sm bg-surface-container/30 border border-outline rounded-xl resize-none focus:border-secondary outline-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleReplyTask(task.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Enviar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className="flex-1 py-2 bg-success/10 text-success hover:bg-success hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Listo
                      </button>
                      <button 
                        onClick={() => setReplyingTo(task.id)}
                        className="flex-1 py-2 bg-surface-container text-on-surface-variant hover:bg-secondary hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" /> Responder
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-success/20 mx-auto mb-3" />
                  <p className="text-sm font-bold text-on-surface-variant">No hay tareas pendientes</p>
                </div>
              )}
            </div>

            {/* History of returned/completed */}
            {(returnedTasks.length > 0 || completedTasks.length > 0) && (
              <div className="mt-8 pt-6 border-t border-outline">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Actividad Reciente</h4>
                <div className="space-y-3">
                  {returnedTasks.map(task => (
                    <div key={task.id} className="bg-surface-container/30 p-3 rounded-xl border border-outline text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-warning"></span>
                        <span className="text-[10px] font-bold text-on-surface-variant">Respondido a {task.author}</span>
                      </div>
                      <p className="text-on-surface-variant line-clamp-1 mb-1 text-xs">"{task.text}"</p>
                      <p className="text-primary font-medium text-xs bg-white p-2 rounded-lg border border-outline">↳ {task.reply}</p>
                    </div>
                  ))}
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 text-sm text-on-surface-variant opacity-60">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="line-clamp-1">{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Alerts, Cases, Docs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Pending Payments Alert */}
          <section className="bg-error/10 border border-error/20 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2 bg-error/20 text-error rounded-full shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-error">Alertas de Pago</h4>
              <p className="text-xs text-error/80 mt-1 font-medium">Existen 3 facturas pendientes de pago por parte de clientes (Total: $145.000).</p>
              <button onClick={() => setShowPaymentDetails(true)} className="mt-2 text-xs font-bold text-error hover:underline">Ver detalles</button>
            </div>
          </section>

          {/* Latest Cases */}
          <section className="minimal-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <Folder className="w-4 h-4" /> Últimas Causas
              </h3>
              <button 
                onClick={() => setActiveTab('cases')}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_CASES.slice(0, 3).map(c => (
                <div key={c.id} className="p-3 bg-surface-container/30 rounded-xl border border-outline flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-primary">{c.rol}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{c.court}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-md",
                    c.status === 'CRITICAL' ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                  )}>
                    {c.status === 'CRITICAL' ? 'Urgente' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Latest Signed Docs */}
          <section className="minimal-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Últimos Firmados
              </h3>
              <button 
                onClick={() => setActiveTab('documents')}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                Ir a Docs <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {signedDocs.length > 0 ? signedDocs.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-surface-container/30 rounded-xl border border-outline">
                  <div className="p-2 bg-success/10 text-success rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">{d.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDate(d.date)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-on-surface-variant">
                  <p className="text-xs font-medium">No hay documentos firmados recientes.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="minimal-card p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-error flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Detalles de Pago
              </h3>
              <button onClick={() => setShowPaymentDetails(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-surface-container/30 rounded-xl border border-outline flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-primary">Factura #4592</p>
                  <p className="text-xs text-on-surface-variant">Banco Santander</p>
                </div>
                <span className="text-sm font-bold text-error">$45.000</span>
              </div>
              <div className="p-4 bg-surface-container/30 rounded-xl border border-outline flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-primary">Factura #4593</p>
                  <p className="text-xs text-on-surface-variant">Scotiabank</p>
                </div>
                <span className="text-sm font-bold text-error">$60.000</span>
              </div>
              <div className="p-4 bg-surface-container/30 rounded-xl border border-outline flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-primary">Factura #4595</p>
                  <p className="text-xs text-on-surface-variant">Banco de Chile</p>
                </div>
                <span className="text-sm font-bold text-error">$40.000</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-outline flex justify-between items-center">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Total Pendiente</span>
              <span className="text-2xl font-black text-error">$145.000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
