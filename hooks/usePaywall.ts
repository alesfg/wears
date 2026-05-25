import { useCallback } from "react";
import { usePaywallStore } from "@/store/paywallStore";
import {
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  isProFromCustomerInfo,
} from "@/lib/revenuecat";
import { FREE_TIER_ITEM_LIMIT } from "@/constants/config";
import { posthog, Events } from "@/lib/posthog";

export function usePaywall() {
  const { isPro, isLoading, setIsPro, setLoading } = usePaywallStore();

  const checkPro = useCallback(async () => {
    setLoading(true);
    const info = await getCustomerInfo();
    setIsPro(isProFromCustomerInfo(info));
    setLoading(false);
  }, [setIsPro, setLoading]);

  const isAtFreeLimit = useCallback(
    (itemCount: number) => !isPro && itemCount >= FREE_TIER_ITEM_LIMIT,
    [isPro]
  );

  const purchaseMonthly = useCallback(async () => {
    const offerings = await getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p: { packageType: string }) => p.packageType === "MONTHLY"
    );
    if (!pkg) throw new Error("Monthly package not found");
    const { customerInfo } = await purchasePackage(pkg);
    const pro = isProFromCustomerInfo(customerInfo);
    setIsPro(pro);
    if (pro) posthog.capture(Events.PURCHASE, { plan: "monthly" });
    return pro;
  }, [setIsPro]);

  const purchaseAnnual = useCallback(async () => {
    const offerings = await getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p: { packageType: string }) => p.packageType === "ANNUAL"
    );
    if (!pkg) throw new Error("Annual package not found");
    const { customerInfo } = await purchasePackage(pkg);
    const pro = isProFromCustomerInfo(customerInfo);
    setIsPro(pro);
    if (pro) posthog.capture(Events.PURCHASE, { plan: "annual" });
    return pro;
  }, [setIsPro]);

  const restore = useCallback(async () => {
    const info = await restorePurchases();
    const pro = isProFromCustomerInfo(info);
    setIsPro(pro);
    return pro;
  }, [setIsPro]);

  return {
    isPro,
    isLoading,
    checkPro,
    isAtFreeLimit,
    purchaseMonthly,
    purchaseAnnual,
    restore,
  };
}
