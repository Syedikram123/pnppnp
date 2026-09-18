import React, { useState } from 'react';
import { requestFirebaseHardReset } from '../services/adminService';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function FirebaseHardResetModal({ user, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Confirmation, 2: Password
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter the reset password.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestFirebaseHardReset(user, password);
      if (onSuccess) onSuccess(result.message);
      onClose();
    } catch (err) {
      console.error("Firebase reset error:", err);
      setError(err.message || 'Incorrect reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-navy-900 border border-rose-500/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
        
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Hard Reset Firebase Data</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/30 text-rose-200 text-xs leading-relaxed space-y-2">
              <p className="font-bold uppercase tracking-wider text-rose-300">
                WARNING
              </p>
              <p>
                This will permanently delete all Firebase products and transactions.
              </p>
              <p className="font-semibold text-rose-400">
                This action cannot be undone. Are you sure?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition"
              >
                CANCEL
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                CONTINUE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter reset password:
              </label>
              <input
                type="password"
                placeholder="Enter reset password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-950 border border-rose-500/50 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting Firebase Data...
                  </>
                ) : (
                  'AUTHORIZE & RESET FIREBASE DB'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
