import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lnbitsCreateInvoice } from "@/lib/lnbits";
import { invoices } from "@/lib/state";

const schema = z.object({
  amountSats: z.number().int().min(1),
  memo: z.string().default("Paywall access"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountSats, memo } = schema.parse(body);

    const inv = await lnbitsCreateInvoice(amountSats, memo);

    console.log("[create-invoice] LNbits response:", inv);

    // LNbits always returns bolt11 + payment_hash
    const { payment_hash, bolt11 } = inv;

    invoices.set(payment_hash, {
      amountSats,
      memo,
      createdAt: Date.now(),
      paid: false,
    });

    return NextResponse.json({
      paymentHash: payment_hash,
      paymentRequest: bolt11,
      bolt11,
    });
  } catch (err: any) {
    console.error("[create-invoice] error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
