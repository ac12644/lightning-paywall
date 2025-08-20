"use client";

import React from "react";
import QRCode from "qrcode";
import { Loader2, Copy, Zap, Wallet } from "lucide-react";

type UnlockProps = {
  priceSats: number;
};

export default function Paywall({ priceSats }: UnlockProps) {
  const [phase, setPhase] = React.useState<
    "idle" | "ln" | "ln-wait" | "ln-paid" | "chain" | "chain-wait" | "unlocked"
  >("idle");

  const [bolt11, setBolt11] = React.useState("");
  const [paymentHash, setPaymentHash] = React.useState("");
  const [paymentId, setPaymentId] = React.useState("");
  const [chainAddr, setChainAddr] = React.useState("");

  const [lnQrDataUrl, setLnQrDataUrl] = React.useState("");
  const [chainQrDataUrl, setChainQrDataUrl] = React.useState("");

  // Generate QR for Lightning
  React.useEffect(() => {
    if (!bolt11) return;
    QRCode.toDataURL(bolt11, { width: 220 }).then(setLnQrDataUrl);
  }, [bolt11]);

  // Generate QR for on-chain
  React.useEffect(() => {
    if (!chainAddr) return;
    QRCode.toDataURL(`bitcoin:${chainAddr}`, { width: 220 }).then(
      setChainQrDataUrl
    );
  }, [chainAddr]);

  async function beginLightning() {
    setPhase("ln");
    const res = await fetch("/api/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSats: priceSats, memo: "Paywall access" }),
    });
    const data = await res.json();

    if (!data.paymentRequest || !data.paymentHash) {
      alert("Invoice creation failed. Check logs.");
      setPhase("idle");
      return;
    }

    setBolt11(data.paymentRequest);
    setPaymentHash(data.paymentHash);
    setPhase("ln-wait");

    const interval = setInterval(async () => {
      const check = await fetch(`/api/check-invoice?hash=${data.payment_hash}`);
      const status = await check.json();
      if (status.paid) {
        clearInterval(interval);
        setPhase("unlocked");
      }
    }, 3000);
  }

  async function beginOnchain() {
    setPhase("chain");
    const res = await fetch("/api/address/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSats: priceSats }),
    });
    const data = await res.json();
    setPaymentId(data.paymentId);
    setChainAddr(data.address);
    setPhase("chain-wait");
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  if (phase === "unlocked") {
    return (
      <div className="rounded-xl border p-6 bg-green-50">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700">
          ✅ Payment successful
        </h3>
        <p className="text-sm text-green-600">
          Content unlocked for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6 space-y-4">
      <h3 className="text-xl font-semibold">Unlock this content</h3>
      <p className="text-gray-600">
        Price: <b>{priceSats}</b> sats
      </p>

      {phase === "idle" && (
        <div className="flex gap-3">
          <button
            onClick={beginLightning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
          >
            <Zap className="h-4 w-4" /> Lightning
          </button>
          <button
            onClick={beginOnchain}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            <Wallet className="h-4 w-4" /> On-chain
          </button>
        </div>
      )}

      {phase === "ln-wait" && (
        <div className="space-y-3">
          <p className="text-sm">⚡ Scan & pay this Lightning invoice:</p>
          <div className="flex gap-4">
            {lnQrDataUrl ? (
              <img
                src={lnQrDataUrl}
                alt="LN invoice"
                className="w-[220px] h-[220px] rounded border bg-white"
              />
            ) : null}
            <div className="flex flex-col w-full">
              <textarea
                className="w-full p-2 border rounded text-xs"
                readOnly
                value={bolt11}
              />
              <button
                onClick={() => copy(bolt11)}
                className="flex items-center gap-2 mt-2 text-xs px-3 py-1 border rounded hover:bg-gray-100"
              >
                <Copy className="h-3 w-3" /> Copy Invoice
              </button>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Waiting for payment…
          </p>
        </div>
      )}

      {phase === "chain-wait" && (
        <div className="space-y-3">
          <p className="text-sm">
            ⛓ Send exactly <b>{priceSats}</b> sats to this address:
          </p>
          <div className="flex gap-4">
            {chainQrDataUrl ? (
              <img
                src={chainQrDataUrl}
                alt="BTC address"
                className="w-[220px] h-[220px] rounded border bg-white"
              />
            ) : null}

            <div className="flex flex-col w-full">
              <input
                className="w-full p-2 border rounded text-xs"
                readOnly
                value={chainAddr}
              />
              <button
                onClick={() => copy(chainAddr)}
                className="flex items-center gap-2 mt-2 text-xs px-3 py-1 border rounded hover:bg-gray-100"
              >
                <Copy className="h-3 w-3" /> Copy Address
              </button>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Waiting for
            confirmations…
          </p>
        </div>
      )}
    </div>
  );
}
