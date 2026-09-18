import React, { useState, useMemo } from 'react';
import { Search, Edit3, ArrowLeft, AlertCircle } from 'lucide-react';
import EditProductModal from './EditProductModal';

export default function EditRemoveStock({ products, mode = 'local', onBack, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-4 pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-navy-900 p-4 rounded-xl border border-navy-800 shadow">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-navy-800 rounded-lg text-slate-300 transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">
              Edit / Remove Stock
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'firebase' ? 'Modifying Firebase Cloud Stock' : 'Modifying Local Database Stock'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-navy-900/80 p-3 rounded-xl border border-navy-800">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search product by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-navy-950 border border-navy-700 text-slate-100 text-sm pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Products Inventory List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-500" />
          <p className="text-base font-semibold">No products found.</p>
          <p className="text-xs text-slate-500">Try changing your search term or add stock first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const stock = Number(product.stock) || 0;
            let stockBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            if (stock >= 1 && stock <= 4) stockBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            if (stock === 0) stockBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

            return (
              <div
                key={product.id}
                className="bg-navy-900 border border-navy-800 hover:border-navy-700 rounded-xl p-4 flex items-center justify-between shadow-sm transition"
              >
                <div className="space-y-1 max-w-[65%]">
                  <h3 className="font-bold text-white text-base truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-navy-950 text-slate-300 border border-navy-700 font-medium">
                      {product.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${stockBadgeColor}`}>
                      Stock: {stock}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  [ EDIT ]
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Product Modal */}
      {selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          mode={mode}
          onClose={() => setSelectedProduct(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
