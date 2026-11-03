import { authFetch } from "./authFetch";
import type { BookingQuestionType } from "@/lib/bookingQuestions";

/** A question as managed by the business (includes inactive ones). */
export type ManagedQuestion = {
  id: string;
  label: string;
  helpText: string | null;
  type: BookingQuestionType;
  options: string[];
  required: boolean;
  serviceIds: string[];
  sortOrder: number;
  isActive: boolean;
};

export type QuestionInput = {
  label: string;
  helpText?: string;
  type: BookingQuestionType;
  options?: string[];
  required?: boolean;
  serviceIds?: string[];
  isActive?: boolean;
  sortOrder?: number;
};

export async function listBookingQuestions(): Promise<ManagedQuestion[]> {
  const result = await authFetch("/booking-questions", { method: "GET" });
  return (result.data?.questions ?? []) as ManagedQuestion[];
}

export async function createBookingQuestion(input: QuestionInput): Promise<ManagedQuestion> {
  const result = await authFetch("/booking-questions", { method: "POST", body: JSON.stringify(input) });
  return result.data as ManagedQuestion;
}

export async function updateBookingQuestion(id: string, patch: Partial<QuestionInput>): Promise<ManagedQuestion> {
  const result = await authFetch(`/booking-questions/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  return result.data as ManagedQuestion;
}

export async function deleteBookingQuestion(id: string): Promise<void> {
  await authFetch(`/booking-questions/${id}`, { method: "DELETE" });
}
