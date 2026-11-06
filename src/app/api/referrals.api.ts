import { authFetch } from "@/app/api/authFetch";

export type ReferralSettings = {
  enabled: boolean;
  discountCents: number;
  rewardCents: number;
  rewardValidDays: number;
  minBookingCents: number;
};

export type ReferralStats = {
  referrals: number;
  completed: number;
  discountGivenCents: number;
  rewardsIssuedCents: number;
  rewardsUsedCents: number;
  rewardsOutstandingCents: number;
  topReferrers: { customerId: string; name: string | null; count: number }[];
};

export type ReferralRewardStatus = "AVAILABLE" | "USED" | "EXPIRED" | "CANCELLED";

export type ReferralRow = {
  bookingId: string;
  createdAt: string;
  bookingStatus: string;
  referredCustomer: { id: string; name: string | null };
  referrer: { id: string; name: string | null; code: string | null };
  discountCents: number;
  reward: { couponId: string; code: string; valueCents: number; status: ReferralRewardStatus; expiresAt: string | null } | null;
  flags: string[];
};

export const getReferralSettings = () => authFetch(`/referrals/settings`);

export const updateReferralSettings = (body: Partial<ReferralSettings>) =>
  authFetch(`/referrals/settings`, { method: "PUT", body: JSON.stringify(body) });

export const getReferralStats = () => authFetch(`/referrals/stats`);

export function listReferrals(params: { page?: number; flagged?: boolean } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.flagged) q.set("flagged", "true");
  return authFetch(`/referrals?${q}`);
}

export const cancelReferralReward = (couponId: string) =>
  authFetch(`/referrals/rewards/${couponId}/cancel`, { method: "POST" });
