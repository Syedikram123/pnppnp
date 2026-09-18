import admin from 'firebase-admin';

function getAdminInstance() {
  if (admin.apps.length) return admin;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
      return admin;
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT init error:", e.message);
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "pnp-pnp-17815",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      return admin;
    } catch (e) {
      console.error("FIREBASE_PRIVATE_KEY init error:", e.message);
    }
  }

  try {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "pnp-pnp-17815"
    });
  } catch (e) {}

  return admin;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { password } = body || {};

    const SERVER_RESET_PASSWORD = process.env.RESET_PASSWORD || "Reset@1";

    if (!password || password.trim() !== SERVER_RESET_PASSWORD) {
      return res.status(400).json({ success: false, error: 'Incorrect reset password.' });
    }

    let deletedProds = 0;
    let deletedTxs = 0;
    try {
      const firebaseAdmin = getAdminInstance();
      const db = firebaseAdmin.firestore();
      const deleteColl = async (collName) => {
        const snap = await db.collection(collName).get();
        if (snap.empty) return 0;
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return snap.size;
      };
      deletedProds = await deleteColl('products');
      deletedTxs = await deleteColl('transactions');
    } catch (dbErr) {
      console.warn("Firestore admin deletion notice:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Firebase cloud database reset authorized.',
      deletedProducts: deletedProds,
      deletedTransactions: deletedTxs
    });

  } catch (error) {
    console.error("Error in /api/resetStockDatabase:", error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
