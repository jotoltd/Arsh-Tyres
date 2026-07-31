import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import Stripe from 'stripe';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stripeSecretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  const stripeTestKey = env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY_TEST;
  const stripeLiveKey = env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY_LIVE;
  const stripeFallback = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
  const stripeTest = stripeTestKey ? new Stripe(stripeTestKey) : stripeFallback;
  const stripeLive = stripeLiveKey ? new Stripe(stripeLiveKey) : stripeFallback;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'stripe-api',
        configureServer(server) {
          server.middlewares.use('/api/create-payment-intent', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                const { amount, mode: paymentMode } = JSON.parse(body);
                const stripe = paymentMode === 'live' ? stripeLive : stripeTest;
                if (!stripe) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Stripe secret key not configured' }));
                  return;
                }
                const paymentIntent = await stripe.paymentIntents.create({
                  amount: Math.round(amount * 100),
                  currency: 'gbp',
                  automatic_payment_methods: { enabled: true },
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ clientSecret: paymentIntent.client_secret }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
