# ⚡ Lightning Micro Paywall

A **Next.js** app implementing a **Bitcoin Lightning paywall** with optional on-chain fallback.
Uses **LNbits** for invoice creation/checking, **BIP32 (XPUB)** for address derivation, and **JWT** for access tokens.

---

## ✨ Features

- ⚡ Lightning invoice creation via LNbits
- 🔄 Polling to check payment status
- 🪙 Optional on-chain BTC fallback (XPUB-based address derivation)
- 🔑 JWT tokens issued after successful payment
- 🛡️ In-memory stores (replaceable with DB/Redis in production)
- 🖥️ Next.js frontend with QR code display

---

## Demo

<p align="center">
  <video src="content/video.mp4" width="600" controls></video>
</p>

---

## 🗂️ Project Structure

```bash
lightning-paywall/
├─ .env.example           # env vars template
├─ app/
│  ├─ page.tsx            # main Paywall page
│  └─ api/
│     ├─ create-invoice/route.ts
│     ├─ check-invoice/route.ts
│     ├─ address/new/route.ts
│     ├─ address/check/route.ts
│     └─ verify/route.ts
├─ components/
│  └─ Paywall.tsx         # frontend paywall UI
├─ lib/
│  ├─ lnbits.ts           # LNbits helpers
│  ├─ jwt.ts              # JWT mint/verify
│  ├─ derive.ts           # BTC XPUB derivation
│  └─ state.ts            # in-memory invoice/address
```

---

## ⚙️ Setup

### 1. Clone & install

```bash
git clone https://github.com/ac12644/lightning-paywall.git
cd lightning-paywall
npm install
```

### 2. Configure environment

Copy `.env.example` → `.env.local` and fill in:

```bash
# LNbits invoice API
LNBITS_API_BASE=https://demo.lnbits.com
LNBITS_API_KEY=your_invoice_key_here

# JWT signing
JWT_SECRET=your-long-random-secret

# On-chain fallback (optional)
BTC_NETWORK=mainnet
BTC_XPUB_TESTNET=your_testnet_xpub_here
ONCHAIN_MIN_CONF=1

# Price & invoice expiry
PRICE_SATS=50
INVOICE_EXPIRY_SECS=600
```

> ⚠️ Use **invoice/read keys** from LNbits (not admin).

### 3. Run dev server

```bash
npm run dev
```

Open: http://localhost:3000

---

## 🔌 API Endpoints

### `POST /api/create-invoice`

Create a Lightning invoice.

```json
{
  "amountSats": 50,
  "memo": "Paywall access"
}
```

Response:

```json
{
  "paymentHash": "62e9…7075",
  "paymentRequest": "lnbc50n1p…"
}
```

---

### `GET /api/check-invoice?hash=...`

Check if invoice is paid.

```json
{ "paid": true }
```

---

### `POST /api/address/new`

Derive new on-chain BTC address from XPUB.

```json
{ "amountSats": 1000 }
```

Response:

```json
{
  "paymentId": "addr_123",
  "address": "tb1qxyz...",
  "amountSats": 1000
}
```

---

### `GET /api/address/check?id=...`

Check if address has received required funds.

```json
{ "confirmed": true }
```

---

### `POST /api/verify`

Verify JWT token.

```
{ "token": "..." }
```

Response:

```json
{ "ok": true, "payload": { … } }
```

---

## 🔄 Payment Flow

1. **Frontend** calls `/api/create-invoice` with amount.
2. User scans QR (BOLT11 invoice).
3. Frontend polls `/api/check-invoice?hash=...`.
4. When paid:
   - Invoice is marked `paid` in `state.ts`
   - A **JWT access token** is minted and returned.
5. Client can now call protected APIs with the token.
6. (Optional) If LN fails, user requests `/api/address/new` and pays on-chain.

---

## 📦 Deployment

```
npm run build
npm start
```

For production:

- Use **Redis/Postgres** instead of in-memory `Map`
- Use **secure JWT secret**
- Use a dedicated LNbits instance (self-hosted or trusted provider)

---

## 🧪 Testing

- Get **test sats** from a faucet (e.g. mutinynet)
- Pay Lightning invoice with **Zeus Wallet** or **Alby** (testnet mode)
- For on-chain fallback, request tBTC from Bitcoin Testnet Faucet

---

## 🚧 TODO

- [ ] Webhook push from LNbits (instead of polling)
- [ ] Replace memory store with Redis/DB
- [ ] Multi-currency pricing
- [ ] UI polish & content unlock demo
