import { authFetch } from "./authFetch";

export type ReportKPIs = {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
    completionRate: number;
    cancelRate: number;
    revenueCents: number;
    collectedCents: number;
    avgTicketCents: number;
    activeCleaners: number;
    totalCustomers: number;
    repeatCustomers: number;
    workedMinutes: number;
    utilizationPct: number;
};

export type RevenueDay = { date: string; revenueCents: number };

export type CleanerPerfRow = {
    cleanerId: string;
    name: string;
    email: string;
    status: string;
    jobs: number;
    completed: number;
    revenueCents: number;
    checkIns: number;
};

export async function getReportSummary() {
    const result = await authFetch(`/reports`, { method: "GET" });
    return result.data;
}

export async function getReportKPIs(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params}` : "";
    const result = await authFetch(`/reports/kpis${qs}`, { method: "GET" });
    return result.data as ReportKPIs;
}

export async function getRevenueByDay(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params}` : "";
    const result = await authFetch(`/reports/revenue${qs}`, { method: "GET" });
    return result.data as RevenueDay[];
}

export async function getCleanerPerformance(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params}` : "";
    const result = await authFetch(`/reports/cleaner-performance${qs}`, { method: "GET" });
    return result.data as CleanerPerfRow[];
}

export type InsightFinding = { key: string; params: Record<string, string | number | null> };

export type Insights = {
    bookings: number;
    revenueCents: number;
    previous: { bookings: number; revenueCents: number };
    revenueChangePct: number | null;
    avgBookingCents: number;
    cancelledCount: number;
    cancelRate: number | null;
    customers: { total: number; new: number; returning: number; returningRate: number | null };
    recurringShare: number | null;
    unassigned: number;
    byWeekday: { bookings: number; revenueCents: number }[];
    byHour: number[];
    services: { name: string; bookings: number; revenueCents: number }[];
    cleaners: {
        cleanerId: string;
        name: string | null;
        jobs: number;
        hours: number;
        revenueCents: number;
        avgRating: number | null;
        ratings: number;
        onTimeRate: number | null;
    }[];
    findings: InsightFinding[];
};

export async function getInsights(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params}` : "";
    const result = await authFetch(`/reports/insights${qs}`, { method: "GET" });
    return result.data as Insights;
}
