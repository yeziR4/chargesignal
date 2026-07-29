# ChargeSignal

ChargeSignal is a Vana-powered commerce forecast dashboard. It privately analyzes user-approved Amazon, Shop, and Uber history to identify repeat purchases and likely future spending.

## What it does

- Connects through Vana Direct Data Access.
- Offers three independently approved commerce sources: `amazon.orders`, `shop.orders`, and `uber.trips` + `uber.receipts`.
- Normalizes order and trip records from approved Vana responses.
- Groups matching merchants and items, calculates a median repeat interval, and assigns confidence from history depth.
- Caches an approved read by request ID so repeat UI requests do not trigger another paid Personal Server read.
- Includes a demo dataset so the product can be reviewed before live credentials and the Gmail connector scope are available.
- Performs live normalization and recurrence analysis on the backend; the browser receives only aggregate forecasts and record counts.

## Railway deployment

Create a Railway service from this repository. Railway detects the root `Dockerfile`, runs the native Node standalone server, and supplies `PORT` automatically. Configure:

- `VANA_APP_PRIVATE_KEY=0x...` as a secret
- `VANA_APP_URL=https://<your-service>.up.railway.app`
- `VANA_NETWORK=mainnet`

The native Node server honors Railway's assigned `PORT`. It starts in demo mode before a Vana key is configured, allowing the public Railway URL and `/icon.png` to be used when creating the Vana app identity.

## Local development

```bash
npm install
npm run dev
```

## Live Vana configuration

Configure these server-side environment variables:

```text
VANA_APP_PRIVATE_KEY=0x...
VANA_APP_URL=https://your-deployed-url
VANA_NETWORK=mainnet
```

Use Moksha only for development. Vana Cup activity counts only on mainnet, which requires a mainnet app identity and funded USDC.e escrow.

## Verification

```bash
npm test
```
