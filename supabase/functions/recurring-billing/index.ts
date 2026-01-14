import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const today = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(today.getDate() + 3);
    const windowEnd = inThreeDays.toISOString().split("T")[0];

    // Subscriptions expiring in <= 3 days and not yet cancelled
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("id, tenant_id, end_date, status, mercadopago_preapproval_id, plan:plans(name, price, duration_months)")
      .in("status", ["active", "trial", "expired"])
      .lte("end_date", windowEnd);

    if (error) throw error;

    const results: any[] = [];

    for (const sub of subscriptions || []) {
      const plan = (sub as any).plan;
      if (!plan) continue;

      // Skip if there is already a pending payment
      const { data: pendingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("subscription_id", sub.id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingPayment) {
        results.push({ subscription_id: sub.id, status: "pending_exists" });
        continue;
      }

      // Create Mercado Pago preference for renewal
      const prefResp = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title: `${plan.name} - Renovação`,
              quantity: 1,
              currency_id: "BRL",
              unit_price: plan.price,
            },
          ],
          metadata: {
            subscription_id: sub.id,
            tenant_id: sub.tenant_id,
          },
          back_urls: {
            success: `${req.headers.get("origin") || ""}/settings`,
            failure: `${req.headers.get("origin") || ""}/settings`,
            pending: `${req.headers.get("origin") || ""}/settings`,
          },
          auto_return: "approved",
        }),
      });

      const prefData = await prefResp.json();
      if (!prefResp.ok) {
        console.error("Preference error", prefData);
        results.push({ subscription_id: sub.id, status: "error", error: prefData });
        continue;
      }

      await supabase.from("payments").insert({
        subscription_id: sub.id,
        tenant_id: sub.tenant_id,
        amount: plan.price,
        status: "pending",
        payment_method: "credit_card",
        mercadopago_preference_id: prefData.id,
      });

      results.push({ subscription_id: sub.id, status: "created", preference_id: prefData.id });
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("recurring-billing error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

