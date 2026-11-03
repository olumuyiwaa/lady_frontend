import { authFetch } from "./authFetch";
import { Customer, CustomerAddress } from "./cleansera-types";

export async function listCustomersForBooking(q?: string) {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    const result = await authFetch(`/customers${qs}`, { method: "GET" });
    return result.data as Customer[];
}

export async function addCustomerAddress(
    customerId: string,
    payload: {
        label?: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode?: string;
        latitude?: number;
        longitude?: number;
        isPrimary?: boolean;
    }
) {
    const result = await authFetch(`/customers/${customerId}/addresses`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data as CustomerAddress;
}

export async function updateCustomerAddress(
    customerId: string,
    addressId: string,
    patch: Partial<CustomerAddress>
) {
    const result = await authFetch(`/customers/${customerId}/addresses/${addressId}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
    return result.data as CustomerAddress;
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
    const result = await authFetch(`/customers/${customerId}/addresses/${addressId}`, {
        method: "DELETE",
    });
    return result.data;
}


export async function listCustomers(params: { q?: string; take?: number } = {}) {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.take) q.set("take", String(params.take));
    return authFetch(`/customers?${q}`);
}

export async function getCustomer(id: string) {
    return authFetch(`/customers/${id}`);
}

export async function createCustomer(body: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    notes?: string;
    address?: { line1: string; city: string; state: string; line2?: string; postalCode?: string };
}) {
    return authFetch(`/customers`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateCustomer(id: string, body: Record<string, unknown>) {
    return authFetch(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteCustomer(id: string) {
    return authFetch(`/customers/${id}`, { method: "DELETE" });
}

export async function addAddress(customerId: string, body: Record<string, unknown>) {
    return authFetch(`/customers/${customerId}/addresses`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAddress(customerId: string, addressId: string, body: Record<string, unknown>) {
    return authFetch(`/customers/${customerId}/addresses/${addressId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function deleteAddress(customerId: string, addressId: string) {
    return authFetch(`/customers/${customerId}/addresses/${addressId}`, { method: "DELETE" });
}
