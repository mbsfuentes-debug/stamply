import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, Clock, Zap, AlertCircle, CheckCircle2, ChevronRight, Route as RouteIcon, Info, Map } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Client } from './Clients';

// --- DATA MODELS ---

interface RouteResult {
  id: string;
  cases: (any & { score: number })[];
  totalScore: number;
  comunas: string[];
}

const COMUNA_COORDS: Record<string, {lat: number, lng: number}> = {
  'Santiago': {lat: -33.4489, lng: -70.6693},
  'Providencia': {lat: -33.4328, lng: -70.6105},
  'Las Condes': {lat: -33.4132, lng: -70.5653},
  'Ñuñoa': {lat: -33.4549, lng: -70.5966},
  'Macul': {lat: -33.4843, lng: -70.5986},
  'La Florida': {lat: -33.5227, lng: -70.5983},
  'Maipú': {lat: -33.5100, lng: -70.7561},
};

// Simple Euclidean distance for mock purposes
function getDistance(comunaA: string, comunaB: string): number {
  const coordA = COMUNA_COORDS[comunaA] || {lat: 0, lng: 0};
  const coordB = COMUNA_COORDS[comunaB] || {lat: 0, lng: 0};
  return Math.sqrt(Math.pow(coordA.lat - coordB.lat, 2) + Math.pow(coordA.lng - coordB.lng, 2));
}

// --- COMPONENT ---

