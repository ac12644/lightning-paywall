// Simple in-memory stores. Replace with DB in production.
export type InvoiceState = {
  amountSats: number;
  memo: string;
  createdAt: number;
  paid: boolean;
  token?: string;
};

export const invoices = new Map<string, InvoiceState>(); // key: payment_hash

// On-chain address tracking
export type AddressState = {
  address: string;
  index: number;
  amountSats: number;
  createdAt: number;
  confirmed: boolean;
  token?: string;
};
export const addresses = new Map<string, AddressState>(); // key: paymentId

// Derivation index (replace with DB counter in prod)
export let nextDerivationIndex = 0;
export function bumpIndex() {
  nextDerivationIndex += 1;
  return nextDerivationIndex - 1;
}
