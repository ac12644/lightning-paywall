import { NextRequest, NextResponse } from "next/server";
import { lnbitsCheckPaid } from "@/lib/lnbits";
import { invoices } from "@/lib/state";
import { mintAccessToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash");
  if (!hash)
    return NextResponse.json({ error: "hash required" }, { status: 400 });

  const state = invoices.get(hash);
  if (!state)
    return NextResponse.json({ error: "unknown invoice" }, { status: 404 });

  if (state.paid && state.token) {
    return NextResponse.json({ paid: true, token: state.token });
  }

  const paid = await lnbitsCheckPaid(hash);
  if (!paid) return NextResponse.json({ paid: false });

  state.paid = true;
  state.token = await mintAccessToken(
    { resource: "content-1", method: "lightning", hash },
    3600
  );
  invoices.set(hash, state);

  return NextResponse.json({ paid: true, token: state.token });
}
