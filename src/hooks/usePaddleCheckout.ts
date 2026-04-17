import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePaddleCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: "hypertrophy_monthly" | "hypertrophy_annual";
    referralCode?: string;
    successUrl?: string;
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
        customData: {
          userId: user.id,
          ...(options.referralCode ? { referralCode: options.referralCode } : {}),
        },
        settings: {
          displayMode: "overlay",
          successUrl:
            options.successUrl || `${window.location.origin}/dashboard?checkout=success`,
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
