import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CreateSubscriptionRequest {
  tenant_id: string;
  plan_id: string;
  payer_email: string;
  payment_method: "credit_card" | "pix" | "boleto";
}

interface CreatePlanRequest {
  action: "create_plan";
  name: string;
  description: string;
  price: number;
  duration_months: number;
}

interface UpdatePlanRequest {
  action: "update_plan";
  plan_id: string;
  name?: string;
  description?: string;
  price?: number;
  duration_months?: number;
  is_active?: boolean;
}

interface CreateSubscriptionAction {
  action: "create_subscription";
  tenant_id: string;
  plan_id: string;
  payer_email: string;
  payment_method: "credit_card" | "pix" | "boleto";
}

interface CancelSubscriptionRequest {
  action: "cancel_subscription";
  subscription_id: string;
}

interface CheckExpiringRequest {
  action: "check_expiring";
}

interface CreatePaymentRequest {
  action: "create_payment";
  amount: number;
  description: string;
  payment_method: "credit_card" | "pix" | "boleto";
  subscription_id?: string;
  tenant_id?: string;
  payer_email?: string;
}

interface ChargeSubscriptionRequest {
  action: "charge_subscription";
  subscription_id: string;
}

type RequestBody =
  | CreatePlanRequest
  | UpdatePlanRequest
  | CreateSubscriptionAction
  | CancelSubscriptionRequest
  | CheckExpiringRequest
  | CreatePaymentRequest
  | ChargeSubscriptionRequest;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body: RequestBody = await req.json();

    switch (body.action) {
      case "create_plan": {
        const { name, description, price, duration_months } = body;
        
        const { data, error } = await supabase
          .from("plans")
          .insert({ name, description, price, duration_months })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, plan: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_plan": {
        const { plan_id, ...updates } = body;
        delete (updates as any).action;

        const { data, error } = await supabase
          .from("plans")
          .update(updates)
          .eq("id", plan_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, plan: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_subscription": {
        const { tenant_id, plan_id, payer_email, payment_method } = body;

        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from("plans")
          .select("*")
          .eq("id", plan_id)
          .single();

        if (planError || !plan) throw new Error("Plano não encontrado");

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        // Create Mercado Pago preapproval (subscription)
        const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: `${plan.name} - FinanceApp`,
            auto_recurring: {
              frequency: plan.duration_months,
              frequency_type: "months",
              transaction_amount: plan.price,
              currency_id: "BRL",
            },
            back_url: `${req.headers.get("origin")}/settings`,
            payer_email: payer_email,
            status: "pending",
          }),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
          console.error("Mercado Pago error:", mpData);
          throw new Error(mpData.message || "Erro ao criar assinatura no Mercado Pago");
        }

        // Save subscription in database
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .insert({
            tenant_id,
            plan_id,
            status: "pending",
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            mercadopago_preapproval_id: mpData.id,
            payment_method,
          })
          .select()
          .single();

        if (subError) throw subError;

        return new Response(
          JSON.stringify({
            success: true,
            subscription,
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel_subscription": {
        const { subscription_id } = body;

        // Get subscription
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", subscription_id)
          .single();

        if (subError || !subscription) throw new Error("Assinatura não encontrada");

        // Cancel in Mercado Pago if exists
        if (subscription.mercadopago_preapproval_id) {
          await fetch(
            `https://api.mercadopago.com/preapproval/${subscription.mercadopago_preapproval_id}`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "cancelled" }),
            }
          );
        }

        // Update in database
        const { data, error } = await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscription_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, subscription: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_expiring": {
        // Find subscriptions expiring in 2 days
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        const dateStr = twoDaysFromNow.toISOString().split("T")[0];

        const { data: expiringSubscriptions, error } = await supabase
          .from("subscriptions")
          .select(`
            *,
            tenant:tenants(*),
            plan:plans(*)
          `)
          .eq("end_date", dateStr)
          .eq("status", "active")
          .eq("notified_expiring", false);

        if (error) throw error;

        // Mark as notified
        for (const sub of expiringSubscriptions || []) {
          await supabase
            .from("subscriptions")
            .update({ notified_expiring: true })
            .eq("id", sub.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            expiring_count: expiringSubscriptions?.length || 0,
            subscriptions: expiringSubscriptions,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_payment": {
        const {
          amount,
          description,
          payment_method,
          subscription_id,
          tenant_id,
          payer_email,
        } = body;

        if (!amount || amount <= 0) {
          throw new Error("amount é obrigatório e deve ser maior que zero");
        }
        if (!description) {
          throw new Error("description é obrigatório");
        }

        // Create a checkout preference to allow the user to pay
        const prefResponse = await fetch(
          "https://api.mercadopago.com/checkout/preferences",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: [
                {
                  title: description,
                  quantity: 1,
                  currency_id: "BRL",
                  unit_price: amount,
                },
              ],
              payer: payer_email ? { email: payer_email } : undefined,
              payment_methods: {
                excluded_payment_types:
                  payment_method === "credit_card"
                    ? []
                    : payment_method === "pix"
                      ? [{ id: "credit_card" }]
                      : [],
              },
              back_urls: {
                success: `${req.headers.get("origin")}/settings`,
                failure: `${req.headers.get("origin")}/settings`,
                pending: `${req.headers.get("origin")}/settings`,
              },
              auto_return: "approved",
              metadata: {
                subscription_id,
                tenant_id,
              },
            }),
          }
        );

        const prefData = await prefResponse.json();

        if (!prefResponse.ok) {
          console.error("Mercado Pago preference error:", prefData);
          throw new Error(prefData.message || "Erro ao criar pagamento");
        }

        // Save payment intent to database (status pending)
        let resolvedTenantId = tenant_id || null;
        if (subscription_id && !resolvedTenantId) {
          const { data: subRecord } = await supabase
            .from("subscriptions")
            .select("tenant_id")
            .eq("id", subscription_id)
            .single();
          resolvedTenantId = subRecord?.tenant_id || null;
        }

        if (subscription_id || resolvedTenantId) {
          await supabase.from("payments").insert({
            subscription_id,
            tenant_id: resolvedTenantId,
            amount,
            status: "pending",
            payment_method,
            mercadopago_preference_id: prefData.id,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            init_point: prefData.init_point,
            sandbox_init_point: prefData.sandbox_init_point,
            preference_id: prefData.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "charge_subscription": {
        const { subscription_id } = body;
        if (!subscription_id) throw new Error("subscription_id é obrigatório");

        // Load subscription with plan and tenant
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*, plan:plans(*), tenant:tenants(*)")
          .eq("id", subscription_id)
          .single();

        if (subError || !subscription) throw new Error("Assinatura não encontrada");

        const plan = (subscription as any).plan;
        const amount = plan?.price;
        if (!amount) throw new Error("Plano sem preço configurado");

        // Create payment intent
        const prefResponse = await fetch(
          "https://api.mercadopago.com/checkout/preferences",
          {
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
                  unit_price: amount,
                },
              ],
              back_urls: {
                success: `${req.headers.get("origin")}/settings`,
                failure: `${req.headers.get("origin")}/settings`,
                pending: `${req.headers.get("origin")}/settings`,
              },
              auto_return: "approved",
              metadata: {
                subscription_id,
                tenant_id: subscription.tenant_id,
              },
            }),
          }
        );

        const prefData = await prefResponse.json();
        if (!prefResponse.ok) {
          console.error("Mercado Pago preference error:", prefData);
          throw new Error(prefData.message || "Erro ao criar cobrança");
        }

        await supabase.from("payments").insert({
          subscription_id,
          tenant_id: subscription.tenant_id,
          amount,
          status: "pending",
          payment_method: "credit_card",
          mercadopago_preference_id: prefData.id,
        });

        // Optional: update next billing date
        await supabase
          .from("subscriptions")
          .update({
            next_billing_date: subscription.end_date,
          })
          .eq("id", subscription_id);

        return new Response(
          JSON.stringify({
            success: true,
            init_point: prefData.init_point,
            sandbox_init_point: prefData.sandbox_init_point,
            preference_id: prefData.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("Ação inválida");
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
