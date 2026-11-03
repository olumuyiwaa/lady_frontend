import { authFetch } from "@/app/api/authFetch";

export type CouponType = "PERCENT" | "AMOUNT";

export type Coupon = {
  id: string;
  businessId: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  appliesToServiceId?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  perCustomerLimit?: number | null;
  redeemedCount?: number | null;
  createdAt?: string;
};

export async function listCoupons() {
  // Mounted at /businesses/pricing (see backend routes/index.js)
  return authFetch(`/businesses/pricing/coupons`);
}

export async function createCoupon(body: {
  code: string;
  type: CouponType;
  value: number;
  appliesToServiceId?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  perCustomerLimit?: number;
}) {
  return authFetch(`/businesses/pricing/coupons`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCoupon(id: string, body: Record<string, unknown>) {
  return authFetch(`/businesses/pricing/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteCoupon(id: string) {
  // Backend soft-deletes (sets isActive = false)
  return authFetch(`/businesses/pricing/coupons/${id}`, { method: "DELETE" });
}
