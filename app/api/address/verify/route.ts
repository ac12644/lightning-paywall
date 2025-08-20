import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });
  try {
    const payload = await verifyAccessToken(token);
    return NextResponse.json({ valid: true, payload });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
