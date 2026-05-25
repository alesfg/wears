import { useCallback } from "react";
import { posthog, Events } from "@/lib/posthog";

export function useAnalytics() {
  const track = useCallback(
    (event: string, props?: Record<string, string | number | boolean | null>) => {
      posthog.capture(event, props as Parameters<typeof posthog.capture>[1]);
    },
    []
  );

  const identify = useCallback((userId: string, email: string) => {
    posthog.identify(userId, { email });
  }, []);

  return { track, identify, Events };
}
