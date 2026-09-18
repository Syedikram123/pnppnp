import { 
  db, 
  collection, 
  doc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  deleteDoc
} from '../firebase';

import {
  getLocalProducts,
  saveLocalProducts,
  getLocalTransactions,
  saveLocalTransactions
} from './localDb';

export const normalizeString = (str) => {
  if (!str) return '';
  return str.trim().toLowerCase();
};

/**
 * Real-time or IndexedDB subscription for Products
 */
export const subscribeProducts = (mode, onUpdate, onError) => {
  if (mode === 'firebase' && db) {
    const productsRef = collection(db, 'products');
    const q = query(productsRef);
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      onUpdate(products);
    }, (error) => {
      console.error("Firestore Products snapshot error:", error);
      if (onError) onError(error);
    });
  } else {
    // Local Mode (IndexedDB)
    const loadLocal = async () => {
      try {
        const prods = await getLocalProducts();
        onUpdate(prods);
      } catch (err) {
        console.error("IndexedDB read error:", err);
        onUpdate([]);
      }
    };

    loadLocal();
    window.addEventListener('pnp_local_data_updated', loadLocal);
    return () => window.removeEventListener('pnp_local_data_updated', loadLocal);
  }
};

/**
 * Real-time or IndexedDB subscription for Transactions
 */
export const subscribeTransactions = (mode, onUpdate, onError) => {
  if (mode === 'firebase' && db) {
    const txRef = collection(db, 'transactions');
    const q = query(txRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(d => {
        const data = d.data();
        let createdMs = Date.now();
        if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
          createdMs = data.createdAt.toMillis();
        } else if (typeof data.createdAt === 'number') {
          createdMs = data.createdAt;
        }
        return {
          id: d.id,
          ...data,
          createdAtMs: createdMs
        };
      });
      onUpdate(transactions);
    }, (error) => {
      console.error("Firestore Transactions snapshot error:", error);
      if (onError) onError(error);
    });
  } else {
    // Local Mode (IndexedDB)
    const loadLocal = async () => {
      try {
        const txs = await getLocalTransactions();
        onUpdate(txs);
      } catch (err) {
        console.error("IndexedDB transactions read error:", err);
        onUpdate([]);
      }
    };

    loadLocal();
    window.addEventListener('pnp_local_data_updated', loadLocal);
    return () => window.removeEventListener('pnp_local_data_updated', loadLocal);
  }
};

/**
 * Add New Stock (Creates product or adds stock to existing product)
 */
