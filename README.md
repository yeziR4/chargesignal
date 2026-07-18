# ChargeSignal

ChargeSignal is a Vana-powered subscription forecast dashboard. It reads the user-approved `gmail.receipts` scope, recognizes recurring charges, and predicts the likely next date and amount.

## What it does

- Connects through Vana Direct Data Access.
- Requests only `gmail.receipts` from the `gmail` source.
- Normalizes Gmail receipt records from approved Vana responses.
- Groups matching merchants and amounts, calculates a median billing interval, and assigns confidence from timing consistency.
- Caches an approved read by request ID so repeat UI requests do not trigger another paid Personal Server read.
- Includes a demo dataset so the product can be reviewed before live credentials and the Gmail connector scope are available.
- Performs live Gmail normalization and recurrence analysis on the backend; the browser receives only forecast results and a receipt count.

## Railway deployment

Create a Railway service from this repository. Railway detects the root `Dockerfile` and supplies `PORT` automatically. Configure:

- `VANA_APP_PRIVATE_KEY=0x...` as a secret
- `VANA_APP_URL=https://<your-service>.up.railway.app`
- `VANA_NETWORK=moksha`

The container honors Railway's assigned `PORT`. It starts in demo mode before a Vana key is configured, allowing the public Railway URL and `/icon.png` to be used when creating the Vana app identity.

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
VANA_NETWORK=moksha
```

Use Moksha while testing. Switch `VANA_NETWORK` to `mainnet` only after the app identity and escrow are ready for production.

## Verification

```bash
npm test
```
