import React, { useState, useMemo } from 'react';
import { addOrUpdateStock, normalizeString } from '../services/stockService';
import { PlusCircle, CheckCircle, AlertCircle, Loader2, Package, Tag, Hash, ArrowLeft } from 'lucide-react';

export default function AddStockForm({ products, mode = 'local', onCancel, onSuccess }) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');

  const [productSuggestions, setProductSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const existingCategories = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        const norm = normalizeString(p.category);
        if (!map.has(norm)) {
          map.set(norm, p.category.trim());
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const handleProductNameChange = (e) => {
    const val = e.target.value;
    setProductName(val);
    setFeedback(null);

    if (val.trim().length > 0) {
      const query = normalizeString(val);
      const matched = products.filter(p => p.normalizedName?.includes(query));
      setProductSuggestions(matched);
      setShowProductDropdown(true);

      const exact = products.find(p => p.normalizedName === query);
      if (exact && exact.category) {
        setCategory(exact.category);
      }
    } else {
      setProductSuggestions([]);
      setShowProductDropdown(false);
    }
  };

  const selectProductSuggestion = (prod) => {
    setProductName(prod.name);
    setCategory(prod.category);
    setShowProductDropdown(false);
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategory(val);
    setFeedback(null);

    if (val.trim().length > 0) {
      const query = normalizeString(val);
      const matched = existingCategories.filter(cat => normalizeString(cat).includes(query));
      setCategorySuggestions(matched);
      setShowCategoryDropdown(true);
    } else {
      setCategorySuggestions(existingCategories);
      setShowCategoryDropdown(true);
    }
  };

  const selectCategorySuggestion = (cat) => {
    setCategory(cat);
    setShowCategoryDropdown(false);
  };

  const existingMatch = useMemo(() => {
    const norm = normalizeString(productName);
    if (!norm) return null;
    return products.find(p => p.normalizedName === norm);
  }, [productName, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!productName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a product name.' });
      return;
    }
    if (!category.trim()) {
      setFeedback({ type: 'error', message: 'Please enter or select a category.' });
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Stock quantity must be a positive number greater than 0.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await addOrUpdateStock({
        productName: productName.trim(),
        category: category.trim(),
        quantity: qty
      }, mode);

      if (result.isNew) {
        setFeedback({
          type: 'success',
          message: `Success! New product "${result.name}" created with ${qty} stock.`
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Success! Added +${qty} stock to existing product "${result.name}".`
        });
      }

      setProductName('');
      setCategory('');
      setQuantity('');

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Add stock error:", err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save stock. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-2xl p-5 md:p-6 shadow-xl max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-navy-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              Add New Stock
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'firebase' ? 'Adding to Live Firebase Database' : 'Adding to Local Persistent Database'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-navy-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            Product Name
          </label>
          <input
            type="text"
            placeholder="e.g. 42 Meters 55 GSM"
            value={productName}
            onChange={handleProductNameChange}
            onFocus={() => {
              if (productName.trim()) setShowProductDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
            className="w-full bg-navy-950 border border-navy-700 text-white text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />

          {existingMatch && (
            <div className="mt-1.5 text-xs text-amber-400 font-medium flex items-center gap-1">
              <span>Existing Product Found:</span>
              <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-white font-bold">
                Current Stock: {existingMatch.stock}
              </span>
            </div>
          )}

          {showProductDropdown && productSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-navy-950 border border-navy-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-navy-800">
              {productSuggestions.map((prod) => (
                <button
                  type="button"
                  key={prod.id}
                  onMouseDown={() => selectProductSuggestion(prod)}
                  className="w-full text-left px-4 py-2.5 hover:bg-navy-800 transition flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-white">{prod.name}</span>
                  <span className="text-xs text-slate-400 bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                    {prod.category} (Stock: {prod.stock})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            Category
          </label>
          <input
            type="text"
            placeholder="e.g. Roll, Paper, Board"
            value={category}
            onChange={handleCategoryChange}
            onFocus={() => setShowCategoryDropdown(true)}
            onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
            className="w-full bg-navy-950 border border-navy-700 text-white text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />

          {showCategoryDropdown && categorySuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-navy-950 border border-navy-700 rounded-xl shadow-2xl max-h-40 overflow-y-auto divide-y divide-navy-800">
              {categorySuggestions.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onMouseDown={() => selectCategorySuggestion(cat)}
                  className="w-full text-left px-4 py-2 hover:bg-navy-800 transition text-sm text-slate-200 font-medium"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-400" />
            Stock Quantity to Add
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 12"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 text-white text-lg font-mono font-bold px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Stock...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              [ SAVE STOCK ]
            </>
          )}
        </button>
      </form>
    </div>
  );
}
