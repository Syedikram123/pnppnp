import React, { useState } from 'react';
import FirebaseHardResetModal from './FirebaseHardResetModal';
import { 
  Cloud, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  History, 
  Trash2, 
  CheckCircle,
  X
} from 'lucide-react';

export default function FirebaseDashboard({ user, products, transactions, onRefresh }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  const availableCount = products.filter(p => (Number(p.stock) || 0) > 4).length;
  const lowCount = products.filter(p => {
    const s = Number(p.stock) || 0;
    return s >= 1 && s <= 4;
  }).length;
  const outCount = products.filter(p => (Number(p.stock) || 0) === 0).length;

  const formatDate = (ms) => {
    if (!ms) return 'N/A';
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 pb-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-navy-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cloud className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                FIREBASE CLOUD DASHBOARD
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Live Cloud Analytics
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Account: {user?.email || user?.uid || 'Authenticated Administrator'}
            </p>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-4 text-center">
          <span className="text-xs uppercase text-slate-400 font-bold block mb-1">Total Products</span>
          <span className="text-3xl font-black text-white font-mono">{products.length}</span>
        </div>
        <div className="bg-navy-900 border border-emerald-500/30 rounded-xl p-4 text-center">
          <span className="text-xs uppercase text-emerald-400 font-bold block mb-1">Available Stock</span>
          <span className="text-3xl font-black text-emerald-400 font-mono">{availableCount}</span>
        </div>
        <div className="bg-navy-900 border border-amber-500/30 rounded-xl p-4 text-center">
          <span className="text-xs uppercase text-amber-400 font-bold block mb-1">Low Stock</span>
          <span className="text-3xl font-black text-amber-400 font-mono">{lowCount}</span>
        </div>
        <div className="bg-navy-900 border border-rose-500/30 rounded-xl p-4 text-center">
          <span className="text-xs uppercase text-rose-400 font-bold block mb-1">Out of Stock</span>
          <span className="text-3xl font-black text-rose-400 font-mono">{outCount}</span>
        </div>
      </div>

      {/* Recent Cloud Transactions */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 shadow space-y-3">
        <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
          <History className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-base">Recent Cloud Transactions</h3>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded in Firebase database.</p>
        ) : (
          <div className="divide-y divide-navy-800">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{tx.productName}</span>
                  <span className="text-slate-400 text-[11px]">{tx.category} • {formatDate(tx.createdAtMs)}</span>
                </div>
                <div className={`font-mono font-bold text-sm ${tx.type === 'ADDED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'ADDED' ? `+${tx.quantity}` : `-${tx.quantity}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Hard Reset Firebase Data */}
      <div className="bg-rose-950/30 border-2 border-rose-500/40 rounded-2xl p-6 text-slate-200 space-y-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-300 tracking-tight">
              DANGER ZONE
            </h3>
            <p className="text-xs text-rose-200/70">
              Reset live Firebase Cloud database
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300">
          This operation will permanently delete all product items and stock transactions stored in your live Firebase Firestore database.
        </p>

        <button
          onClick={() => setShowResetModal(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg transition flex items-center gap-2 mt-2"
        >
          <Trash2 className="w-4 h-4" />
          [ ⚠ HARD RESET FIREBASE DATA ]
        </button>
      </div>

      {/* Hard Reset Firebase Modal */}
      {showResetModal && (
        <FirebaseHardResetModal
          user={user}
          onClose={() => setShowResetModal(false)}
          onSuccess={(msg) => {
            setSuccessNotice(msg || "Firebase database has been reset successfully.");
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
