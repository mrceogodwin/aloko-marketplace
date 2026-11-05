import { createFileRoute } from "@tanstack/react-router";
import { settlePaystackReference } from "@/lib/aloko.functions";

export const Route = createFileRoute("/api/paystack/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const reference = url.searchParams.get("reference") || url.searchParams.get("trxref") || "";
        const result = reference.startsWith("alk_") ? await settlePaystackReference(reference) : { ok: false };
        const dest = new URL("/", url.origin);
        dest.searchParams.set("pay", result.ok ? "paid" : "failed");
        return Response.redirect(dest.toString(), 303);
      },
    },
  },
});
