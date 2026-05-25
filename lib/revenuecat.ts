import { Platform } from "react-native";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS ?? "";
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID ?? "";

export const RC_ENTITLEMENT = "pro";

let _configured = false;

export async function configureRevenueCat() {
  if (!IOS_KEY && !ANDROID_KEY) return;
  try {
    const Purchases = (await import("react-native-purchases")).default;
    const key = Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY;
    if (!key) return;
    Purchases.configure({ apiKey: key });
    _configured = true;
  } catch {
    // No native module in Expo Go — silently skip
  }
}

export async function getCustomerInfo() {
  if (!_configured) return null;
  try {
    const Purchases = (await import("react-native-purchases")).default;
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function getOfferings() {
  if (!_configured) return null;
  try {
    const Purchases = (await import("react-native-purchases")).default;
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: unknown) {
  if (!_configured) throw new Error("RevenueCat not configured");
  const Purchases = (await import("react-native-purchases")).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Purchases.purchasePackage(pkg as any);
}

export async function restorePurchases() {
  if (!_configured) return null;
  try {
    const Purchases = (await import("react-native-purchases")).default;
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

export function isProFromCustomerInfo(info: { entitlements: { active: Record<string, unknown> } } | null): boolean {
  if (!info) return false;
  return RC_ENTITLEMENT in info.entitlements.active;
}
