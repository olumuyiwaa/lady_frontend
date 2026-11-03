export const FAQ_ITEMS = [
    {
        category: "Account & Access",
        icon: "🔐",
        items: [
            {
                q: "How do I reset my password?",
                a: "Go to the login page.tsx and click 'Forgot password'. Enter your registered email address and we'll send you a secure reset link valid for 1 hour. If you don't receive it within a few minutes, check your spam folder or contact support.",
            },
            {
                q: "Why is my account showing as 'Pending'?",
                a: "New accounts require email verification before activation. Check your inbox for a verification email. If you're a cleaner, your profile also needs credential review by our compliance team before your account is fully activated.",
            },
            {
                q: "How do I enable two-factor authentication?",
                a: "Navigate to Settings → Security → Two-Factor Authentication. You'll need an authenticator app (Google Authenticator or Authy). Scan the QR code shown, enter the 6-digit code to confirm, and 2FA will be enabled.",
            },
            {
                q: "Can I manage multiple device sessions?",
                a: "Yes. Under Settings → Security → Active Sessions, you can view all devices currently logged into your account and revoke access to any of them individually, or sign out of all devices at once.",
            },
        ],
    },
    {
        category: "Credentials & Compliance",
        icon: "📋",
        items: [
            {
                q: "What documents do I need to upload?",
                a: "All cleaners require at minimum: State Nursing License, CPR Certification, TB Test, Background Check, and Government ID. Some facilities may require additional documents such as OIG/SAM checks, immunisation records, or work authorisation. Check your credential dashboard for a complete list.",
            },
            {
                q: "How long does credential review take?",
                a: "Standard review takes 1–3 business days. You'll receive an email and push notification when each document is approved or if any action is required. Urgent cases can be escalated by contacting support.",
            },
            {
                q: "My credential was rejected — what do I do?",
                a: "Open the rejected credential in your dashboard to see the specific rejection reason. Common issues include blurry scans, expired documents, or mismatched name fields. Re-upload a clear, updated copy and it will be re-reviewed.",
            },
            {
                q: "I will receive alerts before my credentials expire?",
                a: "Yes. You'll receive automated email and push notifications at 60 days, 30 days, 14 days, and 7 days before any approved credential expires. You can upload a renewal at any point and it will be reviewed before the expiry date.",
            },
        ],
    },
    {
        category: "Shifts & Scheduling",
        icon: "📅",
        items: [
            {
                q: "How does shift booking work?",
                a: "Open shifts appear on your Marketplace screen filtered to your designation and location. Tap a shift to view full details including pay rate, case notes, and required specialties. Tap 'Book Shift' to claim it instantly — our system prevents double-booking automatically.",
            },
            {
                q: "Can I cancel a shift I've already booked?",
                a: "Yes, but please do so as early as possible so the business can find a replacement. Navigate to My Shifts, select the shift, and tap Cancel. Frequent last-minute cancellations may affect your performance score.",
            },
            {
                q: "What is the geofence check-in radius?",
                a: "You must be within 200 metres of the patient's address to check in via GPS. If you're flagged as outside this radius, an override request is automatically sent to the business administrator for manual approval.",
            },
            {
                q: "What happens if I miss a check-in?",
                a: "If you were present but couldn't check in electronically, contact your business administrator immediately. They can process a manual visit record and approve the override on their dashboard. Always document the reason in your visit notes.",
            },
        ],
    },
    {
        category: "Payments & Billing",
        icon: "💳",
        items: [
            {
                q: "When do I get paid?",
                a: "Payouts are processed after each shift is verified and marked complete. Funds typically arrive in your linked bank account within 2–5 business days via Stripe Connect. You can track all pending and settled payouts in your Wallet dashboard.",
            },
            {
                q: "How do I set up my payout account?",
                a: "Go to Profile → Wallet → Set Up Payouts. You'll complete a quick Stripe onboarding flow where you link your bank account. This is required before you can accept your first paid shift.",
            },
            {
                q: "Where can I find my invoices as a business?",
                a: "Business administrators can access all invoices under Billing → Invoice History. Each invoice includes a line-item breakdown, downloadable PDF, and payment status. Upcoming charges are shown in the Billing Overview.",
            },
        ],
    },
];

