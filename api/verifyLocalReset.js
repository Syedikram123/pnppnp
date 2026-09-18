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

    return res.status(200).json({
      success: true,
      message: 'Local database reset authorized.'
    });

  } catch (error) {
    console.error("Error in /api/verifyLocalReset:", error);
    return res.status(500).json({ success: false, error: 'Server error verifying reset password.' });
  }
}
