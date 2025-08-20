import { NextRequest, NextResponse } from "next/server";
import { addresses } from "@/lib/state";
import { mintAccessToken } from "@/lib/jwt";

const MIN_CONF = parseInt(process.env.ONCHAIN_MIN_CONF || "1", 10);

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId)
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const st = addresses.get(paymentId);
  if (!st)
    return NextResponse.json({ error: "unknown paymentId" }, { status: 404 });

  if (st.confirmed && st.token) {
    return NextResponse.json({
      confirmed: true,
      token: st.token,
      confs: MIN_CONF,
    });
  }

  // Query Blockstream testnet API
  const base =
    process.env.BTC_NETWORK === "mainnet"
      ? "https://blockstream.info/api"
      : "https://blockstream.info/testnet/api";

  const res = await fetch(`${base}/address/${st.address}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json(
      { error: `explorer error: ${msg}` },
      { status: 502 }
    );
  }
  const data = await res.json();

  // Heuristic: check chain_stats for total funded sum/tx count and mempool
  const received =
    (data.chain_stats?.funded_txo_sum || 0) +
    (data.mempool_stats?.funded_txo_sum || 0);
  const confTxs = data.chain_stats?.tx_count || 0;

  if (received >= st.amountSats && confTxs > 0) {
    // Confirmed (≥1 conf). For exact confs, one could fetch /tx/:id
    st.confirmed = true;
    st.token = await mintAccessToken(
      { resource: "content-1", method: "onchain", address: st.address },
      3600
    );
    addresses.set(paymentId, st);
    return NextResponse.json({
      confirmed: true,
      token: st.token,
      confs: MIN_CONF,
    });
  }

  return NextResponse.json({ confirmed: false, confs: 0 });
}
