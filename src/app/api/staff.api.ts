import { authFetch } from "./authFetch";
import { StaffMember, StaffRole } from "./cleansera-types";

export async function listStaff() {
    const result = await authFetch(`/businesses/staff`, { method: "GET" });
    return result.data as StaffMember[];
}

export async function inviteStaff(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: StaffRole;
}) {
    const result = await authFetch(`/businesses/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data as StaffMember;
}

export async function updateStaffRole(id: string, role: StaffRole) {
    const result = await authFetch(`/businesses/staff/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
    });
    return result.data as StaffMember;
}

export async function removeStaff(id: string) {
    const result = await authFetch(`/businesses/staff/${id}`, { method: "DELETE" });
    return result.data;
}
