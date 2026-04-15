import React from 'react';
import { User, Mail, Lock, Camera } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-bold text-primary tracking-tight">Mi Perfil</h2>
        <p className="text-on-surface-variant mt-1 text-sm font-medium">Gestione su información personal y seguridad de la cuenta.</p>
      </div>

      <div className="minimal-card p-8 bg-white">
        <h3 className="text-xl font-bold text-primary tracking-tight mb-6">Configuración de Perfil</h3>
        
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container group-hover:border-secondary transition-colors">
                <img src="https://picsum.photos/seed/legal-pro/200/200" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <button className="text-xs font-bold text-secondary hover:underline">Cambiar Foto</button>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input type="text" defaultValue="Admin Usuario" className="w-full pl-10 pr-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nombre de Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input type="text" defaultValue="admin_stamply" className="w-full pl-10 pr-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input type="email" defaultValue="admin@stamply.cl" className="w-full pl-10 pr-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-outline pt-8">
          <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Cambiar Contraseña</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-surface-container/30 border border-outline text-sm focus:border-primary outline-none transition-all rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
