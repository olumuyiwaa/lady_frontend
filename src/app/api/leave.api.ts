import { authFetch } from "./authFetch";

export type LeaveType = "VACATION" | "SICK" | "PERSONAL" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type Leave = {
    id: string;
    cleanerId: string;
    type: LeaveType;
    status: LeaveStatus;
    startsAt: string;
    /** Start of the day after the last day of leave. */
    endsAt: string;
    reason: string | null;
    decisionNote: string | null;
    cleaner?: { id: string; user: { firstName: string; lastName: string } };
};

export type LeaveConflict = {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    addressLine1?: string | null;
    city?: string | null;
};

export type LeaveOutcome = { leave: Leave; conflicts: LeaveConflict[] };

export async function listLeave(params: { status?: LeaveStatus; cleanerId?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.cleanerId) qs.set("cleanerId", params.cleanerId);
    const result = await authFetch(`/leave${qs.size ? `?${qs}` : ""}`, { method: "GET" });
    return result.data as Leave[];
}

export async function recordLeave(payload: { cleanerId: string; type: LeaveType; startDate: string; endDate: string; reason?: string }) {
    const result = await authFetch(`/leave`, { method: "POST", body: JSON.stringify(payload) });
    return result.data as LeaveOutcome;
}

export async function approveLeave(id: string, note?: string) {
    const result = await authFetch(`/leave/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) });
    return result.data as LeaveOutcome;
}

export async function rejectLeave(id: string, note?: string) {
    const result = await authFetch(`/leave/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
    return result.data as LeaveOutcome;
}

export async function cancelLeave(id: string) {
    const result = await authFetch(`/leave/${id}/cancel`, { method: "POST" });
    return result.data as Leave;
}
