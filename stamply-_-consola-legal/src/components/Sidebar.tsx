import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

// Using Lucide icons instead of Material Symbols as per instructions
import { 
  LayoutDashboard as DashboardIcon, 
  Folder as FolderIcon, 
  FileText as FileIcon, 
  Gavel as GavelIcon, 
  BarChart3 as ChartIcon,
  DollarSign,
  Plus as PlusIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  PenTool as PenIcon,
  Sparkles,
  BookOpen,
  Bell,
  Settings,
  User,
  Users,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: 'cases', label: 'Causas', icon: FolderIcon },
    { id: 'smart-estampe', label: 'Estampe Inteligente', icon: Sparkles },
    { id: 'template-library', label: 'Biblioteca de Modelos', icon: BookOpen },
    { id: 'documents', label: 'Documentos', icon: FileIcon },
    { id: 'signatures', label: 'Firmas', icon: PenIcon },
    { id: 'clients', label: 'Clientes', icon: GavelIcon },
    { id: 'collections', label: 'Cobranza', icon: DollarSign },
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-primary py-8 z-40 transition-all duration-300 shadow-2xl",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("mb-6 relative flex items-center", isCollapsed ? "px-0 justify-center" : "px-8 justify-between")}>
        {!isCollapsed ? (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="text-left focus:outline-none group"
          >
            <h1 className="text-2xl font-extrabold text-white font-headline tracking-tighter group-hover:text-secondary transition-colors">STAMPLY</h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mt-0.5">Consola Legal</p>
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="text-2xl font-black text-secondary font-headline tracking-tight focus:outline-none hover:scale-110 transition-transform"
          >
            S
          </button>
        )}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1 bg-secondary text-white rounded-full p-1 hover:scale-110 transition-all z-50 shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className={cn("mb-4 transition-all duration-300", isCollapsed ? "px-2" : "px-4")}>
        {isCollapsed ? (
          <button 
            onClick={() => {
              setIsCollapsed(false);
              setTimeout(() => document.getElementById('global-search')?.focus(), 100);
            }}
            className="flex flex-col items-center justify-center py-3 px-1 w-full text-center text-white/50 hover:text-white hover:bg-white/5 transition-all rounded-xl relative group"
          >
            <SearchIcon className="w-5 h-5 mb-1" />
            
            {/* Custom Tooltip for Collapsed State */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-primary border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
              Buscar
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary border-l border-b border-white/10 rotate-45"></div>
            </div>
          </button>
        ) : (
          <div className="relative flex items-center w-full group">
            <SearchIcon className="absolute left-3 w-4 h-4 text-white/30 group-focus-within:text-secondary transition-colors" />
            <input 
              id="global-search"
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:border-secondary/50 focus:bg-white/10 outline-none transition-all rounded-xl"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-visible">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex transition-all duration-200 rounded-xl group relative",
              isCollapsed ? "justify-center py-3 px-0 w-full" : "flex-row items-center w-full px-4 py-2.5 text-left",
              activeTab === item.id 
                ? "text-white font-semibold bg-secondary shadow-lg shadow-secondary/20" 
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(isCollapsed ? "w-6 h-6" : "mr-3 w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-secondary transition-colors")} />
            {!isCollapsed && <span className="text-sm tracking-wide">{item.label}</span>}
            
            {/* Custom Tooltip for Collapsed State */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-primary border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                {item.label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary border-l border-b border-white/10 rotate-45"></div>
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className={cn("mb-2 mt-2", isCollapsed ? "px-2" : "px-4")}>
        <button 
          onClick={() => setActiveTab('new-case')}
          className={cn(
            "w-full bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center border border-white/5 relative group",
            isCollapsed ? "py-3" : "py-3 text-sm"
          )}
        >
          <PlusIcon className={cn(isCollapsed ? "w-6 h-6" : "mr-2 w-5 h-5 text-secondary")} />
          {!isCollapsed && "Nueva Causa"}
          
          {/* Custom Tooltip for Collapsed State */}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-primary border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
              Nueva Causa
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary border-l border-b border-white/10 rotate-45"></div>
            </div>
          )}
        </button>
      </div>

      {/* Profile & Settings Module */}
      <div className={cn("mt-auto border-t border-white/10 pt-3 pb-2", isCollapsed ? "px-2" : "px-4")} ref={menuRef}>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "w-full flex items-center transition-all hover:bg-white/5 p-2 rounded-xl group",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-secondary/50 transition-colors">
                  <img
                    alt="Perfil"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    src="https://picsum.photos/seed/legal-pro/100/100"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-primary"></span>
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">Admin</p>
                  <p className="text-[10px] text-white/40 truncate max-w-[120px]">admin@stamply.cl</p>
                </div>
              )}
            </div>
            
            {/* Custom Tooltip for Collapsed State */}
            {isCollapsed && !isMenuOpen && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-primary border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none">
                Perfil y Configuración
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary border-l border-b border-white/10 rotate-45"></div>
              </div>
            )}
          </button>

          {isMenuOpen && (
            <div className={cn(
              "absolute bottom-full mb-4 bg-primary border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-2xl overflow-hidden",
              isCollapsed ? "left-full ml-4 w-64" : "left-0 w-full min-w-[240px]"
            )}>
              <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white">Receptor Admin</p>
                  <p className="text-[11px] text-white/40 mt-0.5">admin@stamply.cl</p>
                </div>
                <button className="p-2 text-white/40 hover:text-secondary hover:bg-white/5 transition-all rounded-lg relative" title="Notificaciones">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-primary"></span>
                </button>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => handleMenuClick('profile')}
                  className="w-full text-left px-4 py-3 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all rounded-xl flex items-center"
                >
                  <User className="w-4 h-4 mr-3 text-secondary" />
                  Mi Perfil
                </button>
                <button 
                  onClick={() => handleMenuClick('settings')}
                  className="w-full text-left px-4 py-3 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all rounded-xl flex items-center"
                >
                  <Settings className="w-4 h-4 mr-3 text-secondary" />
                  Configuración
                </button>
                <button 
                  onClick={() => handleMenuClick('help')}
                  className="w-full text-left px-4 py-3 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all rounded-xl flex items-center"
                >
                  <HelpCircle className="w-4 h-4 mr-3 text-secondary" />
                  Ayuda
                </button>
              </div>
              <div className="p-2 border-t border-white/10 bg-black/20">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    alert('Cerrando sesión...');
                  }}
                  className="w-full text-left px-4 py-3 text-xs text-error hover:bg-error/10 transition-all rounded-xl flex items-center font-bold"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
