
# Infinite IQ — Paywall Starter (Stripe + Expiring Links + Watermark)

This starter makes your course **paywalled** and **hard to re‑share**:
- Stripe Checkout (one‑time purchase)
- Webhook marks payment and creates a **single‑use expiring token**
- Download is served through the backend; the PDF is **watermarked** with the buyer's email and order id
- Token expires (default 24h) and can be limited to 1–3 downloads
- Static site (landing + checkout button) lives in `/public`, backend in `server.js`

> ⚠️ Nothing put on the internet is literally "impossible to download". This setup makes unauthorized sharing much harder and traceable.

## Quick start

1. **Create Stripe product & price** for your course.
2. Copy `.env.example` to `.env` and fill values.
3. `npm install`
4. `npm run dev`
5. `ngrok http 3000` (or use your hosting preview URL) and set Stripe webhook to `<your-url>/webhook` for events: `checkout.session.completed`.
6. Put your original PDF in `/content/Infinite_IQ_Master.pdf`.

## Deploy options
- Vercel, Render, Railway, Fly.io or a small VPS. Do **not** use GitHub Pages for the backend (it's static only).

## Folder structure
```
/public
  index.html
  success.html
  cancel.html
/content
  Infinite_IQ_Master.pdf              # your master (not served directly)
/src
  watermark.js                         # adds buyer watermark using pdf-lib
server.js                               # Express app
package.json
```

## Security hardening (recommended)
- Store tokens in a DB (Redis/Postgres). This demo uses an in-memory store for simplicity.
- Short token TTL (e.g. 24h), and max downloads = 1 or 2.
- Tie tokens to buyer email + user-agent + IP range (optional).
- Watermark each page with buyer email + order id + timestamp.
- For video, serve HLS with DRM (Widevine/FairPlay) via a specialist service.
- Add reCAPTCHA to free previews.
- Monitor for leaked links; revoke tokens instantly.

## Legal & UX
- Clear Terms: personal, non-transferable license; resale prohibited.
- Refund policy page (already included).
- Friendly "lost your link?" flow to reissue a fresh token after reauth (email check).
