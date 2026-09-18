import React, { useState } from 'react';
import { PlusCircle, Edit3, ArrowRight, Cloud } from 'lucide-react';
import AddStockForm from './AddStockForm';
import EditRemoveStock from './EditRemoveStock';
import FirebaseDashboard from './FirebaseDashboard';

export default function StockView({ products, transactions, mode, user, onRefresh }) {
  const [activeSubView, setActiveSubView] = useState(null); // null | 'add' | 'edit' | 'dashboard'

  if (activeSubView === 'add') {
    return (
      <AddStockForm
        products={products}
        mode={mode}
        onCancel={() => setActiveSubView(null)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    );
  }

  if (activeSubView === 'edit') {
    return (
      <EditRemoveStock
        products={products}
        mode={mode}
        onBack={() => setActiveSubView(null)}
        onRefresh={onRefresh}
      />
    );
  }

  if (activeSubView === 'dashboard' && mode === 'firebase') {
    return (
      <FirebaseDashboard
        user={user}
        products={products}
        transactions={transactions}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto">
      {/* Firebase Cloud Dashboard Button (When Logged In) */}
      {mode === 'firebase' && (
        <div className="flex justify-end">
          <button
            onClick={() => setActiveSubView('dashboard')}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-500/40 transition flex items-center gap-2 shadow"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            [ FIREBASE CLOUD DASHBOARD ]
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 text-center">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Stock Management
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {mode === 'firebase' ? 'Updating live Firebase Cloud stock' : 'Updating local persistent stock'}
        </p>
      </div>

      {/* Two Main Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Card 1: ADD NEW STOCK */}
        <button
          onClick={() => setActiveSubView('add')}
          className="group relative bg-navy-900 hover:bg-navy-800 border-2 border-blue-500/40 hover:border-blue-500 rounded-2xl p-6 text-left transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                + ADD NEW STOCK
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register new products or add stock to existing items
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* Card 2: EDIT / REMOVE STOCK */}
        <button
          onClick={() => setActiveSubView('edit')}
          className="group relative bg-navy-900 hover:bg-navy-800 border-2 border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-left transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-110 transition-transform">
              <Edit3 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                EDIT / REMOVE STOCK
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit product names, categories, or record stock sold/removed
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      </div>
    </div>
  );
}
