import admin from 'firebase-admin';

// Helper to initialize Firebase Admin SDK with server-side credentials
function getAdminInstance() {
  if (admin.apps.length) return admin;

  // Method 1: FIREBASE_SERVICE_ACCOUNT JSON string
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

  // Method 2: Individual FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY
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

  // Fallback: Default app init
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

    const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "P@ssw0rd";

    if (!password || password.trim() !== SERVER_ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }

    // Initialize admin SDK securely
    const firebaseAdmin = getAdminInstance();
    const adminUid = "paper-n-print-admin";
    let customToken = null;

    try {
      customToken = await firebaseAdmin.auth().createCustomToken(adminUid, { admin: true });
    } catch (tokenErr) {
      console.warn("Custom token generation warning:", tokenErr.message);
    }

    return res.status(200).json({
      success: true,
      customToken: customToken,
      devAuth: !customToken
    });

  } catch (error) {
    console.error("Error in /api/adminLogin serverless function:", error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
