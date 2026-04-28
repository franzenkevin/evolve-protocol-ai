import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutOptions {
  priceId: string;
  referralCode?: string;
  couponCode?: string;
  successUrl?: string;
  /** Email for guest checkout (when user is not logged in) */
  guestEmail?: string;
}

export function useStripeCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: CheckoutOptions) => {
    setLoading(true);
    try {
      // Need either logged-in user or guest email
      if (!user && !options.guestEmail) {
        toast.error("Faça login ou informe seu e-mail");
        return;
      }

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          priceId: options.priceId,
          couponCode: options.couponCode,
          referralCode: options.referralCode,
          guestEmail: user ? undefined : options.guestEmail,
          successUrl: options.successUrl,
        },
      });

      if (error || !data?.url) {
        console.error("stripe-checkout error", error, data);
        toast.error(data?.error || "Não foi possível abrir o checkout. Tente novamente.");
        return;
      }

      if (!user && options.guestEmail) {
        sessionStorage.setItem("pendingCheckoutEmail", options.guestEmail.trim().toLowerCase());
      }

      // Redirect to Stripe-hosted checkout
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
