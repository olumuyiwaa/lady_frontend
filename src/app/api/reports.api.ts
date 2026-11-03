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
