import { authFetch } from "@/app/api/authFetch";

export type GiftCard = {
  id: string;
  businessId: string;
  code: string;
  initialValueCents: number;
  balanceCents: number;
  purchasedByCustomerId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  message?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  purchasePaidAt?: string | null;
  createdAt: string;
};

export async function listGiftCards() {
  return authFetch(`/businesses/pricing/gift-cards`);
}

export async function issueGiftCard(body: {
  code?: string;
  initialValueCents: number;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  expiresAt?: string;
}) {
  return authFetch(`/businesses/pricing/gift-cards`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deactivateGiftCard(id: string) {
  return authFetch(`/businesses/pricing/gift-cards/${id}`, { method: "DELETE" });
}
