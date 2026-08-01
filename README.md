# Threadprint

Threadprint is a Vana-powered personal context app. It transforms user-approved ChatGPT and Claude history into a private, portable collaboration manual: recurring focus areas, working-style signals, and practical instructions for helping the user well.

## Product flow

1. The user starts with ChatGPT and approves access through Vana.
2. The backend reads `chatgpt.conversations` and `chatgpt.memories`, then derives a Threadprint.
3. The user can optionally add Claude for a broader view using `claude.conversations` and `claude.projects`.
4. Only aggregate signals are returned to the browser. Raw conversations are not included in the client response.

The app has a demo Threadprint so visitors can understand the outcome before connecting data. Vana owns the authentication and data-approval flow; the app never receives ChatGPT or Claude passwords.

## Railway deployment

Create a Railway service from this repository. Railway detects the root `Dockerfile`, runs the native Node standalone server, and supplies `PORT` automatically. Configure:

- `VANA_APP_PRIVATE_KEY=0x...` as a secret
- `VANA_APP_URL=https://<your-service>.up.railway.app`
- `VANA_NETWORK=mainnet`

The native Node server honors Railway's assigned `PORT`. The public URL and `/icon.png` can be used for the Vana app listing.

## Local development

```bash
npm install
npm run dev
```

## Mainnet readiness

The Vana app identity must be registered for the exact `VANA_APP_URL`, and its protocol escrow must contain USDC.e before Personal Server reads can succeed. Use Moksha only for development; Builder League activity is measured on mainnet.

## Verification

```bash
npm run lint
npm test
```
