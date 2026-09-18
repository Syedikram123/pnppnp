import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ArrowLeft, PackageCheck, AlertCircle, AlertOctagon } from 'lucide-react';

export default function ProductListView({ products, initialCategoryFilter = 'all', onBack }) {
  const [stockType, setStockType] = useState(initialCategoryFilter); // 'all' | 'available' | 'low' | 'out'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('highest'); // 'highest' | 'lowest' | 'a-z' | 'z-a'

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const stock = Number(product.stock) || 0;

      // 1. Stock Status Filter
      if (stockType === 'available' && stock <= 4) return false;
      if (stockType === 'low' && (stock < 1 || stock > 4)) return false;
      if (stockType === 'out' && stock !== 0) return false;

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && product.category?.trim().toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 3. Search Filter (by Product Name or Category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = product.name?.toLowerCase().includes(query);
        const matchCat = product.category?.toLowerCase().includes(query);
        if (!matchName && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => {
      const stockA = Number(a.stock) || 0;
      const stockB = Number(b.stock) || 0;
      const nameA = a.name || '';
      const nameB = b.name || '';

      if (sortBy === 'highest') return stockB - stockA;
      if (sortBy === 'lowest') return stockA - stockB;
      if (sortBy === 'a-z') return nameA.localeCompare(nameB);
      if (sortBy === 'z-a') return nameB.localeCompare(nameA);
      return 0;
    });
  }, [products, stockType, selectedCategory, searchQuery, sortBy]);

  // Header Title & Badge Config
  const getHeaderTitle = () => {
    if (stockType === 'available') return { title: 'Available Stock', desc: 'Products with stock > 4', color: 'text-emerald-400' };
    if (stockType === 'low') return { title: 'Low Stock', desc: 'Products with stock from 1 to 4', color: 'text-amber-400' };
    if (stockType === 'out') return { title: 'Out of Stock', desc: 'Products with stock = 0', color: 'text-rose-400' };
    return { title: 'All Products Inventory', desc: 'Complete list of all registered products', color: 'text-blue-400' };
  };

  const headerInfo = getHeaderTitle();

  const getEmptyMessage = () => {
    if (searchQuery.trim() || selectedCategory !== 'ALL') return 'No products match your filters.';
    if (stockType === 'available') return 'No available stock products.';
    if (stockType === 'low') return 'No low-stock products.';
    if (stockType === 'out') return 'No out-of-stock products.';
    return 'No products found.';
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-900 p-4 rounded-xl border border-navy-800 shadow">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-navy-800 rounded-lg text-slate-300 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={`text-xl font-bold ${headerInfo.color}`}>
              {headerInfo.title}
            </h2>
            <p className="text-xs text-slate-400">{headerInfo.desc}</p>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs overflow-x-auto">
          <button
            onClick={() => setStockType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${stockType === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setStockType('available')}
            className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${stockType === 'available' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Available (&gt;4)
          </button>
          <button
            onClick={() => setStockType('low')}
            className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${stockType === 'low' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Low (1-4)
          </button>
          <button
            onClick={() => setStockType('out')}
            className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${stockType === 'out' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Out (0)
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-navy-900/80 p-3.5 rounded-xl border border-navy-800">
        {/* 1. Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 text-slate-100 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        {/* 2. Category Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 text-slate-100 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 3. Sorting Filter */}
        <div className="relative">
          <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-navy-950 border border-navy-700 text-slate-100 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="highest">Highest Stock → Lowest</option>
            <option value="lowest">Lowest Stock → Highest</option>
            <option value="a-z">Name: A → Z</option>
            <option value="z-a">Name: Z → A</option>
          </select>
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="text-xs font-semibold text-slate-400 px-1">
        Showing <span className="text-white font-bold">{filteredProducts.length}</span> product records
      </div>

      {/* Product List Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-500" />
          <p className="text-base font-semibold">{getEmptyMessage()}</p>
          <p className="text-xs text-slate-500">Try clearing filters or adding products from the Stock tab.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 text-slate-400 uppercase text-xs border-b border-navy-800 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Stock Quantity</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock) || 0;
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Available
                    </span>
                  );
                  if (stock >= 1 && stock <= 4) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                        Low Stock
                      </span>
                    );
                  } else if (stock === 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                        Out of Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={product.id} className="hover:bg-navy-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {product.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="bg-navy-950 px-2.5 py-1 rounded-md text-xs font-medium border border-navy-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-lg text-white">
                        {stock}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-2.5">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock) || 0;
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              let badgeText = 'Available';

              if (stock >= 1 && stock <= 4) {
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                badgeText = 'Low Stock';
              } else if (stock === 0) {
                badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                badgeText = 'Out of Stock';
              }

              return (
                <div 
                  key={product.id}
                  className="bg-navy-900 border border-navy-800 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-navy-950 text-slate-300 border border-navy-700 font-medium">
                        {product.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-white">
                      {stock}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Units
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
