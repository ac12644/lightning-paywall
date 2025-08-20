"use client";

import React from "react";
import Paywall from "@/components/Paywall";

export default async function Page() {
  // Server-side: try to read token from cookie (or client can unlock and re-render)
  // For simplicity, we render paywall first; client moves to "unlocked" when paid.

  const price = parseInt(process.env.PRICE_SATS || "50", 10);

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Lightning Micro-Paywall Demo</h1>

      <section className="rounded-xl border p-6">
        <h2 className="text-xl font-semibold mb-2">Premium Article</h2>
        <p className="text-gray-600 mb-4">
          This is a teaser. The full content is behind a Lightning/on-chain
          paywall.
        </p>

        <Paywall priceSats={price} />

        <LockedContent />
      </section>
    </main>
  );
}

function UnlockedContent() {
  return (
    <div className="mt-6 rounded-md border p-4 bg-white">
      <h3 className="font-semibold mb-2">Full Content</h3>
      <p>
        🎉 Congrats! You paid successfully. Here’s the premium content (PDF
        links, video, etc.).
      </p>
    </div>
  );
}

function LockedContent() {
  // Client-only check for token stored in localStorage
  return (
    <div className="mt-6">
      {/* This small client gate swaps to full content when token exists & is valid */}
      <ClientGate />
    </div>
  );
}

import { useEffect, useState } from "react";

function ClientGate() {
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("paywallToken");
    (async () => {
      if (!t) return;
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      setValid(Boolean(data.valid));
    })();
  }, []);

  if (valid) return <UnlockedContent />;

  return (
    <div className="rounded-md border p-4 bg-gray-50">
      <p className="text-sm text-gray-600">
        🔒 Full content locked — complete payment to unlock.
      </p>
    </div>
  );
}
