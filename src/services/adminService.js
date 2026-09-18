import { 
  auth, 
  signInWithCustomToken, 
  signOut, 
  onAuthStateChanged,
  isFirebaseConfigured
} from '../firebase';
import { clearAllLocalData } from './localDb';

// Dedicated API Endpoints (deployed as Vercel Serverless Functions on Vercel and middleware in Vite)
const LOGIN_ENDPOINT = "/api/adminLogin";
const LOCAL_RESET_ENDPOINT = "/api/verifyLocalReset";
const CLOUD_RESET_ENDPOINT = "/api/resetStockDatabase";

/**
 * Helper to safely parse JSON response from server endpoints
 */
async function parseJsonResponse(response) {
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (response.status === 404) {
      throw new Error("Server API endpoint not found (404).");
    }
    throw new Error("Invalid server response format.");
  }
  return data;
}

/**
 * Real-time listener for Firebase Auth user state
 */
export const subscribeAuthState = (onUserChanged) => {
  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, (user) => {
      onUserChanged(user);
    });
  } else {
    const checkSession = () => {
      const stored = localStorage.getItem('pnp_admin_session');
      onUserChanged(stored === 'true' ? { uid: 'paper-n-print-admin', admin: true } : null);
    };
    checkSession();
    window.addEventListener('pnp_admin_session_changed', checkSession);
    return () => window.removeEventListener('pnp_admin_session_changed', checkSession);
  }
};

/**
 * Password-Only Admin Login
 * Sends password to Vercel Serverless API /api/adminLogin for server-side verification
 */
export const loginWithPassword = async (passwordInput) => {
  if (!passwordInput || !passwordInput.trim()) {
    throw new Error('Please enter the admin password.');
  }

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.trim() })
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Incorrect password.');
    }

    if (data.customToken && isFirebaseConfigured() && auth) {
      const userCredential = await signInWithCustomToken(auth, data.customToken);
      localStorage.setItem('pnp_admin_session', 'true');
      return userCredential.user;
    } else {
      localStorage.setItem('pnp_admin_session', 'true');
      window.dispatchEvent(new Event('pnp_admin_session_changed'));
      return { uid: 'paper-n-print-admin', admin: true };
    }
  } catch (err) {
    console.error("Login verification error:", err);
    if (err.message.includes('Incorrect password')) {
      throw new Error('Incorrect password.');
    }
    throw new Error(err.message || 'Unable to authenticate. Please check your connection.');
  }
};

/**
 * Logout Admin User
 */
export const logoutUser = async () => {
  localStorage.removeItem('pnp_admin_session');
  window.dispatchEvent(new Event('pnp_admin_session_changed'));

  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("SignOut error:", e);
    }
  }
};

/**
 * Local Database Hard Reset
 * Sends reset password to Vercel Serverless API /api/verifyLocalReset for server-side verification before clearing IndexedDB
 */
export const requestLocalHardReset = async (passwordInput) => {
  if (!passwordInput || !passwordInput.trim()) {
    throw new Error('Reset password is required.');
  }

  try {
    const response = await fetch(LOCAL_RESET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.trim() })
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Incorrect reset password.');
    }
  } catch (err) {
    if (err.message.includes('Incorrect reset password')) {
      throw err;
    }
    throw new Error(err.message || 'Server error verifying reset password.');
  }

  // Clear IndexedDB storage
  await clearAllLocalData();
  return { success: true, message: 'Local database has been reset successfully.' };
};

/**
 * Firebase Cloud Database Hard Reset
 * Sends reset password to Vercel Serverless API /api/resetStockDatabase for server-side verification & Firestore cleanup
 */
export const requestFirebaseHardReset = async (user, passwordInput) => {
  if (!passwordInput || !passwordInput.trim()) {
    throw new Error('Reset password is required.');
  }

  let idToken = "";
  if (user && typeof user.getIdToken === 'function') {
    idToken = await user.getIdToken(true);
  }

  try {
    const response = await fetch(CLOUD_RESET_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : ''
      },
      body: JSON.stringify({ password: passwordInput.trim() })
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Incorrect reset password.');
    }

    // Direct Firestore collection clear using client SDK
    const { db, collection, getDocs, deleteDoc, doc } = await import('../firebase');
    if (db) {
      const prodsSnap = await getDocs(collection(db, 'products'));
      for (const p of prodsSnap.docs) {
        await deleteDoc(doc(db, 'products', p.id));
      }
      const txsSnap = await getDocs(collection(db, 'transactions'));
      for (const t of txsSnap.docs) {
        await deleteDoc(doc(db, 'transactions', t.id));
      }
    }

    return { success: true, message: 'Firebase cloud database reset successfully.' };
  } catch (err) {
    console.error("Cloud reset error:", err);
    if (err.message.includes('Incorrect reset password')) {
      throw new Error('Incorrect reset password.');
    }
    throw new Error(err.message || 'Failed to reset cloud database.');
  }
};
