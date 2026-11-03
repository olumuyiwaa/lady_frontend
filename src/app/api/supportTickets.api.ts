import { authFetch } from "@/app/api/authFetch";

export async function listTickets(params: Record<string, string | number | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  return authFetch(`/support-tickets?${q}`);
}

export async function getTicket(id: string) {
  return authFetch(`/support-tickets/${id}`);
}

export async function createTicket(body: {
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  customerId?: string;
  bookingId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  return authFetch(`/support-tickets`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateTicket(id: string, body: Record<string, unknown>) {
  return authFetch(`/support-tickets/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function addTicketMessage(id: string, body: string, isInternal = false) {
  return authFetch(`/support-tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, isInternal }),
  });
}

export async function deleteTicket(id: string) {
  return authFetch(`/support-tickets/${id}`, { method: "DELETE" });
}
