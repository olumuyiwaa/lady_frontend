import { authFetch } from "@/app/api/authFetch";

export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED" | "CANCELLED";

export type WaitlistEntry = {
  id: string;
  businessId: string;
  customerId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  serviceId?: string | null;
  desiredStart: string;
  desiredEnd: string;
  notes?: string | null;
  status: WaitlistStatus;
  notifiedAt?: string | null;
  createdAt: string;
  customer?: { firstName: string; lastName: string } | null;
  service?: { name: string } | null;
};

export async function listWaitlist(status?: WaitlistStatus) {
  const qs = status ? `?status=${status}` : "";
  return authFetch(`/waitlist${qs}`);
}

export async function cancelWaitlistEntry(id: string) {
  return authFetch(`/waitlist/${id}/cancel`, { method: "POST" });
}
