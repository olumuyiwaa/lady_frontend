import { authFetch } from "./authFetch";
import { PricingModel, Service } from "./cleansera-types";

export async function listServices() {
    const result = await authFetch(`/services`, { method: "GET" });
    return result.data as Service[];
}

export async function createService(payload: {
    name: string;
    description?: string;
    pricingModel: PricingModel;
    basePriceCents: number;
    estimatedMinutes: number;
}) {
    const result = await authFetch(`/services`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data as Service;
}

export async function updateService(id: string, patch: Partial<Service>) {
    const result = await authFetch(`/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
    return result.data as Service;
}

export async function deleteService(id: string) {
    await authFetch(`/services/${id}`, { method: "DELETE" });
}

export async function addServiceAddOn(
    serviceId: string,
    payload: { name: string; priceCents?: number; extraMinutes?: number }
) {
    const result = await authFetch(`/services/${serviceId}/addons`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data;
}

export async function updateServiceAddOn(
    serviceId: string,
    addOnId: string,
    patch: { name?: string; priceCents?: number; extraMinutes?: number }
) {
    const result = await authFetch(`/services/${serviceId}/addons/${addOnId}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
    return result.data;
}

export async function deleteServiceAddOn(serviceId: string, addOnId: string) {
    await authFetch(`/services/${serviceId}/addons/${addOnId}`, { method: "DELETE" });
}
