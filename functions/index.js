const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Server-side Secrets (NEVER exposed to browser client)
const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "P@ssw0rd";
const SERVER_RESET_PASSWORD = process.env.RESET_PASSWORD || "Reset@1";

/**
 * 1. Password-Only Admin Login Endpoint
 * Verifies password server-side and mints a Firebase Custom Token with admin claim.
 */
exports.adminLogin = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please enter the admin password.' });
    }

    // Verify password against server-side secret
    if (password.trim() !== SERVER_ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Mint Firebase Custom Token with admin claim
    const adminUid = "paper-n-print-admin";
    const customToken = await admin.auth().createCustomToken(adminUid, { admin: true });

    console.log(`[ADMIN LOGIN SUCCESS] Custom token created for ${adminUid}`);

    return res.status(200).json({
      success: true,
      customToken: customToken
    });

  } catch (error) {
    console.error("Error in adminLogin Cloud Function:", error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

/**
 * 2. Local Hard Reset Server Verification Endpoint
 * Verifies reset password server-side before allowing IndexedDB clearance.
 */
exports.verifyLocalReset = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { password } = req.body || {};

    if (!password || password.trim() !== SERVER_RESET_PASSWORD) {
      return res.status(400).json({ error: 'Incorrect reset password.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Local reset authorized.'
    });

  } catch (error) {
    console.error("Error in verifyLocalReset:", error);
    return res.status(500).json({ error: 'Server error verifying reset password.' });
  }
});

/**
 * 3. Firebase Cloud Database Hard Reset Endpoint
 * Verifies ID Token (must be Admin) + Server Reset Password, then batch deletes Firestore collections.
 */
exports.resetStockDatabase = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'You are not authorized to access the cloud dashboard.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken || decodedToken.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin authorization required.' });
    }

    // 2. Verify Reset Password on Server Side
    const { password } = req.body || {};
    if (!password || password.trim() !== SERVER_RESET_PASSWORD) {
      return res.status(400).json({ error: 'Incorrect reset password.' });
    }

    // 3. Perform Batch Deletion of products & transactions
    const db = admin.firestore();

    const deleteCollection = async (collName) => {
      const snap = await db.collection(collName).get();
      if (snap.empty) return 0;
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return snap.size;
    };

    const deletedProds = await deleteCollection('products');
    const deletedTxs = await deleteCollection('transactions');

    console.log(`[FIREBASE HARD RESET SUCCESS] Admin ${decodedToken.uid} deleted ${deletedProds} products and ${deletedTxs} transactions.`);

    return res.status(200).json({
      success: true,
      message: 'Firebase database has been reset successfully.',
      deletedProducts: deletedProds,
      deletedTransactions: deletedTxs
    });

  } catch (error) {
    console.error("Error in resetStockDatabase:", error);
    return res.status(500).json({ error: error.message || 'Server error resetting cloud database.' });
  }
});
