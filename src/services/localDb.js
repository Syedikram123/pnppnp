/**
 * Native IndexedDB Service for Local Database Mode
 * Provides fast, offline-first persistent storage for products and transactions.
 */

const DB_NAME = 'pnp_local_stock_db';
const DB_VERSION = 1;

let dbInstance = null;

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });
};

export const getLocalProducts = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const saveLocalProducts = async (products) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    store.clear();
    products.forEach(p => store.put(p));

    tx.oncomplete = () => {
      window.dispatchEvent(new Event('pnp_local_data_updated'));
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const getLocalTransactions = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const req = store.getAll();

    req.onsuccess = () => {
      const txs = req.result || [];
      txs.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      resolve(txs);
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveLocalTransactions = async (transactions) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.clear();
    transactions.forEach(t => store.put(t));

    tx.oncomplete = () => {
      window.dispatchEvent(new Event('pnp_local_data_updated'));
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const clearAllLocalData = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['products', 'transactions'], 'readwrite');
    tx.objectStore('products').clear();
    tx.objectStore('transactions').clear();

    tx.oncomplete = () => {
      window.dispatchEvent(new Event('pnp_local_data_updated'));
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
};
