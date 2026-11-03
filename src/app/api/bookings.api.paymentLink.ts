import { authFetch } from "@/app/api/authFetch";

/** Create Stripe Checkout link for a booking. Returns { url, sessionId }. */
export async function createPaymentLink(
  bookingId: string,
  opts?: { successUrl?: string; cancelUrl?: string; currency?: string }
) {
  return authFetch(`/bookings/${bookingId}/payment-link`, {
    method: "POST",
    body: JSON.stringify(opts || {}),
  });
}

export async function pauseRecurring(id: string) {
  return authFetch(`/bookings/recurring/${id}/pause`, { method: "POST" });
}

export async function resumeRecurring(id: string) {
  return authFetch(`/bookings/recurring/${id}/resume`, { method: "POST" });
}
