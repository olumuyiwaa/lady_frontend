import { authFetch, API_BASE_URL } from "./authFetch";
import { sessionService } from "../services/session.service";
import type { CompanyLocation, CompanyMember, CompanyMemberInput } from "./portal.api";

export type QualityFigures = {
    key: string;
    label: string;
    visits: number;
    completedVisits: number;
    averageRating: number | null;
    ratingCount: number;
    checklistCompletionPct: number | null;
    punctualityPct: number | null;
    noCheckIn: number;
    complaints: number;
};

export type B2BAccountRow = {
    customerId: string;
    companyName: string;
    contactName: string;
    email: string | null;
    phone: string | null;
    branchCount: number;
    memberCount: number;
    spendCents: number;
    openInvoiceCents: number;
    overdueInvoices: number;
    quality: QualityFigures;
};

export type B2BAccountsList = { month: string; graceMinutes?: number; accounts: B2BAccountRow[] };

export type B2BQualityReport = {
    month: string;
    company: { name: string };
    graceMinutes: number;
    total: QualityFigures;
    branches: QualityFigures[];
};

const q = (month?: string) => (month ? `?month=${encodeURIComponent(month)}` : "");

export async function listB2BAccounts(month?: string) {
    const r = await authFetch(`/b2b-accounts${q(month)}`, { method: "GET" });
    return r.data as B2BAccountsList;
}

export async function getB2BQuality(customerId: string, month?: string) {
    const r = await authFetch(`/b2b-accounts/${customerId}/quality${q(month)}`, { method: "GET" });
    return r.data as B2BQualityReport;
}

/** The quality report as a PDF (needs the bearer token, so it cannot be a plain link). */
export async function downloadB2BQualityPdf(customerId: string, month: string) {
    const res = await fetch(`${API_BASE_URL}/b2b-accounts/${customerId}/quality.pdf${q(month)}`, {
        headers: { Authorization: `Bearer ${sessionService.getAccessToken()}`, Accept: "application/pdf" },
    });
    if (!res.ok) throw new Error("Could not download the report");
    return res.blob();
}

export async function listB2BMembers(customerId: string) {
    const r = await authFetch(`/b2b-accounts/${customerId}/members`, { method: "GET" });
    return r.data as CompanyMember[];
}

export async function listB2BLocations(customerId: string) {
    const r = await authFetch(`/b2b-accounts/${customerId}/locations`, { method: "GET" });
    return r.data as CompanyLocation[];
}

export async function createB2BMember(customerId: string, input: CompanyMemberInput) {
    const r = await authFetch(`/b2b-accounts/${customerId}/members`, { method: "POST", body: JSON.stringify(input) });
    return r.data as CompanyMember;
}

export async function updateB2BMember(customerId: string, memberId: string, input: CompanyMemberInput) {
    const r = await authFetch(`/b2b-accounts/${customerId}/members/${memberId}`, { method: "PUT", body: JSON.stringify(input) });
    return r.data as CompanyMember;
}
