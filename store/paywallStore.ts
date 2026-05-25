import { create } from "zustand";

interface PaywallState {
  isPro: boolean;
  isLoading: boolean;
  setIsPro: (v: boolean) => void;
  setLoading: (v: boolean) => void;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  isPro: false,
  isLoading: false,
  setIsPro: (isPro) => set({ isPro }),
  setLoading: (isLoading) => set({ isLoading }),
}));
