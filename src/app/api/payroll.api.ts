import { authFetch } from "./authFetch";
import { CleanerCompensation, CleanerEarning, CompensationType, Payout } from "./cleansera-types";

export async function listCompensations() {
    const result = await authFetch(`/payroll/compensation`, { method: "GET" });
    return result.data as CleanerCompensation[];
}

export type PayrollSummary = {
    pendingEarningsCents: number;
    lifetimePaidCents: number;
    pendingPayoutsCents: number;
    cleanersWithPendingEarnings: number;
};

export async function getPayrollSummary() {
    const result = await authFetch(`/payroll/summary`, { method: "GET" });
    return result.data as PayrollSummary;
}

export async function setCompensation(cleanerId: string, type: CompensationType, value: number) {
    const result = await authFetch(`/payroll/compensation/${cleanerId}`, {
        method: "PUT",
        body: JSON.stringify({ type, value }),
    });
    return result.data as CleanerCompensation;
}

export async function listEarnings(params?: { cleanerId?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.cleanerId) qs.set("cleanerId", params.cleanerId);
    if (params?.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const result = await authFetch(`/payroll/earnings${suffix}`, { method: "GET" });
    return result.data as CleanerEarning[];
}

export async function listPayouts(params?: { cleanerId?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.cleanerId) qs.set("cleanerId", params.cleanerId);
    if (params?.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const result = await authFetch(`/payroll/payouts${suffix}`, { method: "GET" });
    return result.data as Payout[];
}

export async function createPayout(cleanerId: string, payload?: { method?: string; reference?: string }) {
    const result = await authFetch(`/payroll/payouts/${cleanerId}`, {
        method: "POST",
        body: JSON.stringify(payload || {}),
    });
    return result.data as Payout;
}

export async function markPayoutPaid(id: string, payload?: { method?: string; reference?: string }) {
    const result = await authFetch(`/payroll/payouts/${id}/mark-paid`, {
        method: "POST",
        body: JSON.stringify(payload || {}),
    });
    return result.data as Payout;
}

// Automated counterpart to markPayoutPaid: actually moves money, via Stripe
// Connect, from the business's balance to the cleaner's connected account.
// Only enabled in the UI once cleaner.user.stripePayoutsEnabled is true.
export async function payPayoutViaStripe(id: string) {
    const result = await authFetch(`/payroll/payouts/${id}/pay-stripe`, {
        method: "POST",
    });
    return result.data as Payout;
}
