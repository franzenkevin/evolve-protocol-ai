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

      if (error || !data?.url) {
        console.error("stripe-checkout error", error, data);
        toast.error(data?.error || "Não foi possível abrir o checkout. Tente novamente.");
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir checkout");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
