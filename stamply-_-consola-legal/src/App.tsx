import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SmartIntake from './components/SmartIntake';
import SmartRoute from './components/SmartRoute';
import CasesList, { INITIAL_CASES } from './components/CasesList';
import Documents from './components/Documents';
import SignatureCenter from './components/SignatureCenter';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Clients, { Client, INITIAL_CLIENTS } from './components/Clients';
import SmartEstampe from './components/SmartEstampe';
import TemplateLibrary, { Template } from './components/TemplateLibrary';
import Collections from './components/Collections';
import { 
  ClipboardList, 
  Map as MapIcon, 
  LayoutDashboard,
  CheckSquare, 
  UserCircle,
  Plus,
  FileText,
  Folder,
  PenTool,
  Sparkles
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Global Mock Data
const INITIAL_DOCS = [
  { id: '1', name: 'Demanda_Principal.pdf', type: 'Demanda', rol: 'C-1452-2023', date: '2023-10-24', size: '2.4 MB' },
  { id: '2', name: 'Resolucion_Busqueda.pdf', type: 'Resolución', rol: 'C-892-2024', date: '2024-01-16', size: '1.1 MB' },
  { id: '3', name: 'Estampe_Notificacion.pdf', type: 'Estampe', rol: 'C-331-2024', date: '2024-02-03', size: '850 KB' },
  { id: '4', name: 'Boleta_Honorarios_145.pdf', type: 'Boleta', rol: 'C-1452-2023', date: '2023-10-25', size: '120 KB' },
  { id: '5', name: 'Certificado_Rebeldia.pdf', type: 'Certificado', rol: 'C-892-2024', date: '2024-02-10', size: '450 KB' }
];

const INITIAL_ESTAMPES = [
  {
    id: '1',
    rol: 'C-1452-2023',
    defendant: 'INVERSIONES Y ASESORIAS LIMITADA',
    type: 'Notificación Personal',
    status: 'borrador',
    date: '2023-10-24',
    content: 'En Santiago, a 24 de Octubre de 2023, siendo las 10:00 horas, me constituí en el domicilio ubicado en Av. Providencia 1234, comuna de Providencia, con el objeto de notificar la demanda a INVERSIONES Y ASESORIAS LIMITADA. Fui atendido por don Carlos Silva, quien se identificó como representante legal...'
  },
  {
    id: '2',
    rol: 'C-892-2024',
    defendant: 'JUAN PÉREZ GONZÁLEZ',
    type: 'Búsqueda',
    status: 'listo',
    date: '2024-01-15',
    content: 'En Santiago, a 15 de Enero de 2024, siendo las 15:30 horas, me constituí en el domicilio ubicado en Calle Falsa 123, comuna de Santiago, procediendo a realizar la búsqueda de don JUAN PÉREZ GONZÁLEZ, no siendo habido en el lugar...'
  },
  {
    id: '3',
    rol: 'C-331-2024',
    defendant: 'COMERCIALIZADORA DEL SUR SPA',
    type: 'Requerimiento de Pago',
    status: 'firmado',
    date: '2024-02-02',
    content: 'En Santiago, a 02 de Febrero de 2024, requerí de pago a COMERCIALIZADORA DEL SUR SPA, por la suma de $55.000, no efectuando el pago en el acto...'
  }
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Notificación Personal',
    description: 'Modelo estándar para notificación personal del artículo 40 del CPC.',
    content: 'En Santiago, a [FECHA], siendo las [HORA] horas, me constituí en el domicilio ubicado en [DIRECCION], comuna de [COMUNA], con el objeto de notificar la demanda a [DEMANDADO] en la causa Rol [ROL] del [TRIBUNAL].\n\nFui atendido por quien dijo ser el demandado, a quien entregué copias íntegras de la demanda y resolución recaída en ella.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial'
  },
  {
    id: '2',
    name: 'Búsqueda Art. 44',
    description: 'Certificación de búsquedas positivas para posterior notificación por el artículo 44.',
    content: 'En Santiago, a [FECHA], siendo las [HORA] horas, me constituí en el domicilio ubicado en [DIRECCION], comuna de [COMUNA], procediendo a realizar la búsqueda de [DEMANDADO] en la causa Rol [ROL] del [TRIBUNAL].\n\nNo habiendo sido habido en el lugar, me cercioré de que este es su morada o lugar donde ejerce su industria, profesión o empleo, por haber conversado con un adulto que se encontraba en el lugar.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial'
  },
  {
    id: '3',
    name: 'Requerimiento de Pago',
    description: 'Acta de requerimiento de pago en juicios ejecutivos.',
    content: 'En Santiago, a [FECHA], siendo las [HORA] horas, requerí de pago a [DEMANDADO], en la causa Rol [ROL] del [TRIBUNAL], por la suma adeudada.\n\nEl ejecutado no efectuó el pago en el acto, por lo que se procedió a trabar embargo sobre los bienes suficientes para cubrir la deuda.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Lifted State
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [estampes, setEstampes] = useState(INITIAL_ESTAMPES);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [cases, setCases] = useState(INITIAL_CASES);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} documents={documents} />;
      case 'new-case':
        return <SmartIntake 
          clients={clients}
          setClients={setClients}
          onSuccess={(newCase) => {
          if (newCase) {
            setCases([newCase, ...cases]);
          }
          setActiveTab('cases');
        }} />;
      case 'cases':
        return <CasesList cases={cases} setCases={setCases} setActiveTab={setActiveTab} clients={clients} setClients={setClients} />;
      case 'documents':
        return <Documents documents={documents} setDocuments={setDocuments} />;
      case 'signatures':
        return <SignatureCenter 
          estampes={estampes} 
          setEstampes={setEstampes} 
          documents={documents} 
          setDocuments={setDocuments} 
        />;
      case 'smart-estampe':
        return <SmartEstampe 
          templates={templates}
          clients={clients}
          onSendToAuthorize={(newEstampe) => {
            setEstampes([newEstampe, ...estampes]);
            setActiveTab('signatures');
          }} 
        />;
      case 'template-library':
        return <TemplateLibrary templates={templates} setTemplates={setTemplates} />;
      case 'clients':
        return <Clients templates={templates} clients={clients} setClients={setClients} />;
      case 'collections':
        return <Collections clients={clients} />;
      case 'map':
        return <SmartRoute cases={cases} clients={clients} />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-surface-container rounded-none flex items-center justify-center mb-6 border border-outline">
              <span className="text-primary text-xl font-bold">!</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface">Módulo en Desarrollo</h3>
            <p className="text-on-surface-variant mt-2 text-[10px] uppercase tracking-widest">Esta sección estará disponible en la próxima actualización.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className={cn(
          "flex-1 overflow-y-auto p-8 md:p-12 pb-32 md:pb-12 transition-all duration-300",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Contextual FAB (Desktop Only) */}
      <button 
        onClick={() => setActiveTab('new-case')}
        className="hidden md:flex fixed bottom-10 right-8 w-16 h-16 bg-secondary text-white items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40 rounded-2xl group"
        title="Nuevo Ingreso"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Mobile Navigation (Receptor Focus) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-md border-t border-white/10 px-6 pt-3 pb-8 flex justify-between items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <button onClick={() => setActiveTab('map')} className={cn("flex flex-col items-center gap-1.5 p-1 transition-all", activeTab === 'map' ? "text-secondary" : "text-white/60 hover:text-white/80")}>
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-wider">Ruta</span>
        </button>
        <button onClick={() => setActiveTab('cases')} className={cn("flex flex-col items-center gap-1.5 p-1 transition-all", activeTab === 'cases' ? "text-secondary" : "text-white/60 hover:text-white/80")}>
          <Folder className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-wider">Causas</span>
        </button>
        
        {/* Center Highlighted Action: Estampe */}
        <button onClick={() => setActiveTab('smart-estampe')} className="flex flex-col items-center gap-1.5 p-1 -mt-8 relative group">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center shadow-lg shadow-secondary/40 border-4 border-background text-white group-active:scale-95 transition-all">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className={cn("text-[10px] font-bold tracking-wider", activeTab === 'smart-estampe' ? "text-secondary" : "text-white/60")}>Estampe</span>
        </button>

        <button onClick={() => setActiveTab('signatures')} className={cn("flex flex-col items-center gap-1.5 p-1 transition-all", activeTab === 'signatures' ? "text-secondary" : "text-white/60 hover:text-white/80")}>
          <PenTool className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-wider">Firmas</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center gap-1.5 p-1 transition-all", activeTab === 'profile' ? "text-secondary" : "text-white/60 hover:text-white/80")}>
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-wider">Perfil</span>
        </button>
      </nav>
    </div>
  );
}