export const addOrUpdateStock = async ({ productName, category, quantity }, mode = 'local') => {
  const normName = normalizeString(productName);
  const normCategory = normalizeString(category);
  const qtyNum = parseInt(quantity, 10);

  if (!productName || !productName.trim()) throw new Error('Product name is required.');
  if (!category || !category.trim()) throw new Error('Category is required.');
  if (isNaN(qtyNum) || qtyNum <= 0) throw new Error('Please enter a valid quantity greater than 0.');

  const cleanName = productName.trim();
  const cleanCategory = category.trim();

  if (mode === 'firebase' && db) {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('normalizedName', '==', normName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const productRef = doc(db, 'products', existingDoc.id);

      await runTransaction(db, async (transaction) => {
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) throw new Error("Product no longer exists.");
        const data = prodDoc.data();
        const prevStock = Number(data.stock) || 0;
        const newStock = prevStock + qtyNum;

        transaction.update(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });

        const newTxRef = doc(collection(db, 'transactions'));
        transaction.set(newTxRef, {
          productId: existingDoc.id,
          productName: data.name || cleanName,
          category: data.category || cleanCategory,
          type: 'ADDED',
          quantity: qtyNum,
          previousStock: prevStock,
          newStock: newStock,
          createdAt: serverTimestamp()
        });
      });
      return { isNew: false, name: existingDoc.data().name };
    } else {
      const newProductRef = doc(collection(db, 'products'));
      const newTxRef = doc(collection(db, 'transactions'));

      await runTransaction(db, async (transaction) => {
        transaction.set(newProductRef, {
          name: cleanName,
          normalizedName: normName,
          category: cleanCategory,
          normalizedCategory: normCategory,
          stock: qtyNum,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        transaction.set(newTxRef, {
          productId: newProductRef.id,
          productName: cleanName,
          category: cleanCategory,
          type: 'ADDED',
          quantity: qtyNum,
          previousStock: 0,
          newStock: qtyNum,
          createdAt: serverTimestamp()
        });
      });
      return { isNew: true, name: cleanName };
    }
  } else {
    // Local IndexedDB Mode
    const products = await getLocalProducts();
    const existingIndex = products.findIndex(p => p.normalizedName === normName);

    if (existingIndex >= 0) {
      const existing = products[existingIndex];
      const prevStock = existing.stock || 0;
      const newStock = prevStock + qtyNum;
      products[existingIndex] = {
        ...existing,
        stock: newStock,
        updatedAt: Date.now()
      };
      await saveLocalProducts(products);

      const txs = await getLocalTransactions();
      txs.push({
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        productId: existing.id,
        productName: existing.name,
        category: existing.category,
        type: 'ADDED',
        quantity: qtyNum,
        previousStock: prevStock,
        newStock: newStock,
        createdAt: Date.now(),
        createdAtMs: Date.now()
      });
      await saveLocalTransactions(txs);
      return { isNew: false, name: existing.name };
    } else {
      const newId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const newProd = {
        id: newId,
        name: cleanName,
        normalizedName: normName,
        category: cleanCategory,
        normalizedCategory: normCategory,
        stock: qtyNum,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      products.push(newProd);
      await saveLocalProducts(products);

      const txs = await getLocalTransactions();
      txs.push({
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        productId: newId,
        productName: cleanName,
        category: cleanCategory,
        type: 'ADDED',
        quantity: qtyNum,
        previousStock: 0,
        newStock: qtyNum,
        createdAt: Date.now(),
        createdAtMs: Date.now()
      });
      await saveLocalTransactions(txs);
      return { isNew: true, name: cleanName };
    }
  }
};

/**
 * Add stock to product
 */
export const addStockToProduct = async (productId, quantity, mode = 'local') => {
  const qtyNum = parseInt(quantity, 10);
  if (isNaN(qtyNum) || qtyNum <= 0) throw new Error('Please enter a valid quantity.');

  if (mode === 'firebase' && db) {
    const productRef = doc(db, 'products', productId);
    const newTxRef = doc(collection(db, 'transactions'));

    await runTransaction(db, async (transaction) => {
      const prodDoc = await transaction.get(productRef);
      if (!prodDoc.exists()) throw new Error("Product not found.");
      const data = prodDoc.data();
      const prevStock = Number(data.stock) || 0;
      const newStock = prevStock + qtyNum;

      transaction.update(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      transaction.set(newTxRef, {
        productId: productId,
        productName: data.name,
        category: data.category,
        type: 'ADDED',
        quantity: qtyNum,
        previousStock: prevStock,
        newStock: newStock,
        createdAt: serverTimestamp()
      });
    });
  } else {
    const products = await getLocalProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error("Product not found.");

    const prod = products[idx];
    const prevStock = prod.stock || 0;
    const newStock = prevStock + qtyNum;

    products[idx].stock = newStock;
    products[idx].updatedAt = Date.now();
    await saveLocalProducts(products);

    const txs = await getLocalTransactions();
    txs.push({
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      type: 'ADDED',
      quantity: qtyNum,
      previousStock: prevStock,
      newStock: newStock,
      createdAt: Date.now(),
      createdAtMs: Date.now()
    });
    await saveLocalTransactions(txs);
  }
};

/**
 * Remove stock from product
 */
export const removeStockFromProduct = async (productId, quantity, mode = 'local') => {
  const qtyNum = parseInt(quantity, 10);
  if (isNaN(qtyNum) || qtyNum <= 0) throw new Error('Please enter a valid quantity.');

  if (mode === 'firebase' && db) {
    const productRef = doc(db, 'products', productId);
    const newTxRef = doc(collection(db, 'transactions'));

    await runTransaction(db, async (transaction) => {
      const prodDoc = await transaction.get(productRef);
      if (!prodDoc.exists()) throw new Error("Product not found.");
      const data = prodDoc.data();
      const prevStock = Number(data.stock) || 0;

      if (prevStock < qtyNum) {
        throw new Error("Not enough stock available.");
      }

      const newStock = prevStock - qtyNum;

      transaction.update(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      transaction.set(newTxRef, {
        productId: productId,
        productName: data.name,
        category: data.category,
        type: 'SOLD',
        quantity: qtyNum,
        previousStock: prevStock,
        newStock: newStock,
        createdAt: serverTimestamp()
      });
    });
  } else {
    const products = await getLocalProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error("Product not found.");

    const prod = products[idx];
    const prevStock = prod.stock || 0;

    if (prevStock < qtyNum) {
      throw new Error("Not enough stock available.");
    }

    const newStock = prevStock - qtyNum;
    products[idx].stock = newStock;
    products[idx].updatedAt = Date.now();
    await saveLocalProducts(products);

    const txs = await getLocalTransactions();
    txs.push({
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      type: 'SOLD',
      quantity: qtyNum,
      previousStock: prevStock,
      newStock: newStock,
      createdAt: Date.now(),
      createdAtMs: Date.now()
    });
    await saveLocalTransactions(txs);
  }
};

/**
 * Edit product details
 */
export const editProductDetails = async (productId, { name, category }, mode = 'local') => {
  if (!name || !name.trim()) throw new Error("Product name is required.");
  if (!category || !category.trim()) throw new Error("Category is required.");

  const cleanName = name.trim();
  const cleanCategory = category.trim();
  const normName = normalizeString(cleanName);
  const normCategory = normalizeString(cleanCategory);

  if (mode === 'firebase' && db) {
    const productRef = doc(db, 'products', productId);
    await runTransaction(db, async (transaction) => {
      const prodDoc = await transaction.get(productRef);
      if (!prodDoc.exists()) throw new Error("Product not found.");

      transaction.update(productRef, {
        name: cleanName,
        normalizedName: normName,
        category: cleanCategory,
        normalizedCategory: normCategory,
        updatedAt: serverTimestamp()
      });
    });
  } else {
    const products = await getLocalProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error("Product not found.");

    products[idx] = {
      ...products[idx],
      name: cleanName,
      normalizedName: normName,
      category: cleanCategory,
      normalizedCategory: normCategory,
      updatedAt: Date.now()
    };
    await saveLocalProducts(products);
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId, mode = 'local') => {
  if (mode === 'firebase' && db) {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } else {
    const products = await getLocalProducts();
    const filtered = products.filter(p => p.id !== productId);
    await saveLocalProducts(filtered);
  }
};
