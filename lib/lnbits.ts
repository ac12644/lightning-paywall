const BASE = process.env.LNBITS_API_BASE!;
const KEY = process.env.LNBITS_API_KEY!;
const EXPIRY = parseInt(process.env.INVOICE_EXPIRY_SECS || "600", 10);

export type CreateInvoiceResp = {
  payment_hash: string;
  payment_request: string;
};

export async function lnbitsCreateInvoice(amountSats: number, memo: string) {
  const res = await fetch(`${BASE}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": KEY,
    },
    body: JSON.stringify({
      out: false,
      amount: amountSats,
      memo,
      expiry: EXPIRY,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`LNbits create invoice failed: ${res.status} ${msg}`);
  }

  const data = await res.json();

  return data; // expect { payment_hash, payment_request }
}

export async function lnbitsCheckPaid(paymentHash: string) {
  const res = await fetch(`${BASE}/api/v1/payments/${paymentHash}`, {
    method: "GET",
    headers: { "X-Api-Key": KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`LNbits check failed: ${res.status} ${msg}`);
  }
  const data = await res.json();
  // LNbits returns {paid: boolean, ...}
  return Boolean(data.paid);
}
