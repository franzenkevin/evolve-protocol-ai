import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/contexts/AuthContext";
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
  }) => {
    if (!user) {
      toast.error("Faça login para assinar");
      return;
    }
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        ...(options.couponCode ? { discountCode: options.couponCode } : {}),
        customData: {
          userId: user.id,
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
