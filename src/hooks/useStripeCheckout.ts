import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutOptions {
  priceId: string;
  referralCode?: string;
  couponCode?: string;
  successUrl?: string;
  /** Deprecated: email is now collected by Stripe Checkout itself. */
  guestEmail?: string;
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: CheckoutOptions) => {
    const t0 = performance.now();
    const isEmbeddedPreview = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const popup = isEmbeddedPreview ? window.open("", "_blank", "noopener,noreferrer") : null;

    console.log("[checkout] start", { priceId: options.priceId, coupon: options.couponCode });
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          priceId: options.priceId,
          couponCode: options.couponCode,
          referralCode: options.referralCode,
          successUrl: options.successUrl,
        },
      });

      const elapsed = Math.round(performance.now() - t0);
      console.log("[checkout] response", { elapsed_ms: elapsed, hasUrl: !!data?.url, error, data });

      if (error) {
        console.error("[checkout] invoke error", error);
        popup?.close();
        toast.error(`Erro no checkout: ${error.message || "tente novamente"}`);
        return;
      }

      if (!data?.url) {
        console.error("[checkout] missing URL in response", data);
        popup?.close();
        toast.error(data?.error || "Resposta inválida do servidor.");
        return;
      }

      // Validate URL before redirecting
      let target: URL;
      try {
        target = new URL(data.url);
      } catch (e) {
        console.error("[checkout] invalid URL", data.url, e);
        popup?.close();
        toast.error("URL de checkout inválida.");
        return;
      }

      if (!target.hostname.endsWith("stripe.com")) {
        console.error("[checkout] suspicious host, refusing redirect", target.hostname);
        popup?.close();
        toast.error("Destino de checkout inesperado.");
        return;
      }

      console.log("[checkout] redirecting →", target.toString());
      if (popup && !popup.closed) {
        popup.location.replace(target.toString());
        return;
      }

      // Use assign so back-button returns to landing
      window.location.assign(target.toString());
    } catch (e) {
      console.error("[checkout] unexpected error", e);
      popup?.close();
      toast.error("Erro ao abrir checkout. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
