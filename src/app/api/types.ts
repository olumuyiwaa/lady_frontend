import type { CurrentUser } from "./auth.api";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export type User = CurrentUser;

/** What the sign-in form has to do next. */
export type LoginOutcome =
    | { status: "signed_in" }
    | { status: "two_factor_required" }
    | {
          status: "select_business";
          affiliations: { businessId: string; businessName: string; subdomain: string; role: string }[];
      };

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;

    login: (payload: {
        email: string;
        password: string;
        twoFactorCode?: string;
        businessId?: string;
    }) => Promise<LoginOutcome>;
    logout: () => Promise<void>;

    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export interface NurseCredential {
    id: string;
    type: string;
    status: string;
    expiresAt: string;
}

export interface NurseWallet {
    id: string;
    pendingBalance: number;
    availableBalance: number;
    lifetimeEarnings: number;
}

export interface NurseProfile {
    firstName: string;
    lastName: string;
    designation: string;
    id: string;
    avatarUrl: string;
    bio: string;
    yearsOfExperience: number;
    availabilityRadius: number;
    isAvailable: boolean;
    latitude: number;
    longitude: number;
    credentials: NurseCredential[];
    wallet: NurseWallet;
}

export interface AdminProfile {
    firstName: string;
    lastName: string;
}

// export interface FacilityMember {
//     facilityId: string;
//     jobTitle: string;
//     facility: {
//         id: string;
//         name: string;
//     };
// }

// NOTE: User is now defined above as an alias to CurrentUser (from auth.api),
// matching ladygreener's actual /auth/me response — no adminProfile/
// nurseProfile/facilityMember sub-objects; firstName/lastName/role sit
// directly on the user (businessRole), since Lady Greener users don't have the
// per-role profile split Trabajo Hub's model had.

export type UserRole = "BUSINESS_OWNER" | "BUSINESS_MANAGER" | "CLEANER" | "SUPER_ADMIN" | string;
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | string;
export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;

export type FacilityMemberSummary = {
    facilityId: string;
    firstName?: string | null;
    lastName?: string | null;
    jobTitle: string | null;
};

export type FacilityMemberDetails = FacilityMemberSummary & {
    id: string;
    firstName: string;
    lastName: string;
    officePhone?: string | null;
    isActive: boolean;
    facility?: {
        id: string;
        name: string;
        email: string;
        status: string;
    };
};

export type UserListItem = {
    id: string;
    email: string;
    role: UserRole;
    status: AccountStatus;
    verificationStatus: VerificationStatus;
    createdAt: string;
    adminProfile?: { firstName: string; lastName: string; } | null;
    nurseProfile?: { firstName: string; lastName: string; designation: string; } | null;
    facilityMember?: FacilityMemberSummary | null;
};

export type UserDetails = UserListItem & {
    phone?: string | null;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
    twoFactorEnabled?: boolean;
    lastLoginAt?: string | null;
    updatedAt?: string;
    adminProfile?: {
        id: string;
        firstName: string;
        lastName: string;
        department?: string | null;
        avatarUrl?: string | null;
        createdAt: string;
        updatedAt: string;
    } | null;
    nurseProfile?: {
        id: string;
        firstName: string;
        lastName: string;
        designation: string;
        avatarUrl?: string | null;
        bio?: string | null;
        yearsOfExperience?: number | null;
        availabilityRadius?: number | null;
        isAvailable: boolean;
        backgroundChecked: boolean;
        city?: string | null;
        state?: string | null;
        zipCode?: string | null;
        createdAt: string;
        updatedAt: string;
        credentials?: Array<{
            id: string;
            type: string;
            status: string;
            issuedAt?: string | null;
            expiresAt?: string | null;
            createdAt: string;
        }>;
        wallet?: {
            pendingBalance: string | number;
            availableBalance: string | number;
            lifetimeEarnings: string | number;
        } | null;
    } | null;
    facilityMember?: FacilityMemberDetails | null;
    sessions?: Array<{
        id: string;
        deviceModel?: string | null;
        ipAddress?: string | null;
        createdAt: string;
    }>;
};

export type ShiftStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED" | string;

export type ShiftListItem = {
    id: string;
    caseId: string;
    facilityId: string;
    visitType: string;
    requiredDesignation: string;
    status: ShiftStatus;
    scheduledStart: string;
    scheduledEnd: string;
    payRate: number;
    chargeRate: number;
    isUrgent: boolean;
    isEmergencyFill: boolean;
    period: string;
};

