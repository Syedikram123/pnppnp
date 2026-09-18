import React from 'react';
import { Lock, LogOut, Cloud, HardDrive } from 'lucide-react';

export default function Header({ mode, user, onOpenLogin, onLogout }) {
  return (
    <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo123.png" 
            alt="Paper 'n' Print Logo" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-md bg-white/5 p-1"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
              Paper 'n' Print
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-400">
              {mode === 'firebase' ? '' : ''}
            </p>
          </div>
        </div>

        {/* Status Indicator & Login/Logout Action */}
        <div className="flex items-center gap-2 md:gap-3">
          {mode === 'firebase' ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-950 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden sm:inline">🟢 Firebase Cloud</span>
                <span className="sm:hidden">Firebase</span>
              </div>
              <button
                onClick={onLogout}
                className="bg-navy-950 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-navy-700 transition flex items-center gap-1.5"
                title="Logout to Local Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-950 border border-blue-500/30 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="hidden sm:inline">🔵 Local Database</span>
                <span className="sm:hidden">Local</span>
              </div>
              <button
                onClick={onOpenLogin}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>LOGIN</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