export const CONTACT_CHANNELS = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
            </svg>
        ),
        label: "Email Support",
        value: "support@trabajohub.com",
        description: "For account issues, compliance questions, and general enquiries.",
        action: "mailto:support@trabajohub.com",
        actionLabel: "Send email",
        sla: "Response within 24 hours",
    },
    // {
    //     icon: (
    //         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    //             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    //         </svg>
    //     ),
    //     label: "Live Chat",
    //     value: "Available in the dashboard",
    //     description: "Instant help from our support team for urgent operational issues.",
    //     action: "#chat",
    //     actionLabel: "Start chat",
    //     sla: "Mon–Fri, 7AM–10PM CT",
    // },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.08 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
        ),
        label: "Emergency Line",
        value: "+1 (512) 555-0199",
        description: "For critical patient care issues and urgent shift coverage needs only.",
        action: "tel:+15125550199",
        actionLabel: "Call now",
        sla: "24 / 7 — emergencies only",
    },
];

export const STATUS_ITEMS = [
    { label: "API & Backend",        status: "operational" },
    { label: "Mobile App",           status: "operational" },
    { label: "Admin Dashboard",      status: "operational" },
    { label: "File Uploads (Spaces)",status: "operational" },
    { label: "Push Notifications",   status: "operational" },
    { label: "Payment Processing",   status: "degraded"    },
];

