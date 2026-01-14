import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const statusMap: Record<string, string> = {
  approved: "paid",
  authorized: "pending",
  in_process: "pending",
  pending: "pending",
  rejected: "failed",
  cancelled: "failed",
  refunded: "refunded",
  charged_back: "refunded",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const url = new URL(req.url);
    const searchType = url.searchParams.get("type") || url.searchParams.get("topic");

    // Mercado Pago usually sends data.id
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const paymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body?.id;

    if ((searchType && searchType.includes("payment")) || paymentId) {
      if (!paymentId) {
        throw new Error("payment id não encontrado no webhook");
      }

      // Fetch payment from Mercado Pago
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const mpData = await mpResp.json();
      if (!mpResp.ok) {
        console.error("MP webhook fetch error", mpData);
        throw new Error("Falha ao consultar pagamento no Mercado Pago");
      }

      const mappedStatus = statusMap[mpData.status] || "pending";
      const paidAt =
        mappedStatus === "paid" && mpData.date_approved
          ? new Date(mpData.date_approved).toISOString()
          : null;
      const failedAt = mappedStatus === "failed" ? new Date().toISOString() : null;

      const subscriptionId = mpData.metadata?.subscription_id || null;
      const tenantId = mpData.metadata?.tenant_id || null;
      const amount = mpData.transaction_amount || mpData.amount || 0;
      const paymentMethod = mpData.payment_method?.type_id || mpData.payment_type_id || null;

      // Update or insert payment record
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("mercadopago_payment_id", paymentId)
        .maybeSingle();

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            status: mappedStatus,
            status_detail: mpData.status_detail || null,
            paid_at: paidAt,
            failed_at: failedAt,
            net_amount: mpData.transaction_details?.net_received_amount || existingPayment.net_amount,
            fee_amount: mpData.fee_details?.reduce((sum: number, f: any) => sum + (f.amount || 0), 0) ||
              existingPayment.fee_amount,
            invoice_url: mpData.statement_descriptor || existingPayment.invoice_url,
          })
          .eq("mercadopago_payment_id", paymentId);
      } else {
      await supabase.from("payments").insert({
        mercadopago_payment_id: paymentId,
        mercadopago_preference_id: mpData.metadata?.preference_id || null,
        subscription_id: subscriptionId,
        tenant_id: tenantId,
        amount,
        status: mappedStatus,
        status_detail: mpData.status_detail || null,
        payment_method: paymentMethod,
        paid_at: paidAt,
        failed_at: failedAt,
      });
      }

      // If paid, update subscription dates and status
      if (subscriptionId && mappedStatus === "paid") {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*, plan:plans(duration_months)")
          .eq("id", subscriptionId)
          .single();

        if (subscription) {
          const duration = subscription.plan?.duration_months || 1;
          const currentEnd = new Date(subscription.end_date);
          const newEnd = new Date(currentEnd);
          newEnd.setMonth(newEnd.getMonth() + duration);

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              last_payment_date: new Date().toISOString().split("T")[0],
              end_date: newEnd.toISOString().split("T")[0],
              next_billing_date: newEnd.toISOString().split("T")[0],
            })
            .eq("id", subscriptionId);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Unknown event, acknowledge
    return new Response(JSON.stringify({ success: true, message: "ignored" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

