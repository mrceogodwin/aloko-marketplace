import { createFileRoute } from "@tanstack/react-router";
import { settlePaystackReference } from "@/lib/aloko.functions";
import { paystackSignatureOk } from "@/lib/paystack.server";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!paystackSignatureOk(raw, request.headers.get("x-paystack-signature") || "")) {
          return new Response("invalid signature", { status: 401 });
        }
        let event: { event?: string; data?: { reference?: string } };
        try {
          event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (event.event === "charge.success" && event.data?.reference) {
          await settlePaystackReference(event.data.reference);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