export type ShiftDetails = ShiftListItem & {
    title?: string;
    description?: string;
    specialties?: string[];
    pattern?: string;
    estimatedDuration?: number;
    recurringDays?: number[];
    recurringEndDate?: string;
    billingType?: string;
    case?: {
        id: string;
        publicIdentifier: string;
        facilityId: string;
        visitType: string;
        city: string;
        state: string;
        isOasisCase: boolean;
        isActive: boolean;
        specialties: string[];
        createdAt: string;
    };
    assignments?: Array<{
        id: string;
        nurseProfileId: string;
        status: string;
        acceptedAt: string;
        nurseProfile?: {
            firstName: string;
            lastName: string;
            designation: string;
        };
    }>;
};

export type ShiftCreateForm = {
    facilityId: string;
    caseId: string;
    title: string;
    visitType: string;
    requiredDesignation: string;
    specialties: string;
    pattern: string;
    period: string;
    scheduledStart: string;
    scheduledEnd: string;
    estimatedDuration: string;
    recurringDays: string;
    recurringEndDate: string;
    chargeRate: string;
    payRate: string;
    billingType: string;
    isUrgent: boolean;
    isEmergencyFill: boolean;
    allowInstantBook: boolean;
    internalNotes: string;
};

export type VisitStatus =
    | "SCHEDULED"
    | "CHECKED_IN"
    | "CHECKED_OUT"
    | "VERIFIED"
    | "FLAGGED"
    | "OVERRIDE_REQUESTED"
    | "OVERRIDE_APPROVED"
    | string;

// export type NurseProfileSummary = {
//     firstName: string;
//     lastName: string;
//     designation?: string;
// };

export type VisitAuditEvent = {
    id: string;
    action: string;
    createdAt: string;
    performedBy?: {
        email: string;
        adminProfile?: { firstName: string; lastName: string } | null;
        nurseProfile?: { firstName: string; lastName: string } | null;
        facilityMember?: { firstName: string; lastName: string } | null;
    } | null;
};

export type VisitCaseSummary = {
    id?: string;
    publicIdentifier: string;
    city?: string | null;
    state?: string | null;
    addressLine1?: string;
    addressLine2?: string | null;
    zipCode?: string;
    primaryDiagnosis?: string | null;
    notes?: string | null;
};

export type VisitShiftSummary = {
    id?: string;
    scheduledStart: string;
    scheduledEnd: string;
    visitType: string;
    title?: string | null;
    description?: string | null;
    requiredDesignation?: string;
    case?: VisitCaseSummary;
};

// The backend returns assignment.shift, not a top-level shift field.
// assignment is always included; shift lives one level deeper.
export type VisitAssignment = {
    id?: string;
    shiftId?: string;
    nurseProfileId?: string;
    status?: string;
    shift?: VisitShiftSummary;
};

export type Visit = {
    id: string;
    assignmentId: string;
    nurseProfileId: string;
    shiftId: string;
    status: string;

    // Check-in/out data
    checkInTime?: string | null;
    checkInLatitude?: number | null;
    checkInLongitude?: number | null;
    checkInDistance?: number | null;
    checkOutTime?: string | null;
    checkOutLatitude?: number | null;
    checkOutLongitude?: number | null;
    checkOutDistance?: number | null;
    durationMinutes?: number | null;

    // Flags & Notes
    signatureUrl?: string | null;
    overrideRequired: boolean;
    overrideReason?: string | null;
    overrideApprovedById?: string | null;
    overrideApprovedAt?: string | null;
    notes?: string | null;

    createdAt: string;
    updatedAt: string;

    // These must match the JSON structure
    nurseProfile: {
        firstName: string;
        lastName: string;
        designation: string
    };

    assignment: {
        id: string;
        shift: {
            scheduledStart: string;
            scheduledEnd: string;
            visitType: string;
            case: {
                publicIdentifier: string;
                city: string;
                state: string;
            };
        };
    };

    auditEvents: VisitAuditEvent[];
};

export type NotificationItem = {
    id: string;
    userId: string;
    type: string;
    channel: string;
    title: string;
    body: string;
    data?: unknown;
    isRead: boolean;
    readAt?: string | null;
    sentAt?: string | null;
    createdAt: string;
};


export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID" | string;

export type PayoutStatus = "PENDING" | "SETTLED" | "FAILED" | string;

