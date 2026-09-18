import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ProductListView from './components/ProductListView';
import StockView from './components/StockView';
import ReportView from './components/ReportView';
import LoginModal from './components/LoginModal';
import { subscribeProducts, subscribeTransactions } from './services/stockService';
import { subscribeAuthState, logoutUser } from './services/adminService';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [mode, setMode] = useState('local'); // 'local' | 'firebase'

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'stock' | 'report'
  const [productFilter, setProductFilter] = useState(null); // null | 'available' | 'low' | 'out' | 'all'
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Subscribe to Auth State
  useEffect(() => {
    setAuthChecking(true);
    const unsubAuth = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setMode('firebase');
      } else {
        setMode('local');
      }
      setAuthChecking(false);
    });

    return () => {
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  // 2. Subscribe to Data (Products & Transactions) based on active mode
  useEffect(() => {
    if (authChecking) return;

    setDataLoading(true);
    setError(null);

    const unsubProducts = subscribeProducts(
      mode,
      (prods) => {
        setProducts(prods);
        setDataLoading(false);
      },
      (err) => {
        console.error("Products subscription error:", err);
        setError("Unable to load stock data. Please check your connection and try again.");
        setDataLoading(false);
      }
    );

    const unsubTxs = subscribeTransactions(
      mode,
      (txs) => {
        setTransactions(txs);
      },
      (err) => {
        console.error("Transactions subscription error:", err);
      }
    );

    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubTxs === 'function') unsubTxs();
    };
  }, [mode, authChecking]);

  const handleSelectHomeStockCard = (filterType) => {
    setProductFilter(filterType);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setProductFilter(null);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setMode('local');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Checking authentication state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans pb-24 md:pb-28">
      {/* Top Header */}
      <Header
        mode={mode}
        user={user}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Desktop Top Tab Bar Navigation */}
      <div className="hidden md:block bg-navy-900 border-b border-navy-800 py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4">
          <button
            onClick={() => handleTabChange('home')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'home' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            🏠 HOME
          </button>
          <button
            onClick={() => handleTabChange('stock')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'stock' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            📦 STOCK
          </button>
          <button
            onClick={() => handleTabChange('report')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'report' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            📊 REPORT
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-4 md:pt-6">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">
              Loading {mode === 'firebase' ? 'Firebase Cloud' : 'Local Database'} stock data...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-3 max-w-md mx-auto my-10">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs px-4 py-2 rounded-xl border border-navy-700 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <>
                {productFilter ? (
                  <ProductListView
                    products={products}
                    initialCategoryFilter={productFilter}
                    onBack={() => setProductFilter(null)}
                  />
                ) : (
                  <HomeView
                    products={products}
                    mode={mode}
                    user={user}
                    onSelectStockCategory={handleSelectHomeStockCard}
                    onRefresh={() => window.dispatchEvent(new Event('pnp_local_data_updated'))}
                  />
                )}
              </>
            )}

            {/* 2. STOCK TAB */}
            {activeTab === 'stock' && (
              <StockView
                products={products}
                transactions={transactions}
                mode={mode}
                user={user}
                onRefresh={() => window.dispatchEvent(new Event('pnp_local_data_updated'))}
              />
            )}

            {/* 3. REPORT TAB */}
            {activeTab === 'report' && (
              <ReportView
                transactions={transactions}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setMode('firebase');
          }}
        />
      )}
    </div>
  );
}
