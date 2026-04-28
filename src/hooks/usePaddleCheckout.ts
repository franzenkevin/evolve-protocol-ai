import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePaddleCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    referralCode?: string;
    couponCode?: string;
    successUrl?: string;
    customData?: Record<string, string>;
    /** Email para guest checkout (quando usuário não está logado) */
    guestEmail?: string;
  }) => {
    setLoading(true);
    try {
      let userId = user?.id;
      let email = user?.email;

      // Se não está logado, criar/buscar conta a partir do email
      if (!userId) {
        if (!options.guestEmail) {
          toast.error("Faça login ou informe seu e-mail");
          return;
        }
        const { data, error } = await supabase.functions.invoke("guest-checkout", {
          body: { email: options.guestEmail },
        });
        if (error || !data?.userId) {
          console.error("guest checkout error:", error);
          toast.error("Não foi possível iniciar o checkout. Tente novamente.");
          return;
        }
        userId = data.userId;
        email = data.email;
      }

      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: email ? { email } : undefined,
        ...(options.couponCode ? { discountCode: options.couponCode } : {}),
        customData: {
          userId: userId!,
          ...(options.referralCode ? { referralCode: options.referralCode } : {}),
          ...(options.couponCode ? { couponCode: options.couponCode } : {}),
          ...(options.customData || {}),
        },
        settings: {
          displayMode: "overlay",
          successUrl:
            options.successUrl || `${window.location.origin}/checkout/success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir checkout");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
