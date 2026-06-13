import PostHog from "posthog-react-native";

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";

export const posthog = new PostHog(key || "placeholder", {
  host: "https://us.i.posthog.com",
  disabled: !key,
  flushAt: 20,
  flushInterval: 30000,
});

export const Events = {
  APP_OPEN:          "app_open",
  ONBOARDING_STEP:   "onboarding_step",
  SIGN_IN:           "sign_in",
  SIGN_OUT:          "sign_out",
  PAYWALL_SHOWN:     "paywall_shown",
  PAYWALL_DISMISSED: "paywall_dismissed",
  PURCHASE:          "purchase",
  PURCHASE_RESTORED: "purchase_restored",
  FEATURE_USED:      "feature_used",
  ITEM_ADDED:        "item_added",
  ITEM_DELETED:      "item_deleted",
  WEAR_LOGGED:       "wear_logged",
  SHARE_EXPORTED:    "share_exported",
  WRAPPED_STARTED:   "wrapped_started",
  WRAPPED_COMPLETED: "wrapped_completed",
  TAB_VIEWED:        "tab_viewed",
  WATCHLIST_VIEWED:  "watchlist_item_viewed",
  WATCHLIST_ADDED:   "watchlist_item_added",
  WATCHLIST_REMOVED: "watchlist_item_removed",
} as const;
