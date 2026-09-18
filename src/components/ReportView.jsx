import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Search, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function ReportView({ transactions }) {
  const [reportType, setReportType] = useState('ADDED'); // 'ADDED' | 'SOLD'
  const [dateRange, setDateRange] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | '7DAYS' | '30DAYS' | '90DAYS' | 'CUSTOM'
  
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Date Calculation Helpers
  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (dateRange === 'TODAY') {
      return { start: todayStart, end: todayEnd };
    }

    if (dateRange === 'YESTERDAY') {
      const yestStart = todayStart - 86400000;
      const yestEnd = todayStart - 1;
      return { start: yestStart, end: yestEnd };
    }

    if (dateRange === '7DAYS') {
      const start = todayStart - (6 * 86400000);
      return { start, end: todayEnd };
    }

    if (dateRange === '30DAYS') {
      const start = todayStart - (29 * 86400000);
      return { start, end: todayEnd };
    }

    if (dateRange === '90DAYS') {
      const start = todayStart - (89 * 86400000);
      return { start, end: todayEnd };
    }

    if (dateRange === 'CUSTOM') {
      let start = 0;
      let end = Infinity;
      if (customStart) {
        start = new Date(customStart + 'T00:00:00').getTime();
      }
      if (customEnd) {
        end = new Date(customEnd + 'T23:59:59').getTime();
      }
      return { start, end };
    }

    return { start: 0, end: Infinity };
  }, [dateRange, customStart, customEnd]);

  // Filter Transactions by Type, Date Range & Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Type filter
      if (tx.type !== reportType) return false;

      // 2. Date bounds filter
      const txMs = tx.createdAtMs || Date.now();
      if (txMs < dateBounds.start || txMs > dateBounds.end) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchProd = tx.productName?.toLowerCase().includes(q);
        const matchCat = tx.category?.toLowerCase().includes(q);
        if (!matchProd && !matchCat) return false;
      }

      return true;
    });
  }, [transactions, reportType, dateBounds, searchQuery]);

  // Total Quantity Added or Sold
  const totalQuantity = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (Number(tx.quantity) || 0), 0);
  }, [filteredTransactions]);

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
    <div className="space-y-5 pb-6">
      {/* Top Main Report Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setReportType('ADDED')}
          className={`p-4 rounded-2xl border-2 transition font-bold text-center flex flex-col items-center justify-center gap-1.5 shadow ${
            reportType === 'ADDED'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
              : 'bg-navy-900 border-navy-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-sm md:text-base">[ STOCK ADDED ]</span>
        </button>

        <button
          onClick={() => setReportType('SOLD')}
          className={`p-4 rounded-2xl border-2 transition font-bold text-center flex flex-col items-center justify-center gap-1.5 shadow ${
            reportType === 'SOLD'
              ? 'bg-rose-500/15 border-rose-500 text-rose-400'
              : 'bg-navy-900 border-navy-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-6 h-6" />
          <span className="text-sm md:text-base">[ STOCK SOLD ]</span>
        </button>
      </div>

      {/* Date Filter Buttons */}
      <div className="bg-navy-900 border border-navy-800 p-3 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Select Period:</span>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
          {[
            { id: 'TODAY', label: 'TODAY' },
            { id: 'YESTERDAY', label: 'YESTERDAY' },
            { id: '7DAYS', label: 'LAST 7 DAYS' },
            { id: '30DAYS', label: 'LAST 30 DAYS' },
            { id: '90DAYS', label: 'LAST 90 DAYS' },
            { id: 'CUSTOM', label: 'CUSTOM' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDateRange(p.id)}
              className={`py-2 px-2 rounded-lg font-bold transition text-center ${
                dateRange === p.id 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-navy-950 text-slate-400 hover:bg-navy-800 hover:text-white border border-navy-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        {dateRange === 'CUSTOM' && (
          <div className="pt-2 border-t border-navy-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric Summary Card */}
      <div className={`p-6 rounded-2xl border-2 flex items-center justify-between shadow-lg ${
        reportType === 'ADDED' 
          ? 'bg-navy-900 border-emerald-500/40 text-emerald-400' 
          : 'bg-navy-900 border-rose-500/40 text-rose-400'
      }`}>
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
            Total {reportType === 'ADDED' ? 'Stock Added' : 'Stock Sold'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Period: {dateRange}
          </span>
        </div>
        <div className="text-right">
          <span className="text-4xl md:text-5xl font-black font-mono text-white">
            {reportType === 'ADDED' ? `+${totalQuantity}` : `-${totalQuantity}`}
          </span>
          <span className="text-xs text-slate-400 block">Units</span>
        </div>
      </div>

      {/* Search Transactions Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter report by product or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-navy-900 border border-navy-800 text-slate-100 text-sm pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Transaction Details Table / Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-navy-900/50 border border-navy-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-500" />
          <p className="text-base font-semibold">No transactions found.</p>
          <p className="text-xs text-slate-500">No {reportType.toLowerCase()} stock transactions recorded for this period.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 text-slate-400 uppercase text-xs border-b border-navy-800 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4 text-right">Stock Movement</th>
                  <th className="py-3.5 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-navy-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {tx.productName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="bg-navy-950 px-2 py-0.5 rounded text-xs border border-navy-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base">
                      <span className={tx.type === 'ADDED' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'ADDED' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">
                      {tx.previousStock} → {tx.newStock}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                      {formatDate(tx.createdAtMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Rows */}
          <div className="md:hidden space-y-2.5">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-navy-900 border border-navy-800 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1 max-w-[65%]">
                  <h4 className="font-bold text-white text-sm truncate">
                    {tx.productName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-navy-950 text-slate-300 border border-navy-700 font-medium">
                      {tx.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(tx.createdAtMs)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-black font-mono ${
                    tx.type === 'ADDED' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.type === 'ADDED' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ({tx.previousStock} → {tx.newStock})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
