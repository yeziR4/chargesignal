# ChargeSignal

ChargeSignal is a Vana-powered subscription forecast dashboard. It reads the user-approved `gmail.receipts` scope, recognizes recurring charges, and predicts the likely next date and amount.

## What it does

- Connects through Vana Direct Data Access.
- Requests only `gmail.receipts` from the `gmail` source.
- Normalizes Gmail receipt records from approved Vana responses.
- Groups matching merchants and amounts, calculates a median billing interval, and assigns confidence from timing consistency.
- Caches an approved read by request ID so repeat UI requests do not trigger another paid Personal Server read.
- Includes a demo dataset so the product can be reviewed before live credentials and the Gmail connector scope are available.

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

