import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Server-side Secrets (stored strictly on Node server process, never sent to browser bundle)
const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "P@ssw0rd";
const SERVER_RESET_PASSWORD = process.env.RESET_PASSWORD || "Reset@1";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-mock-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              let parsed = {};
              try { parsed = JSON.parse(body || '{}'); } catch (e) {}

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                return res.end();
              }

              // 1. Password-Only Login Endpoint
              if (req.url.includes('/adminLogin')) {
                const { password } = parsed;
                if (password && password.trim() === SERVER_ADMIN_PASSWORD) {
                  res.statusCode = 200;
                  return res.end(JSON.stringify({
                    success: true,
                    // Note: In local dev mock, returns dev authorization state
                    devAuth: true
                  }));
                } else {
                  res.statusCode = 401;
                  return res.end(JSON.stringify({ error: 'Incorrect password.' }));
                }
              }

              // 2. Local Hard Reset Verification Endpoint
              if (req.url.includes('/verifyLocalReset')) {
                const { password } = parsed;
                if (password && password.trim() === SERVER_RESET_PASSWORD) {
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ success: true, message: 'Local reset authorized.' }));
                } else {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Incorrect reset password.' }));
                }
              }

              // 3. Firebase Database Reset Endpoint
              if (req.url.includes('/resetStockDatabase')) {
                const { password } = parsed;
                if (password && password.trim() === SERVER_RESET_PASSWORD) {
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ success: true, message: 'Firebase database reset authorized.' }));
                } else {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Incorrect reset password.' }));
                }
              }

              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Endpoint not found' }));
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
})
