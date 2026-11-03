import { authFetch } from "./authFetch";
import { AvailabilitySlot, Cleaner, CleanerStatus } from "./cleansera-types";

export async function listCleaners(status?: CleanerStatus) {
    const qs = status ? `?status=${status}` : "";
    const result = await authFetch(`/cleaners${qs}`, { method: "GET" });
    return result.data as Cleaner[];
}

export async function onboardCleaner(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    hireDate?: string;
}) {
    const result = await authFetch(`/cleaners`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data as Cleaner;
}

export async function offboardCleaner(id: string, reason?: string) {
    const result = await authFetch(`/cleaners/${id}/offboard`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
    return result.data as Cleaner;
}

export async function updateCleanerAvailability(id: string, slots: AvailabilitySlot[]) {
    const result = await authFetch(`/cleaners/${id}/availability`, {
        method: "PUT",
        body: JSON.stringify({ slots }),
    });
    return result.data as AvailabilitySlot[];
}
