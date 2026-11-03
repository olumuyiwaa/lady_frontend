import { getActiveCurrency } from "@/app/services/currency";
// Types matching ladygreener's Prisma schema and API response shapes.
// Kept separate from the original template's types.ts (still used by the
// generic messages/calendar/notifications/support-tickets pages) to avoid
// touching working code those pages depend on.

export type CleanerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "OFFBOARDED";

export type Cleaner = {
    id: string;
    businessId: string;
    userId: string;
    status: CleanerStatus;
    hireDate: string | null;
    offboardedAt: string | null;
    offboardedReason: string | null;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    };
};

export type AvailabilitySlot = {
    dayOfWeek: number; // 0=Sun..6=Sat
    startTime: string; // "HH:MM"
    endTime: string;
};

export type PricingModel = "FLAT" | "PER_SQFT" | "PER_ROOM" | "HOURLY";

export type ServiceAddOn = {
    id: string;
    name: string;
    priceCents: number;
    extraMinutes: number;
};

export type Service = {
    id: string;
    businessId: string;
    name: string;
    description: string | null;
    pricingModel: PricingModel;
    basePriceCents: number;
    estimatedMinutes: number;
    isActive: boolean;
    addOns: ServiceAddOn[];
};

export type Customer = {
    id: string;
    businessId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    notes: string | null;
    addresses?: CustomerAddress[];
};

export type CustomerAddress = {
    id: string;
    customerId: string;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    isPrimary: boolean;
};

export type BookingStatus =
    | "REQUESTED"
    | "CONFIRMED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type BookingAssignment = {
    id: string;
    bookingId: string;
    cleanerId: string;
    assignedAt: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    cleaner?: Cleaner;
};

export type Booking = {
    id: string;
    businessId: string;
    customerId: string;
    serviceId: string;
    recurringScheduleId: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    scheduledStart: string;
    scheduledEnd: string;
    status: BookingStatus;
    quotedPriceCents: number;
    paymentStatus: "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED";
    paymentNote: string | null;
    cancelReason: string | null;
    postalCode?: string | null;
    accessCode?: string | null;
    keyLocation?: string | null;
    parkingInstructions?: string | null;
    petNotes?: string | null;
    specialInstructions?: string | null;
    /** Snapshot of the business's custom questions as answered at booking time. */
    customAnswers?: Array<{ questionId: string; label: string; type: string; value: unknown }> | null;
    createdAt: string;
    customer?: Customer;
    service?: Service;
    assignments?: BookingAssignment[];
};

export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type RecurringScheduleStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export type RecurringSchedule = {
    id: string;
    businessId: string;
    customerId: string;
    serviceId: string;
    customerAddressId: string | null;
    frequency: RecurrenceFrequency;
    dayOfWeek: number;
    startTime: string;
    status: RecurringScheduleStatus;
    nextRunDate: string;
    customer?: Customer;
    service?: Service;
};

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export type SubscriptionPlan = {
    id: string;
    name: string;
    maxCleaners: number | null;
    monthlyPriceCents: number;
    features: Record<string, unknown> | null;
    isActive: boolean;
};

export type BusinessSubscription = {
    id: string;
    businessId: string;
    planId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
    plan: SubscriptionPlan;
};

export type BusinessMemberRole = "BUSINESS_OWNER" | "BUSINESS_MANAGER";
export type PreferredPaymentCollection = "ONLINE_CARD" | "MANUAL_OFFLINE" | "BOTH";

export type Business = {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    timezone: string;
    defaultLocale?: "nl" | "en";
    isActive: boolean;
    preferredPaymentCollection?: PreferredPaymentCollection;
    offlinePaymentInstructions?: string | null;
    /** ISO 4217 code the business charges in, e.g. "eur". */
    currency?: string;
    // Invoicing / BTW (prices are VAT-inclusive)
    legalName?: string | null;
    kvkNumber?: string | null;
    vatNumber?: string | null;
    invoiceIban?: string | null;
    vatRateBps?: number;
    /** Where website contact-form messages are delivered (private) and the Reply-To on replies. */
    contactEmail?: string | null;
    /** Shown on the storefront. */
    contactPhone?: string | null;
    branding?: {
        logoKey: string | null;
        primaryColor: string | null;
        accentColor: string | null;
        tagline: string | null;
    } | null;
};

export function formatMoney(cents: number, currency: string = getActiveCurrency()) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export function cleanerDisplayName(c: Cleaner) {
    return `${c.user.firstName} ${c.user.lastName}`.trim();
}

// ---- Staff (BusinessMember) ----

export type StaffRole = "BUSINESS_OWNER" | "BUSINESS_MANAGER" | "ORG_ADMIN";

export type StaffMember = {
    id: string;
    businessId: string;
    userId: string;
    role: StaffRole;
    isActive: boolean;
    invitedByUserId: string | null;
    invitedAt: string;
    joinedAt: string | null;
    removedAt: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    };
};

export function staffDisplayName(m: StaffMember) {
    return `${m.user.firstName} ${m.user.lastName}`.trim();
}

// ---- Payroll ----

export type CompensationType = "PERCENT" | "FLAT_PER_JOB" | "HOURLY";

export type CleanerCompensation = {
    id: string;
    businessId: string;
    cleanerId: string;
    type: CompensationType;
    value: number;
    updatedAt: string;
    createdAt: string;
    cleaner: {
        id: string;
        userId: string;
        user: { firstName: string; lastName: string; email: string };
    };
};

export type EarningStatus = "PENDING" | "IN_PAYOUT" | "PAID" | "VOIDED";

export type CleanerEarning = {
    id: string;
    businessId: string;
    cleanerId: string;
    bookingId: string;
    amountCents: number;
    compensationType: CompensationType;
    compensationValue: number;
    status: EarningStatus;
    payoutId: string | null;
    earnedAt: string;
    booking?: { id: string; scheduledAt: string; quotedPriceCents: number };
};

export type PayoutStatus = "PENDING" | "PAID" | "CANCELED";

export type Payout = {
    id: string;
    businessId: string;
    cleanerId: string;
    periodStart: string;
    periodEnd: string;
    totalCents: number;
    status: PayoutStatus;
    method: string | null;
    reference: string | null;
    // Set only when method === "STRIPE" — the Stripe Transfer id, for
    // support/audit lookups against the business's Connect dashboard.
    stripeTransferId: string | null;
    paidAt: string | null;
    createdAt: string;
    cleaner: {
        id: string;
        userId: string;
        // stripePayoutsEnabled gates whether "Pay via Stripe" is offered for
        // this payout — false until the cleaner has completed Connect
        // onboarding on their own end (see cleaner-app payout-connect screen).
        user: { firstName: string; lastName: string; stripePayoutsEnabled: boolean };
    };
};

export function compensationLabel(c: { type: CompensationType; value: number }) {
    if (c.type === "PERCENT") return `${c.value}% per job`;
    if (c.type === "FLAT_PER_JOB") return `${formatMoney(c.value)} per job`;
    return `${formatMoney(c.value)} / hour`;
}

