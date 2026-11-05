import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

export function paystackSecret() {
  return env("PAYSTACK_SECRET_KEY");
}

export function paystackSignatureOk(raw: string, signature: string) {
  const secret = paystackSecret();
  if (!secret || !signature) return false;
  const digest = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function initializePaystack(input: { email: string; amountNaira: number; reference: string; callbackUrl: string }) {
  const secret = paystackSecret();
  if (!secret) throw new Error("Card payments are not switched on. Add PAYSTACK_SECRET_KEY on Vercel.");
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountNaira * 100,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
  });
  const body = (await response.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string } };
  const url = body.data?.authorization_url;
  if (!response.ok || !body.status || !url) throw new Error(body.message || "Paystack did not open a checkout.");
  return url;
}

export async function verifyPaystack(reference: string) {
  const secret = paystackSecret();
  if (!secret) return { ok: false as const };
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await response.json()) as { status?: boolean; data?: { status?: string; amount?: number; currency?: string } };
  const data = body.data;
  if (!response.ok || !body.status || data?.status !== "success" || data.currency !== "NGN" || typeof data.amount !== "number") {
    return { ok: false as const };
  }
  return { ok: true as const, amount: data.amount };
}