export type FacilitySummary = {
    id: string;
    name: string;
    email: string;
    status?: string;
};

export type InvoiceLineItem = {
    id?: string;
    invoiceId?: string;
    shiftId?: string | null;
    description: string;
    quantity: number | string;
    unitRate: number | string;
    amount?: number | string;
    createdAt?: string;
};

export type Invoice = {
    id: string;
    facilityId: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    periodStart: string;
    periodEnd: string;
    subtotal: number | string;
    tax: number | string;
    total: number | string;
    stripeInvoiceId?: string | null;
    stripePaymentIntentId?: string | null;
    paidAt?: string | null;
    dueAt?: string | null;
    fileUrl?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    facility?: FacilitySummary;
    lineItems?: InvoiceLineItem[];
};

export type Payout = {
    id: string;
    nurseProfileId: string;
    walletId: string;
    shiftId?: string | null;
    grossCharge: number | string;
    netPayout: number | string;
    systemCommission: number | string;
    stripeTransferId?: string | null;
    status: PayoutStatus;
    notes?: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt: string;
    nurseProfile?: {
        firstName: string;
        lastName: string;
    };
};

export type BillingSummary = {
    outstanding: {
        total: number | string;
        count: number;
    };
    paid: {
        total: number | string;
        count: number;
    };
    upcoming: Array<{
        invoiceNumber: string;
        total: number | string;
        dueAt?: string | null;
    }>;
};

export type VisitType =
    | "ADMISSION"
    | "REGULAR"
    | "RESUMPTION_OF_CARE"
    | "RECERTIFICATION"
    | "SUPERVISORY"
    | "DISCHARGE"
    | string;

export type OasisType =
    | "ADMISSION"
    | "RESUMPTION_OF_CARE"
    | "RECERTIFICATION"
    | "DISCHARGE"
    | string;

export type CaseListItem = {
    id: string;
    facilityId: string;
    publicIdentifier: string;
    patientFirstName?: string | null;
    patientLastName?: string | null;
    dateOfBirth?: string | null;
    primaryDiagnosis?: string | null;
    notes?: string | null;

    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number | null;
    longitude?: number | null;

    isOasisCase: boolean;
    oasisType?: OasisType | null;
    visitType: VisitType;
    specialties: string[];
    isActive: boolean;

    createdAt: string;
    updatedAt: string;

    facility?: {
        name: string;
    };

    _count?: {
        shifts: number;
    };
};

export type CaseDetails = CaseListItem & {
    facility?: {
        id: string;
        name: string;
    };

    shifts?: Array<{
        id: string;
        title?: string | null;
        visitType: string;
        requiredDesignation: string;
        status: string;
        scheduledStart: string;
        scheduledEnd: string;
        payRate: string | number;
        chargeRate: string | number;
        assignments?: Array<{
            id: string;
            status: string;
            nurseProfile?: {
                firstName: string;
                lastName: string;
            };
        }>;
    }>;
};

export type CaseCreateForm = {
    facilityId: string;
    patientFirstName: string;
    patientLastName: string;
    dateOfBirth: string;
    primaryDiagnosis: string;
    notes: string;

    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: string;
    longitude: string;

    visitType: string;
    specialties: string;
    isOasisCase: boolean;
    oasisType: string;
};

export type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | string;

export type CredentialType =
    | "STATE_LICENSE"
    | "CPR_CERTIFICATION"
    | "TB_TEST"
    | "BACKGROUND_CHECK"
    | "GOVERNMENT_ID"
    | "OIG_CHECK"
    | "SAM_CHECK"
    | "IMMUNIZATION"
    | "WORK_AUTHORIZATION"
    | "CUSTOM"
    | string;

export type NurseProfileSummary = {
    id?: string | null;
    userId?: string | null;
    firstName: string;
    lastName: string;
    designation?: string | null;
    avatarUrl?: string | null;
    user?: {
        id?: string;
        email?: string;
    };
};

export type CredentialListItem = {
    id: string;
    nurseProfileId: string;
    type: CredentialType;
    customLabel?: string | null;
    fileUrl?: string;
    fileKey?: string;
    status: CredentialStatus;
    issuedAt?: string | null;
    expiresAt?: string | null;
    rejectionReason?: string | null;
    reviewedById?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    nurseProfile?: NurseProfileSummary;
};

export type CredentialDetails = CredentialListItem & {
    downloadUrl?: string;
};

