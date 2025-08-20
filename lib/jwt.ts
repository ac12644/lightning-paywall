import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret");
const alg = "HS256";

export async function mintAccessToken(
  payload: Record<string, unknown>,
  ttlSec = 3600
) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSec)
    .setIssuer("micro-paywall")
    .setAudience("paywall-users")
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: "micro-paywall",
    audience: "paywall-users",
  });
  return payload;
}
