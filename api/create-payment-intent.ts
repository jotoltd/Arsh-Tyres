import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeTestKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
const stripeLiveKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
const stripeTest = stripeTestKey ? new Stripe(stripeTestKey) : null;
const stripeLive = stripeLiveKey ? new Stripe(stripeLiveKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, mode } = req.body;
    const stripe = mode === 'live' ? stripeLive : stripeTest;

    if (!stripe) {
      res.status(500).json({ error: 'Stripe secret key not configured' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create payment intent' });
  }
}
