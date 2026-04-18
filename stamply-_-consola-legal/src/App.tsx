import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SmartIntake from './components/SmartIntake';
import SmartRoute from './components/SmartRoute';
import CasesList from './components/CasesList';
import Documents from './components/Documents';
import SignatureCenter from './components/SignatureCenter';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Clients, { Client } from './components/Clients';
import SmartEstampe from './components/SmartEstampe';
import Tramites from './components/Tramites';
import TemplateLibrary, { Template } from './components/TemplateLibrary';
import Collections from './components/Collections';
import { Tramite } from './types';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State — loaded from SQLite via API
  const [documents, setDocuments] = useState<any[]>([]);
  const [estampes, setEstampes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/cases').then(r => r.json()),
      fetch('/api/tramites').then(r => r.json()),
      fetch('/api/documents').then(r => r.json()),
      fetch('/api/estampes').then(r => r.json()),
      fetch('/api/templates').then(r => r.json()),
    ]).then(([cls, cs, trs, docs, ests, tpls]) => {
      setClients(cls);
      setCases(cs);
      setTramites(trs);
      setDocuments(docs);
      setEstampes(ests);
      setTemplates(tpls);
    }).catch(err => {
      console.error('[App] Error cargando datos:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-xs uppercase tracking-widest">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} documents={documents} />;
      case 'new-case':
        return <SmartIntake
          clients={clients}
          setClients={setClients}
          cases={cases}
          onGoToCase={(caseId) => setActiveTab('cases')}
          onSuccess={async (newCase) => {
            if (newCase) {
              try {
                const saved = await fetch('/api/cases', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCase),
                }).then(r => r.json());
                setCases([saved, ...cases]);
              } catch {
                setCases([newCase, ...cases]);
              }
            }
            setActiveTab('cases');
          }}
        />;
      case 'tramites':
        return <Tramites tramites={tramites} setTramites={setTramites} cases={cases} />;
      case 'cases':
        return <CasesList cases={cases} setCases={setCases} setActiveTab={setActiveTab} clients={clients} setClients={setClients} tramites={tramites} setTramites={setTramites} />;
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
          cases={cases}
          onSendToAuthorize={async (newEstampe) => {
            try {
              const saved = await fetch('/api/estampes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEstampe),
              }).then(r => r.json());
              setEstampes([saved, ...estampes]);
            } catch {
              setEstampes([newEstampe, ...estampes]);
            }
            setActiveTab('signatures');
          }}
        />;
      case 'template-library':
        return <TemplateLibrary templates={templates} setTemplates={setTemplates} />;
      case 'clients':
        return <Clients templates={templates} clients={clients} setClients={setClients} />;
      case 'collections':
        return <Collections clients={clients} tramites={tramites} setTramites={setTramites} />;
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

