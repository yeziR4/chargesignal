---
title: ChargeSignal
emoji: 🧾
colorFrom: orange
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

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

## Hugging Face Space

Create a Docker Space and configure:

- Secret: `VANA_APP_PRIVATE_KEY`
- Variable: `VANA_APP_URL=https://<owner>-chargesignal.hf.space`
- Variable: `VANA_NETWORK=moksha`

The container exposes port `7860`. Users see one **Connect Gmail** action; Vana remains the approval and Personal Server access layer behind that flow.
The Space starts in demo mode before a Vana key is configured, so its public URL and icon can be used to create the app identity first.

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