export const SECTIONS = [
    {
        id:    "overview",
        title: "1. Overview",
        content: [
            "Trabajo Hub Inc. (\"we\", \"us\", \"our\") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your data when you use the Trabajo Hub platform (\"Platform\"), including our web dashboard, mobile application, and associated APIs.",
            "This policy applies to all users of the Platform: Facilities, Trabajo Hub Professionals (cleaners and caregivers), and any authorised administrators. By using the Platform you acknowledge that you have read and understood this policy.",
            "We review and update this policy periodically. When we make material changes we will notify you by email and by a prominent notice on the Platform at least 14 days before the changes take effect.",
        ],
    },
    {
        id:    "data-collected",
        title: "2. Information We Collect",
        content: [
            "Account & identity information: when you register, we collect your full name, email address, phone number, date of birth, and government-issued ID details required for identity verification.",
            "Professional credentials: nursing licences, CPR certifications, TB results, background-check reports, OIG/SAM exclusion check results, immunisation records, and any other documents required by the Platform or a Business.",
            "Location data: when you perform an EVV (Electronic Visit Verification) check-in or check-out, we capture GPS coordinates to verify your physical presence at a patient's address. Location data is collected only during active shift events and is not tracked continuously.",
            "Usage data: log files, IP addresses, browser or device type, pages visited, features used, and timestamps. This data is used for security monitoring, debugging, and improving the Platform.",
            "Communications: messages you send through the Platform's in-app messaging system, support ticket content, and any correspondence with our team.",
            "Financial data: bank account details collected during Stripe Connect onboarding for payout processing. We do not store full bank account numbers; these are held by Stripe under their own security and compliance frameworks.",
        ],
    },
    {
        id:    "how-we-use",
        title: "3. How We Use Your Information",
        content: [
            "Operating the Platform: to create and manage your account, verify your identity and credentials, match you with available shifts, process payouts, and provide all core Platform features.",
            "Compliance and safety: to conduct OIG/SAM exclusion checks, verify licence validity, fulfill our obligations as a HIPAA Business Associate, and detect fraudulent or unsafe activity.",
            "Communications: to send shift confirmations, credential-expiry alerts, payment notifications, security alerts, and Platform updates. You may opt out of non-essential communications at any time.",
            "Analytics and improvement: to understand how the Platform is used, identify bugs, optimise performance, and develop new features. Analytics data is aggregated and de-identified wherever possible.",
            "Legal and regulatory: to comply with applicable laws, respond to lawful requests from government authorities, enforce our Terms of Service, and protect our legal rights.",
            "We do not sell your personal information to third parties, and we do not use your data for targeted advertising.",
        ],
    },
    {
        id:    "data-sharing",
        title: "4. How We Share Your Information",
        content: [
            "With Facilities: when you accept a shift, the Business receives your professional profile, verified credentials relevant to the assignment, and contact information necessary for the engagement. Patient PHI flows in the opposite direction — from Business to you — and is subject to the HIPAA protections described in Section 5.",
            "With service providers: we share data with trusted third-party vendors (Stripe for payments, DigitalOcean for cloud storage, SendGrid for email, Firebase for push notifications, Twilio for SMS) solely to provide the services we have engaged them for. All vendors are contractually bound to protect your data.",
            "For legal reasons: we may disclose information to comply with a legal obligation, court order, or valid government request, or to protect the rights, property, or safety of Trabajo Hub, our users, or the public.",
            "Business transfers: if Trabajo Hub is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your data is transferred and becomes subject to a different privacy policy.",
            "We do not share your information with any other parties without your explicit consent.",
        ],
    },
    {
        id:    "hipaa",
        title: "5. HIPAA & Protected Health Information",
        content: [
            "Trabajo Hub operates as a Business Associate under the Health Insurance Portability and Accountability Act (HIPAA). We handle Protected Health Information (PHI) only on behalf of Covered Entity Facilities and in accordance with executed Business Associate Agreements (BAAs).",
            "PHI is never displayed in public marketplace listings. Patient identifiers are replaced with anonymised codes (e.g. Case-PT-7701) until a Trabajo Hub Professional has been confirmed for a shift, at which point limited PHI is disclosed for care-delivery purposes only.",
            "All PHI is encrypted using AES-256 at rest and TLS 1.3 in transit. Access to PHI is restricted on a strict need-to-know basis. Audit logs record every access event.",
            "If you suspect or discover a PHI breach, you must report it immediately to privacy@trabajohub.com. We will investigate and, where required by HIPAA, notify affected individuals and the U.S. Department of Health & Human Services within the required timeframes.",
        ],
    },
    {
        id:    "data-security",
        title: "6. Data Security",
        content: [
            "We implement a layered security programme including: AES-256 encryption at rest for all sensitive data; TLS 1.3 in transit; role-based access controls; JWT-based authentication with short-lived access tokens and rotating refresh tokens; multi-factor authentication for all administrator accounts; and continuous security monitoring.",
            "Credential documents and PHI are stored in private, non-publicly-accessible DigitalOcean Spaces buckets. Pre-signed URLs with short expiry windows are used whenever a document needs to be displayed to an authorised user.",
            "We conduct periodic security reviews and penetration tests. Employees with access to personal data undergo mandatory privacy and security training.",
            "While we take extensive precautions, no system is perfectly secure. If you believe your account has been compromised, contact security@trabajohub.com immediately.",
        ],
    },
    {
        id:    "retention",
        title: "7. Data Retention",
        content: [
            "We retain your personal data for as long as your account is active and for a reasonable period thereafter to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.",
            "Credential documents are retained for a minimum of 7 years following account closure, in accordance with applicable healthcare record-keeping requirements.",
            "EVV location records are retained for 5 years to satisfy state EVV compliance audit requirements.",
            "You may request deletion of your account and associated non-regulated data at any time by contacting privacy@trabajohub.com. We will process deletion requests within 30 days, subject to legal retention obligations.",
        ],
    },
    {
        id:    "your-rights",
        title: "8. Your Privacy Rights",
        content: [
            "Access: you may request a copy of the personal data we hold about you at any time.",
            "Correction: you may request that we correct any inaccurate or incomplete personal data.",
            "Deletion: subject to legal retention requirements, you may request deletion of your personal data.",
            "Portability: you may request an export of your data in a structured, machine-readable format.",
            "Objection and restriction: you may object to certain processing activities or request that we restrict how we process your data in specific circumstances.",
            "To exercise any of these rights, email privacy@trabajohub.com. We will respond within 30 days. We may need to verify your identity before processing your request.",
        ],
    },
    {
        id:    "cookies",
        title: "9. Cookies & Tracking",
        content: [
            "The Platform uses essential cookies required for authentication session management and security. These cannot be disabled without breaking core functionality.",
            "We use analytics cookies (via an anonymised, self-hosted analytics service) to understand Platform usage patterns. These do not contain personal identifiers.",
            "We do not use advertising cookies, third-party tracking pixels, or cross-site tracking technologies.",
            "You can manage cookie preferences through your browser settings. Disabling non-essential cookies will not affect your ability to use the Platform.",
        ],
    },
    {
        id:    "children",
        title: "10. Children's Privacy",
        content: [
            "The Platform is intended for use by adults who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18.",
            "If we become aware that we have inadvertently collected personal information from a minor, we will delete it promptly. If you believe we have collected data from a minor, please contact privacy@trabajohub.com.",
        ],
    },
    {
        id:    "contact",
        title: "11. Contact & Data Controller",
        content: [
            "Trabajo Hub Inc. is the data controller for personal information processed on the Platform. If you have questions about this Privacy Policy or our data practices, please contact our Privacy Officer at privacy@trabajohub.com.",
            "For HIPAA-specific matters, email privacy@trabajohub.com and reference 'HIPAA Enquiry' in the subject line.",
            "Trabajo Hub Inc. · 500 Congress Ave, Suite 200 · Austin, TX 78701 · United States",
        ],
    },
];

