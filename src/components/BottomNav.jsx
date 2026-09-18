import React from 'react';
import { Home, Package, BarChart3 } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'report', label: 'Report', icon: BarChart3 }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-900 border-t border-navy-800 shadow-lg">
      <div className="max-w-md mx-auto md:max-w-xl flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2.5 px-6 flex-1 transition-all duration-150 ${
                isActive
                  ? 'text-blue-400 font-bold border-t-2 border-blue-500 bg-navy-800/50'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110 text-blue-400' : ''}`} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
