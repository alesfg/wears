import PostHog from "posthog-react-native";

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";

export const posthog = new PostHog(key || "placeholder", {
  host: "https://us.i.posthog.com",
  disabled: !key,
  flushAt: 20,
  flushInterval: 30000,
});

export const Events = {
  APP_OPEN: "app_open",
  ONBOARDING_STEP: "onboarding_step",
  PAYWALL_SHOWN: "paywall_shown",
  PURCHASE: "purchase",
  FEATURE_USED: "feature_used",
  ITEM_ADDED: "item_added",
  WEAR_LOGGED: "wear_logged",
  SHARE_EXPORTED: "share_exported",
} as const;