// ─── Privacy sections ──────────────────────────────────────────

export const PRIVACY_SECTIONS = [
    {
        id:    "overview",
        title: "1. Overview",
        content: [
            "Trabajo Hub Inc. (\"we\", \"us\", \"our\") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your data when you use the Trabajo Hub platform (\"Platform\"), including our web dashboard, mobile application, and associated APIs.",
            "This policy applies to all users of the Platform: Facilities, Trabajo Hub Professionals (cleaners and caregivers), and any authorised administrators. By using the Platform you acknowledge that you have read and understood this policy.",
            "We review and update this policy periodically. When we make material changes we will notify you by email and by a prominent notice on the Platform at least 14 days before the changes take effect.",
        ],
    },
    {
        id:    "data-collected",
        title: "2. Information We Collect",
        content: [
            "Account & identity information: when you register, we collect your full name, email address, phone number, date of birth, and government-issued ID details required for identity verification.",
            "Professional credentials: nursing licences, CPR certifications, TB results, background-check reports, OIG/SAM exclusion check results, immunisation records, and any other documents required by the Platform or a Business.",
            "Location data: when you perform an EVV (Electronic Visit Verification) check-in or check-out, we capture GPS coordinates to verify your physical presence at a patient's address. Location data is collected only during active shift events and is not tracked continuously.",
            "Usage data: log files, IP addresses, browser or device type, pages visited, features used, and timestamps. This data is used for security monitoring, debugging, and improving the Platform.",
            "Communications: messages you send through the Platform's in-app messaging system, support ticket content, and any correspondence with our team.",
            "Financial data: bank account details collected during Stripe Connect onboarding for payout processing. We do not store full bank account numbers; these are held by Stripe under their own security and compliance frameworks.",
        ],
    },
    {
        id:    "how-we-use",
        title: "3. How We Use Your Information",
        content: [
            "Operating the Platform: to create and manage your account, verify your identity and credentials, match you with available shifts, process payouts, and provide all core Platform features.",
            "Compliance and safety: to conduct OIG/SAM exclusion checks, verify licence validity, fulfill our obligations as a HIPAA Business Associate, and detect fraudulent or unsafe activity.",
            "Communications: to send shift confirmations, credential-expiry alerts, payment notifications, security alerts, and Platform updates. You may opt out of non-essential communications at any time.",
            "Analytics and improvement: to understand how the Platform is used, identify bugs, optimise performance, and develop new features. Analytics data is aggregated and de-identified wherever possible.",
            "Legal and regulatory: to comply with applicable laws, respond to lawful requests from government authorities, enforce our Terms of Service, and protect our legal rights.",
            "We do not sell your personal information to third parties, and we do not use your data for targeted advertising.",
        ],
    },
    {
        id:    "data-sharing",
        title: "4. How We Share Your Information",
        content: [
            "With Facilities: when you accept a shift, the Business receives your professional profile, verified credentials relevant to the assignment, and contact information necessary for the engagement. Patient PHI flows in the opposite direction — from Business to you — and is subject to the HIPAA protections described in Section 5.",
            "With service providers: we share data with trusted third-party vendors (Stripe for payments, DigitalOcean for cloud storage, SendGrid for email, Firebase for push notifications, Twilio for SMS) solely to provide the services we have engaged them for. All vendors are contractually bound to protect your data.",
            "For legal reasons: we may disclose information to comply with a legal obligation, court order, or valid government request, or to protect the rights, property, or safety of Trabajo Hub, our users, or the public.",
            "Business transfers: if Trabajo Hub is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your data is transferred and becomes subject to a different privacy policy.",
            "We do not share your information with any other parties without your explicit consent.",
        ],
    },
    {
        id:    "hipaa",
        title: "5. HIPAA & Protected Health Information",
        content: [
            "Trabajo Hub operates as a Business Associate under the Health Insurance Portability and Accountability Act (HIPAA). We handle Protected Health Information (PHI) only on behalf of Covered Entity Facilities and in accordance with executed Business Associate Agreements (BAAs).",
            "PHI is never displayed in public marketplace listings. Patient identifiers are replaced with anonymised codes (e.g. Case-PT-7701) until a Trabajo Hub Professional has been confirmed for a shift, at which point limited PHI is disclosed for care-delivery purposes only.",
            "All PHI is encrypted using AES-256 at rest and TLS 1.3 in transit. Access to PHI is restricted on a strict need-to-know basis. Audit logs record every access event.",
            "If you suspect or discover a PHI breach, you must report it immediately to privacy@trabajohub.com. We will investigate and, where required by HIPAA, notify affected individuals and the U.S. Department of Health & Human Services within the required timeframes.",
        ],
    },
    {
        id:    "data-security",
        title: "6. Data Security",
        content: [
            "We implement a layered security programme including: AES-256 encryption at rest for all sensitive data; TLS 1.3 in transit; role-based access controls; JWT-based authentication with short-lived access tokens and rotating refresh tokens; multi-factor authentication for all administrator accounts; and continuous security monitoring.",
            "Credential documents and PHI are stored in private, non-publicly-accessible DigitalOcean Spaces buckets. Pre-signed URLs with short expiry windows are used whenever a document needs to be displayed to an authorised user.",
            "We conduct periodic security reviews and penetration tests. Employees with access to personal data undergo mandatory privacy and security training.",
            "While we take extensive precautions, no system is perfectly secure. If you believe your account has been compromised, contact security@trabajohub.com immediately.",
        ],
    },
    {
        id:    "retention",
        title: "7. Data Retention",
        content: [
            "We retain your personal data for as long as your account is active and for a reasonable period thereafter to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.",
            "Credential documents are retained for a minimum of 7 years following account closure, in accordance with applicable healthcare record-keeping requirements.",
            "EVV location records are retained for 5 years to satisfy state EVV compliance audit requirements.",
            "You may request deletion of your account and associated non-regulated data at any time by contacting privacy@trabajohub.com. We will process deletion requests within 30 days, subject to legal retention obligations.",
        ],
    },
    {
        id:    "your-rights",
        title: "8. Your Privacy Rights",
        content: [
            "Access: you may request a copy of the personal data we hold about you at any time.",
            "Correction: you may request that we correct any inaccurate or incomplete personal data.",
            "Deletion: subject to legal retention requirements, you may request deletion of your personal data.",
            "Portability: you may request an export of your data in a structured, machine-readable format.",
            "Objection and restriction: you may object to certain processing activities or request that we restrict how we process your data in specific circumstances.",
            "To exercise any of these rights, email privacy@trabajohub.com. We will respond within 30 days. We may need to verify your identity before processing your request.",
        ],
    },
    {
        id:    "cookies",
        title: "9. Cookies & Tracking",
        content: [
            "The Platform uses essential cookies required for authentication session management and security. These cannot be disabled without breaking core functionality.",
            "We use analytics cookies (via an anonymised, self-hosted analytics service) to understand Platform usage patterns. These do not contain personal identifiers.",
            "We do not use advertising cookies, third-party tracking pixels, or cross-site tracking technologies.",
            "You can manage cookie preferences through your browser settings. Disabling non-essential cookies will not affect your ability to use the Platform.",
        ],
    },
    {
        id:    "children",
        title: "10. Children's Privacy",
        content: [
            "The Platform is intended for use by adults who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18.",
            "If we become aware that we have inadvertently collected personal information from a minor, we will delete it promptly. If you believe we have collected data from a minor, please contact privacy@trabajohub.com.",
        ],
    },
    {
        id:    "contact",
        title: "11. Contact & Data Controller",
        content: [
            "Trabajo Hub Inc. is the data controller for personal information processed on the Platform. If you have questions about this Privacy Policy or our data practices, please contact our Privacy Officer at privacy@trabajohub.com.",
            "For HIPAA-specific matters, email privacy@trabajohub.com and reference 'HIPAA Enquiry' in the subject line.",
            "Trabajo Hub Inc. · 500 Congress Ave, Suite 200 · Austin, TX 78701 · United States",
        ],
    },
];