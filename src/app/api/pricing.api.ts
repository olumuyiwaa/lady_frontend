import { authFetch } from "./authFetch";

export type PolicyValueType = "PERCENT" | "AMOUNT";

export type BusinessPricing = {
    businessId: string;
    frequencyDiscounts: Record<string, number> | null;
    // PER_SQFT / PER_ROOM rate overrides, in cents. Null means "use the
    // platform default" — see backend lib/pricing.js DEFAULTS.
    perSqftCents: number | null;
    perRoomCents: number | null;
    depositType: PolicyValueType | null;
    depositValue: number | null;
    cancellationWindowHours: number | null;
    cancellationFeeType: PolicyValueType | null;
    cancellationFeeValue: number | null;
};

export async function getPricing() {
    const result = await authFetch(`/businesses/pricing`, { method: "GET" });
    return result.data as BusinessPricing;
}

export async function updatePricing(patch: Partial<Omit<BusinessPricing, "businessId">>) {
    const result = await authFetch(`/businesses/pricing`, { method: "PUT", body: JSON.stringify(patch) });
    return result.data as BusinessPricing;
}
