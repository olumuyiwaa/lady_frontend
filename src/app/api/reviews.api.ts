import { authFetch } from "@/app/api/authFetch";

export async function listReviews() {
  return authFetch(`/reviews`);
}

export async function getReview(id: string) {
  return authFetch(`/reviews/${id}`);
}

export async function deleteReview(id: string) {
  return authFetch(`/reviews/${id}`, { method: "DELETE" });
}
