import React, { useState } from 'react';
import { editProductDetails, addStockToProduct, removeStockFromProduct, deleteProduct } from '../services/stockService';
import { X, Save, Plus, Minus, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function EditProductModal({ product, mode = 'local', onClose, onRefresh }) {
  const [name, setName] = useState(product.name || '');
  const [category, setCategory] = useState(product.category || '');

  const [addQty, setAddQty] = useState('');
  const [removeQty, setRemoveQty] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSaveDetails = async () => {
    setFeedback(null);
    if (!name.trim() || !category.trim()) {
      setFeedback({ type: 'error', message: 'Name and category are required.' });
      return;
    }

    setLoading(true);
    try {
      await editProductDetails(product.id, { name: name.trim(), category: category.trim() }, mode);
      setFeedback({ type: 'success', message: 'Product details updated successfully!' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    setFeedback(null);
    const qty = parseInt(addQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid addition quantity.' });
      return;
    }

    setLoading(true);
    try {
      await addStockToProduct(product.id, qty, mode);
      setFeedback({ type: 'success', message: `Added +${qty} units of stock!` });
      setAddQty('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add stock.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStock = async () => {
    setFeedback(null);
    const qty = parseInt(removeQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid quantity to remove.' });
      return;
    }

    setLoading(true);
    try {
      await removeStockFromProduct(product.id, qty, mode);
      setFeedback({ type: 'success', message: `Recorded sale/removal of -${qty} units!` });
      setRemoveQty('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Not enough stock available.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProduct(product.id, mode);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete product.' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-navy-950 px-5 py-4 border-b border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Edit / Manage Stock</h3>
            <p className="text-xs text-slate-400">
              {mode === 'firebase' ? 'Firebase Cloud Database' : 'Local Persistent Database'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-navy-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current Stock Banner */}
          <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Current Stock Level
              </span>
              <span className="text-xs text-slate-500">Real-time status</span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-white">
                {product.stock}
              </span>
              <span className="text-xs text-slate-400 block font-medium">Units</span>
            </div>
          </div>

          {/* 1. Edit Name & Category */}
          <div className="space-y-3 bg-navy-950/60 p-4 rounded-xl border border-navy-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Edit Details
            </h4>
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Product Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Category</label>
              <input 
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSaveDetails}
              disabled={loading}
              className="w-full bg-navy-800 hover:bg-navy-700 text-xs text-slate-200 font-bold py-2 px-3 rounded-lg border border-navy-700 transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Name &amp; Category
            </button>
          </div>

          {/* 2. Stock Movements (+ ADD STOCK & - REMOVE SOLD STOCK) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Stock
              </span>
              <input
                type="number"
                min="1"
                placeholder="Qty to add"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="w-full bg-navy-950 border border-emerald-500/30 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddStock}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow flex items-center justify-center gap-1"
              >
                + ADD STOCK
              </button>
            </div>

            <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Minus className="w-4 h-4" />
                Remove / Sold
              </span>
              <input
                type="number"
                min="1"
                placeholder="Qty sold"
                value={removeQty}
                onChange={(e) => setRemoveQty(e.target.value)}
                className="w-full bg-navy-950 border border-rose-500/30 text-white font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleRemoveStock}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow flex items-center justify-center gap-1"
              >
                - REMOVE STOCK
              </button>
            </div>
          </div>

          {/* 3. Delete Product Section */}
          <div className="pt-2 border-t border-navy-800">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full bg-navy-950 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-medium text-xs py-2.5 px-3 rounded-xl border border-rose-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                DELETE PRODUCT
              </button>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-center space-y-3">
                <p className="text-xs font-bold text-rose-300">
                  Delete this product?
                </p>
                <p className="text-[11px] text-slate-400">
                  Product will be removed from inventory. Historical report transactions will remain preserved.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold text-xs py-2 rounded-lg transition"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-lg transition"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