export type ExpiringCredential = CredentialListItem & {
    nurseProfile?: {
        firstName: string;
        lastName: string;
        user?: {
            email?: string;
        };
    };
};


export type FacilityListItem = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: AccountStatus;
    logoUrl?: string | null;
    logoKey?: string | null;
    logoSignedUrl?: string | null;
    createdAt: string;
    _count?: {
        members: number;
        cases: number;
    };
};

export type FacilityAddress = {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
    isPrimary: boolean;
};

export type FacilityBilling = {
    id: string;
    billingName: string;
    billingEmail: string;
    billingPhone?: string | null;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
};

export type WorkplaceRequirement = {
    id: string;
    credentialType: string;
    customLabel?: string | null;
    isMandatory: boolean;
    appliesToRoles: string[];
    notes?: string | null;
};

export type FacilityMember = {
    id?: string | null;
    userId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    jobTitle?: string | null;
    officePhone?: string | null;
    isActive?: boolean | null;
    user?: {
        email: string;
        status: string;
    };
    facilityId?: string | null;
    facility?: {
        id: string;
        name: string;
    };
};

export type StaffingPreference = {
    id?: string;
    preferredDesignations: string[];
    maxRadiusMiles?: number | null;
    autoApproveBookings: boolean;
};

export type NotificationPreference = {
    id?: string;
    emailOnNewBooking: boolean;
    emailOnCancellation: boolean;
    emailOnVisitComplete: boolean;
    smsOnEmergencyFill: boolean;
    pushEnabled: boolean;
};

export type FacilityDetails = FacilityListItem & {
    slug?: string;
    taxId?: string | null;
    npiNumber?: string | null;
    updatedAt?: string;
    addresses?: FacilityAddress[];
    billingInfo?: FacilityBilling | null;
    requirements?: WorkplaceRequirement[];
    members?: FacilityMember[];
    staffingPreferences?: StaffingPreference | null;
    notificationPrefs?: NotificationPreference | null;
};

export type CreateFacilityForm = {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    npiNumber: string;
    adminFirstName: string;
    adminLastName: string;
    adminPassword: string;
};

export type FacilityEditForm = {
    name: string;
    phone: string;
    taxId: string;
    npiNumber: string;
};

export type AddressForm = {
    label: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isPrimary: boolean;
};

export type BillingForm = {
    billingName: string;
    billingEmail: string;
    billingPhone: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
};

export type RequirementForm = {
    credentialType: string;
    customLabel: string;
    isMandatory: boolean;
    appliesToRoles: string;
    notes: string;
};

export type MemberForm = {
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    facilityId?: string | null;
    lastMessageAt?: string | null;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
    messages?: Array<{
        content?: string | null;
        createdAt: string;
        senderId: string;
        attachmentType?: string | null;
    }>;
    participants?: {
        id: string;
        email: string;
        role: string;
        adminProfile?: {
            firstName: string;
            lastName: string;
        } | null;
        nurseProfile?: {
            firstName: string;
            lastName: string;
        } | null;
        facilityMember?: {
            firstName: string;
            lastName: string;
            jobTitle?: string | null;
        } | null;
    }[];
};

export type MessageSender = {
    id: string;
    role: string;
    adminProfile?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string | null;
    } | null;
    cleanerProfile?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string | null;
    } | null;
};

export type Message = {
    id: string;
    conversationId: string;
    senderId: string;
    content?: string | null;
    attachmentUrl?: string | null;
    attachmentKey?: string | null;
    attachmentType?: string | null;
    attachmentSignedUrl?: string | null;
    status: "SENT" | "DELIVERED" | "READ" | string;
    readAt?: string | null;
    createdAt: string;
    sender?: MessageSender;
};

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

export function getUserDisplayName(user: User | null): string {
    if (!user) return "";
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
}
export function getUserInitials(user: User | null): string {
    if (!user) return "";
    const first = user.firstName?.charAt(0) ?? "";
    const last = user.lastName?.charAt(0) ?? "";
    return `${first}${last}`.toUpperCase() || (user.email?.charAt(0).toUpperCase() ?? "");
}
export function getUserRole(user: User | null): string {
    if (!user) return "";
    if (user.globalRole === "SUPER_ADMIN") return "SUPER_ADMIN";
    return user.businessRole || "";
}

export function getBusinessId(user: User | null): string | null {
    return user?.businessId ?? null;
}