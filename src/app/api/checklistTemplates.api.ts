import { authFetch } from "./authFetch";

export type ChecklistItem = {
    label: string;
    done: boolean;
};

export type ChecklistTemplate = {
    id: string;
    businessId: string;
    name: string;
    items: ChecklistItem[];
    createdAt: string;
    updatedAt: string;
};

export async function listChecklistTemplates() {
    const result = await authFetch(`/checklist-templates`, { method: "GET" });
    return result.data as ChecklistTemplate[];
}

export async function getChecklistTemplate(id: string) {
    const result = await authFetch(`/checklist-templates/${id}`, {
        method: "GET",
    });
    return result.data as ChecklistTemplate;
}

export async function createChecklistTemplate(payload: {
    name: string;
    items: ChecklistItem[];
}) {
    const result = await authFetch(`/checklist-templates`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return result.data as ChecklistTemplate;
}

export async function updateChecklistTemplate(
    id: string,
    patch: { name?: string; items?: ChecklistItem[] }
) {
    const result = await authFetch(`/checklist-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
    return result.data as ChecklistTemplate;
}

export async function deleteChecklistTemplate(id: string) {
    await authFetch(`/checklist-templates/${id}`, { method: "DELETE" });
}
