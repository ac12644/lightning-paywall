import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deriveP2WPKHAddressFromXpub } from "@/lib/derive";
import { addresses, bumpIndex } from "@/lib/state";

const schema = z.object({
  amountSats: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amountSats } = schema.parse(body);

  const idx = bumpIndex();
  const address = deriveP2WPKHAddressFromXpub(idx);

  const paymentId = `${Date.now()}-${idx}`;
  addresses.set(paymentId, {
    address,
    index: idx,
    amountSats,
    createdAt: Date.now(),
    confirmed: false,
  });

  return NextResponse.json({ paymentId, address });
}