export default function SmartRoute({ cases = [], clients = [] }: { cases?: any[], clients?: Client[] }) {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function getClient(nombre: string): Client | undefined {
    return clients.find(c => c.name === nombre);
  }

  function calculatePriority(c: any): number {
    const client = getClient(c.cliente);
    let score = 0;

    // 1. Urgente: máxima prioridad absoluta
    if (c.urgente) {
      score = 1000;
    } else {
      // 2. Escala por plazo de pago del cliente
      const paymentTerm = c.payment_term_snapshot || client?.paymentTerm;
      if (paymentTerm === 'inmediato') score = 400;
      else if (paymentTerm === '10_dias') score = 300;
      else if (paymentTerm === '30_dias') score = 200;
      else if (paymentTerm === '45_dias') score = 100;
      else score = 100; // sin término definido = menor prioridad
    }

    // 3. Bonus VIP
    if (client?.isVip) score += 50;

    return score;
  }

  function generateRoutes(casesList: any[]): RouteResult[] {
    // Add score to cases
    const scoredCases = casesList.map(c => ({ ...c, score: calculatePriority(c) }));
    
    let unassigned = [...scoredCases];
    const newRoutes: RouteResult[] = [];
    let routeId = 1;

    while (unassigned.length > 0) {
      // Sort unassigned by priority (desc), then date (asc)
      unassigned.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
      });

      const seed = unassigned.shift()!;
      const currentRoute = [seed];
      
      while (currentRoute.length < 20 && unassigned.length > 0) {
        const lastCase = currentRoute[currentRoute.length - 1];
        
        // Sort remaining by distance to lastCase, then priority
        unassigned.sort((a, b) => {
          const distA = getDistance(lastCase.comuna, a.comuna);
          const distB = getDistance(lastCase.comuna, b.comuna);
          
          // If distance is significantly different, prefer closer
          if (Math.abs(distA - distB) > 0.01) {
            return distA - distB;
          }
          
          // If distance is similar, prefer higher priority
          return b.score - a.score;
        });

        currentRoute.push(unassigned.shift()!);
      }

      const totalScore = currentRoute.reduce((sum, c) => sum + c.score, 0);
      const comunas = Array.from(new Set(currentRoute.map(c => c.comuna)));

      newRoutes.push({
        id: `R-${routeId.toString().padStart(3, '0')}`,
        cases: currentRoute,
        totalScore,
        comunas
      });
      routeId++;
    }

    return newRoutes;
  }

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate processing time
    setTimeout(() => {
      const generated = generateRoutes(cases);
      setRoutes(generated);
      if (generated.length > 0) {
        setSelectedRouteId(generated[0].id);
      }
      setIsGenerating(false);
    }, 800);
  };

  const selectedRoute = useMemo(() => routes.find(r => r.id === selectedRouteId), [routes, selectedRouteId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Ruta Inteligente</h2>
          <p className="text-on-surface-variant mt-1 text-sm font-medium">
            Generación automática de rutas optimizadas por prioridad y geografía.
          </p>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {isGenerating ? 'Optimizando...' : 'Generar Rutas'}
        </button>
      </div>

      {routes.length === 0 && !isGenerating ? (
        <div className="flex-1 minimal-card flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
            <RouteIcon className="w-10 h-10 text-on-surface-variant" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">No hay rutas generadas</h3>
          <p className="text-on-surface-variant max-w-md mx-auto mb-8">
            Presiona "Generar Rutas" para agrupar las causas pendientes utilizando el algoritmo de optimización geográfica y de prioridad.
          </p>
          
          <div className="bg-surface-container-low p-6 rounded-2xl text-left max-w-2xl w-full border border-outline">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-secondary" />
              ¿Cómo funciona la optimización?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-bold text-on-surface mb-2">1. Prioridad (Score)</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-error font-bold"><span className="w-2 h-2 rounded-full bg-error inline-block"></span>Urgente</span>
                    <span className="font-bold text-error">1.000 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>Pago inmediato</span>
                    <span className="font-bold text-secondary">400 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-primary/50 inline-block"></span>Pago 10 días</span>
                    <span className="font-bold text-on-surface">300 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-outline inline-block"></span>Pago 30 días</span>
                    <span className="font-bold text-on-surface-variant">200 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-outline/60 inline-block"></span>Pago 45 días</span>
                    <span className="font-bold text-on-surface-variant">100 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-outline/50 mt-1">
                    <span className="text-on-surface-variant">Bonus Cliente VIP</span>
                    <span className="font-bold text-secondary">+50 pts</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-on-surface mb-2">2. Agrupación Geográfica</p>
                <ul className="list-disc list-inside text-on-surface-variant space-y-1.5 text-xs">
                  <li>Máximo 20 causas por ruta</li>
                  <li>Agrupación por cercanía de comunas</li>
                  <li>Ordenamiento interno por distancia</li>
                  <li>Plazo de pago desde ficha del cliente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Sidebar: Route List */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Rutas Sugeridas</h3>
            {routes.map(route => (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={cn(
                  "minimal-card p-5 text-left transition-all border-l-4",
                  selectedRouteId === route.id 
                    ? "border-l-secondary bg-white shadow-md" 
                    : "border-l-transparent bg-surface-container-lowest hover:bg-white"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon className={cn("w-5 h-5", selectedRouteId === route.id ? "text-secondary" : "text-on-surface-variant")} />
                    <span className="font-bold text-primary">{route.id}</span>
                  </div>
                  <span className="text-xs font-bold bg-surface-container px-2 py-1 rounded-lg text-on-surface-variant">
                    {route.cases.length} causas
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Score Total:</span>
                    <span className="font-bold text-secondary">{route.totalScore} pts</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    <span className="text-on-surface-variant line-clamp-2">
                      {route.comunas.join(', ')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content: Route Details */}
          {selectedRoute && (
            <div className="lg:col-span-8 minimal-card flex flex-col overflow-hidden bg-white">
              <div className="p-6 border-b border-outline bg-surface-container/30 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    Detalle de Ruta {selectedRoute.id}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Score Promedio: {Math.round(selectedRoute.totalScore / selectedRoute.cases.length)} pts/causa
                  </p>
                </div>
                <button className="px-4 py-2 bg-white border border-outline text-sm font-bold text-on-surface-variant rounded-xl hover:text-secondary hover:border-secondary transition-all flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Ver en Mapa
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {selectedRoute.cases.map((c, index) => (
                    <div key={c.id} className="relative flex group">
                      {index !== selectedRoute.cases.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-outline group-last:hidden" />
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-xs font-bold text-on-surface-variant z-10 shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      
                      <div className="ml-4 flex-1 bg-surface-container-lowest border border-outline rounded-2xl p-4 hover:border-secondary/50 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-primary text-sm">{c.rol}</span>
                              {c.urgente && (
                                <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Urgente
                                </span>
                              )}
                              {!c.urgente && (() => {
                                const client = getClient(c.cliente);
                                const pt = c.payment_term_snapshot || client?.paymentTerm;
                                if (pt === 'inmediato') return <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Inmediato</span>;
                                if (pt === '10_dias') return <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">10 días</span>;
                                if (pt === '30_dias') return <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">30 días</span>;
                                if (pt === '45_dias') return <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">45 días</span>;
                                return null;
                              })()}
                            </div>
                            <p className="text-xs font-bold text-on-surface">{c.demandado}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-lg inline-block">
                              Score: {c.score}
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-1">
                              Ingreso: {formatDate(c.fechaIngreso)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-on-surface-variant shrink-0" />
                            <div>
                              <p className="font-medium text-on-surface">{c.domicilio}</p>
                              <p className="text-on-surface-variant">{c.comuna}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-on-surface-variant shrink-0" />
                            <div>
                              <p className="font-medium text-on-surface">{c.cliente}</p>
                              <p className="text-on-surface-variant">
                                {getClient(c.cliente)?.paymentTerm?.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

