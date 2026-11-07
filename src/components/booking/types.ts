import type { Answers, BookingQuestion } from "@/lib/bookingQuestions";
import { getActiveCurrency } from "@/app/services/currency";
import type {
  WidgetService,
  WidgetBusiness,
  QuoteResponse,
  StorefrontPayment,
  StorefrontCancellationPolicy,
} from "@/app/api/widget.api";

export type Frequency = "ONE_TIME" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type BookingFormState = {
  // Step 1 – Service & scope
  serviceId: string | null;
  frequency: Frequency;
  rooms: number;
  bathrooms: number;
  sqft: number;
  addOnIds: string[];

  // Step 2 – Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  serviceAreaOk: boolean | null; // null = not checked yet

  // Step 3 – Schedule
  selectedDate: string; // YYYY-MM-DD
  scheduledStart: string | null; // ISO

  // Step 4 – Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Consent to receive booking messages on WhatsApp. Off unless ticked. */
  whatsappOptIn: boolean;
  notes: string;
  /** Answers to the business's custom questions, keyed by question id. */
  answers: Answers;
  couponCode: string;
  giftCardCode: string;

  // Live quote
  quote: QuoteResponse | null;
  quoteLoading: boolean;
  quoteError: string | null;
};

export type BookingWizardProps = {
  slug: string;
  business: WidgetBusiness;
  services: WidgetService[];
  payment?: StorefrontPayment | null;
  cancellationPolicy?: StorefrontCancellationPolicy | null;
  /** The business's own questions, asked on the details step. */
  questions?: BookingQuestion[];
  /**
   * Render for the compact modal context (BookingWidgetModal) instead of a
   * full page (book-now/[slug]): no duplicate business header (the modal
   * chrome already shows it), tighter spacing, and the price/continue bar
   * flows inline with the card instead of pinning to the viewport bottom —
   * a viewport-fixed bar would float outside the modal panel.
   */
  compact?: boolean;
  /** Postcode the visitor already checked on the storefront; prefilled so they don't type it twice. */
  initialPostalCode?: string;
};

export const INITIAL_STATE: BookingFormState = {
  serviceId: null,
  frequency: "ONE_TIME",
  rooms: 2,
  bathrooms: 1,
  sqft: 0,
  addOnIds: [],

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  serviceAreaOk: null,

  selectedDate: "",
  scheduledStart: null,

  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  whatsappOptIn: false,
  notes: "",
  answers: {},
  couponCode: "",
  giftCardCode: "",

  quote: null,
  quoteLoading: false,
  quoteError: null,
};

export const STEPS = [
  { id: 1, key: "service", label: "Service" },
  { id: 2, key: "address", label: "Address" },
  { id: 3, key: "schedule", label: "Schedule" },
  { id: 4, key: "details", label: "Your details" },
  { id: 5, key: "review", label: "Confirm" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function formatMoney(cents: number, currency: string = getActiveCurrency()) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function frequencyLabel(f: Frequency, t: (key: string) => string) {
  switch (f) {
    case "WEEKLY":
      return t("weekly");
    case "BIWEEKLY":
      return t("biweekly");
    case "MONTHLY":
      return t("monthly");
    default:
      return t("oneTime");
  }
}

/**
 * Matches next-intl's actual translator call signature (values are
 * string | number | Date, not arbitrary unknown) — declared here rather
 * than importing next-intl's own type so cancellationPolicyLabel and
 * cancellationBadgeLabel stay plain functions callable with any
 * next-intl-produced `t`, scoped or not.
 */
type Translator = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Renders this business's real cancellation policy — never a hardcoded
 * window. `null`/missing windowHours means the business hasn't configured
 * one, which cancellationPolicy.js on the backend treats as "free
 * cancellation any time"; this must say the same thing, since it's the
 * customer's only preview of what cancelling will actually cost them.
 *
 * `t` must be a next-intl translator scoped to the `Booking.cancellationPolicy`
 * namespace (e.g. `useTranslations("Booking.cancellationPolicy")`) — this
 * stays a plain function rather than a hook itself so it can be called from
 * anywhere a scoped `t` is already in scope, same as frequencyLabel above.
 */
export function cancellationPolicyLabel(
  policy: StorefrontCancellationPolicy | null | undefined,
  t: Translator
): string {
  if (!policy || policy.windowHours == null) {
    return t("freeAnytime");
  }
  const hours = policy.windowHours;
  const window =
    hours % 24 === 0 && hours >= 24
      ? t("windowDays", { count: hours / 24 })
      : t("windowHours", { count: hours });
  const feeText =
    policy.feeType === "PERCENT"
      ? t("feePercent", { value: policy.feeValue ?? 0 })
      : policy.feeType === "AMOUNT" && policy.feeValue != null
        ? t("feeAmount", { value: formatMoney(policy.feeValue) })
        : t("feeGeneric");
  return t("policyWithFee", { window, feeText });
}

/**
 * Short trust-badge version of the same policy cancellationPolicyLabel
 * renders in full sentence form on the review step — for the summary
 * sidebar's compact bullet list, not the legal-copy paragraph. Same
 * null-window-means-free-anytime rule, same reason it must never be a
 * hardcoded default: StickySummary had its own independent "Free
 * cancellation (12h+)" hardcoded string that cancellationPolicyLabel's
 * introduction (see StepReview.tsx) never touched, because it's a
 * separate component reading the same policy data.
 */
export function cancellationBadgeLabel(
  policy: StorefrontCancellationPolicy | null | undefined,
  t: Translator
): string {
  if (!policy || policy.windowHours == null) {
    return t("badgeFreeAnytime");
  }
  const hours = policy.windowHours;
  const window =
    hours % 24 === 0 && hours >= 24
      ? t("windowDays", { count: hours / 24 })
      : t("windowHours", { count: hours });
  return t("badgeWithWindow", { window });
}
