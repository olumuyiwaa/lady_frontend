import { authFetch } from "./authFetch";
import { Booking, Cleaner } from "./cleansera-types";

export type DispatchAssignment = {
    id: string;
    bookingId: string;
    cleanerId: string;
    assignedAt: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    booking?: Booking;
    cleaner?: Cleaner;
};

export async function listDispatchItems() {
    const result = await authFetch(`/dispatch`, { method: "GET" });
    return result.data as DispatchAssignment[];
}

export async function createAssignment(bookingId: string, cleanerId?: string) {
    // Omit cleanerId to have the backend auto-select the best-fit cleaner
    const result = await authFetch(`/dispatch`, {
        method: "POST",
        body: JSON.stringify(cleanerId ? { bookingId, cleanerId } : { bookingId }),
    });
    return result.data as DispatchAssignment;
}

export async function getAssignment(id: string) {
    const result = await authFetch(`/dispatch/${id}`, { method: "GET" });
    return result.data as DispatchAssignment;
}

export async function removeAssignment(id: string) {
    await authFetch(`/dispatch/${id}`, { method: "DELETE" });
}

export async function suggestCleaners(bookingId: string, limit = 5) {
    const result = await authFetch(`/dispatch/suggest?bookingId=${bookingId}&limit=${limit}`, { method: "GET" });
    return result.data as Cleaner[];
}

export type DayRouteStop = {
    bookingId: string;
    address: string;
    scheduledStart: string;
    scheduledEnd: string;
    latitude: number | null;
    longitude: number | null;
};

export type DayRouteLeg = {
    fromBookingId: string;
    toBookingId: string;
    distanceMeters: number | null;
    estimatedDriveSeconds: number | null;
    gapSeconds: number;
    // True when the scheduled gap between the two jobs is tighter than the
    // estimated drive between them — the cleaner is at real risk of
    // arriving late to the second job. See dispatch.service.js#getCleanerDayRoute
    // for how this is computed (not a route optimizer — jobs keep their
    // customer-facing scheduled times; this only flags risk between them).
    isTight: boolean;
};

export type DayRoute = {
    date: string;
    stops: DayRouteStop[];
    legs: DayRouteLeg[];
};

export async function getCleanerDayRoute(cleanerId: string, date: string) {
    const result = await authFetch(`/dispatch/route/${cleanerId}?date=${date}`, { method: "GET" });
    return result.data as DayRoute;
}
