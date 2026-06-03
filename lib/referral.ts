import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const BONUS_SLOTS_PER_REFERRAL = 2;

function generateCode(userId: string): string {
  // Short deterministic code from user ID + random suffix
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `W${userId.slice(0, 4).toUpperCase()}${suffix}`;
}

export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  // Check if user already has a code
  const { data: existing } = await db
    .from("referrals")
    .select("code")
    .eq("referrer_id", userId)
    .single();

  if (existing?.code) return existing.code;

  // Create new code
  const code = generateCode(userId);
  const { error } = await db
    .from("referrals")
    .insert({ referrer_id: userId, code, uses: 0, bonus_slots: 0 });

  return error ? null : code;
}

export async function applyReferralCode(
  code: string,
  referredUserId: string
): Promise<{ ok: boolean; error?: string }> {
  // Check code exists
  const { data: referral } = await db
    .from("referrals")
    .select("referrer_id, code")
    .eq("code", code.toUpperCase())
    .single();

  if (!referral) return { ok: false, error: "Invalid code." };
  if (referral.referrer_id === referredUserId) return { ok: false, error: "Can't use your own code." };

  const { data: used } = await db
    .from("referral_uses")
    .select("id")
    .eq("referred_id", referredUserId)
    .single();

  if (used) return { ok: false, error: "Already used a referral code." };

  const { error: useErr } = await db
    .from("referral_uses")
    .insert({ code: referral.code, referred_id: referredUserId });

  if (useErr) return { ok: false, error: "Failed to apply code." };

  await supabase.rpc("increment_referral_bonus", { p_code: referral.code, p_slots: BONUS_SLOTS_PER_REFERRAL });

  return { ok: true };
}

export async function getReferralStats(userId: string): Promise<{ code: string; uses: number; bonusSlots: number } | null> {
  const { data } = await db
    .from("referrals")
    .select("code, uses, bonus_slots")
    .eq("referrer_id", userId)
    .single();

  if (!data) return null;
  return { code: data.code, uses: data.uses, bonusSlots: data.bonus_slots };
}
