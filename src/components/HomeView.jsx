import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Trash2, CheckCircle, X } from 'lucide-react';
import LocalHardResetModal from './LocalHardResetModal';
import FirebaseHardResetModal from './FirebaseHardResetModal';

export default function HomeView({ products, mode, user, onSelectStockCategory, onRefresh }) {
  const [showLocalResetModal, setShowLocalResetModal] = useState(false);
  const [showFirebaseResetModal, setShowFirebaseResetModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Available Stock: stock > 4
  const availableCount = products.filter(p => (Number(p.stock) || 0) > 4).length;
  // Low Stock: stock >= 1 && stock <= 4
  const lowStockCount = products.filter(p => {
    const s = Number(p.stock) || 0;
    return s >= 1 && s <= 4;
  }).length;
  // Out of Stock: stock === 0
  const outOfStockCount = products.filter(p => (Number(p.stock) || 0) === 0).length;

  return (
    <div className="space-y-6 pb-6">
      {/* Branding Header Banner */}
      

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Available Stock */}
        <button
          onClick={() => onSelectStockCategory('available')}
          className="group relative bg-navy-900 hover:bg-navy-800 border-2 border-emerald-500/30 hover:border-emerald-500/70 rounded-2xl p-6 text-left transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              Available Stock
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-white tracking-tight mb-1">
              {availableCount}
            </div>
            <p className="text-xs font-medium text-slate-400">
              Products with stock &gt; 4
            </p>
          </div>
        </button>

        {/* 2. Low Stock */}
        <button
          onClick={() => onSelectStockCategory('low')}
          className="group relative bg-navy-900 hover:bg-navy-800 border-2 border-amber-500/30 hover:border-amber-500/70 rounded-2xl p-6 text-left transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5" />
              Low Stock
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-white tracking-tight mb-1">
              {lowStockCount}
            </div>
            <p className="text-xs font-medium text-slate-400">
              Products with stock 1 to 4
            </p>
          </div>
        </button>

        {/* 3. Out of Stock */}
        <button
          onClick={() => onSelectStockCategory('out')}
          className="group relative bg-navy-900 hover:bg-navy-800 border-2 border-rose-500/30 hover:border-rose-500/70 rounded-2xl p-6 text-left transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-5 h-5" />
              Out of Stock
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-white tracking-tight mb-1">
              {outOfStockCount}
            </div>
            <p className="text-xs font-medium text-slate-400">
              Products with stock = 0
            </p>
          </div>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RESET SECTION AT THE BOTTOM OF HOME PAGE            */}
      {/* ---------------------------------------------------- */}

      {/* 1. LOGGED-OUT MODE: Local Database Hard Reset */}
      {mode === 'local' && (
        <div className="pt-4 border-t border-navy-800/80 flex flex-col items-center">
          <button
            onClick={() => setShowLocalResetModal(true)}
            className="bg-navy-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-500/30 transition flex items-center gap-2 shadow"
          >
            <Trash2 className="w-4 h-4" />
            [ ⚠ HARD RESET ]
          </button>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Reset local database to clear all local stock records.
          </p>
        </div>
      )}

      {/* 2. LOGGED-IN FIREBASE MODE: Firebase Cloud Hard Reset */}
      {mode === 'firebase' && (
        <div className="bg-rose-950/30 border-2 border-rose-500/40 rounded-2xl p-6 text-slate-200 space-y-3 shadow-xl mt-6">
         

         

          <button
            onClick={() => setShowFirebaseResetModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg transition flex items-center gap-2 mt-2"
          >
            <Trash2 className="w-4 h-4" />
            [ HARD RESET ALL DATA ]
          </button>
        </div>
      )}

      {/* Local Hard Reset Modal */}
      {showLocalResetModal && (
        <LocalHardResetModal
          onClose={() => setShowLocalResetModal(false)}
          onSuccess={(msg) => {
            setNotice(msg || "Local database has been reset successfully.");
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Firebase Hard Reset Modal */}
      {showFirebaseResetModal && (
        <FirebaseHardResetModal
          user={user}
          onClose={() => setShowFirebaseResetModal(false)}
          onSuccess={(msg) => {
            setNotice(msg || "Firebase cloud database reset successfully.");
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
