
import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addWatermark } from './src/watermark.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// In-memory token store (replace with DB in production)
const TOKENS = new Map(); // token -> { email, orderId, expireAt, remaining }

const TTL_HOURS = parseInt(process.env.TOKEN_TTL_HOURS || '24', 10);
const MAX_DL = parseInt(process.env.MAX_DOWNLOADS_PER_TOKEN || '1', 10);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PRICE_ID = process.env.STRIPE_PRICE_ID;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/success.html`,
      cancel_url: `${BASE_URL}/cancel.html`,
      customer_creation: 'if_required'
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Unable to create session' });
  }
});

// Stripe webhook to mint token after successful purchase
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || 'unknown@user';
    const orderId = session.id;

    const token = uuidv4().replace(/-/g, '');
    const expireAt = Date.now() + TTL_HOURS * 3600 * 1000;

    TOKENS.set(token, { email, orderId, expireAt, remaining: MAX_DL });

    // In a real app, email the user their link:
    // e.g., sendMail(email, `${BASE_URL}/download/${token}`)

    console.log('Minted token for', email, token);
  }
  res.json({ received: true });
});

// Serve watermarked PDF if token is valid
app.get('/download/:token', async (req, res) => {
  const t = req.params.token;
  const meta = TOKENS.get(t);
  if (!meta) return res.status(403).send('Invalid or expired link.');

  const now = Date.now();
  if (meta.expireAt < now || meta.remaining <= 0) {
    TOKENS.delete(t);
    return res.status(403).send('Link expired.');
  }

  // Load master PDF (never public)
  const contentPath = path.join(__dirname, 'content', 'Infinite_IQ_Master.pdf');
  if (!fs.existsSync(contentPath)) return res.status(500).send('Content missing.');
  const master = fs.readFileSync(contentPath);

  // Watermark per request
  const stamped = await addWatermark(master, { email: meta.email, orderId: meta.orderId, ts: now });

  meta.remaining -= 1;
  if (meta.remaining <= 0) TOKENS.delete(t); else TOKENS.set(t, meta);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Infinite_IQ.pdf"');
  return res.send(Buffer.from(stamped));
});

// Health
app.get('/healthz', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on', port));
