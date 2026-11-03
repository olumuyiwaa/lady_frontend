/**
 * Custom booking questions: pure helpers shared by the booking form.
 * The server re-validates everything; this keeps the form honest and quick.
 */

export type BookingQuestionType = "TEXT" | "LONG_TEXT" | "SELECT" | "MULTI_SELECT" | "YES_NO" | "NUMBER";

export type BookingQuestion = {
  id: string;
  label: string;
  helpText: string | null;
  type: BookingQuestionType;
  options: string[];
  required: boolean;
  /** Empty = asked for every service. */
  serviceIds: string[];
};

export type AnswerValue = string | string[] | boolean | number;
export type Answers = Record<string, AnswerValue>;
export type AnswerPayload = { questionId: string; value: AnswerValue };

/** Questions that apply to the chosen service. */
export function applicableQuestions(questions: BookingQuestion[] | null | undefined, serviceId: string | null): BookingQuestion[] {
  if (!questions) return [];
  return questions.filter((q) => q.serviceIds.length === 0 || (serviceId !== null && q.serviceIds.includes(serviceId)));
}

/** "No" and 0 are real answers; blank text and an empty selection are not. */
export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true; // boolean
}

/** Required questions still unanswered. */
export function missingRequired(questions: BookingQuestion[], answers: Answers): BookingQuestion[] {
  return questions.filter((q) => q.required && !isAnswered(answers[q.id]));
}

/** Answers to send: only for questions that apply, and only those answered. */
export function toAnswerPayload(questions: BookingQuestion[], answers: Answers): AnswerPayload[] {
  return questions
    .filter((q) => isAnswered(answers[q.id]))
    .map((q) => ({
      questionId: q.id,
      value: typeof answers[q.id] === "string" ? (answers[q.id] as string).trim() : answers[q.id],
    }));
}

/** Human-readable value, for showing a stored answer. */
export function formatAnswer(value: unknown, yes = "Yes", no = "No"): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? yes : no;
  return value === null || value === undefined ? "" : String(value);
}

/** Dutch postcode, used to decide when to send the code with a quote. */
export function normalizedDutchPostcode(value: string): string | undefined {
  const v = value.trim();
  return /^[1-9]\d{3}\s?[A-Za-z]{2}$/.test(v) ? v.replace(/\s/g, "").toUpperCase() : undefined;
}
