# Wiring guide — Dashboard.nav → routes

Use `useTranslations("Dashboard.nav")` (or `Dashboard.navGroups`) in the sidebar.

| Route (approx.) | Key | NL |
|-----------------|-----|-----|
| `/dashboard` | `dashboard` | Dashboard |
| `/bookings` | `bookings` | Boekingen |
| `/calendar` | `calendar` | Agenda |
| `/dispatch` | `dispatch` | Planning |
| `/cleaners` | `cleaners` | Schoonmakers |
| `/customers` | `customers` | Klanten |
| `/services` | `services` | Diensten |
| `/pricing` | `pricing` | Prijzen |
| `/coupons` | `coupons` | Kortingscodes |
| `/gift-cards` | `giftCards` | Cadeaubonnen |
| `/waitlist` | `waitlist` | Wachtlijst |
| `/recurring-schedules` | `recurringSchedules` | Terugkerende schema's |
| `/payroll` | `payroll` | Loonadministratie |
| `/inventory` | `inventory` | Voorraad |
| `/compliance` | `compliance` | Compliance |
| `/checklist-templates` | `checklistTemplates` | Checklist-sjablonen |
| `/cleaner-documents` | `cleanerDocuments` | Documenten schoonmakers |
| `/website` | `website` | Website |
| `/subscription` | `subscription` | Abonnement |
| `/team` | `team` | Team |
| `/messages` | `messages` | Berichten |
| `/notifications` | `notifications` | Meldingen |
| `/reports` | `reports` | Rapporten |
| `/reviews` | `reviews` | Beoordelingen |
| `/business-settings` | `businessSettings` | Bedrijfsinstellingen |
| `/onboarding` | `onboarding` | Onboarding |
| `/support-tickets` | `supportTickets` | Support |
| `/audit-trail` | `auditTrail` | Auditlog |
| `/profile` | `profile` | Profiel |

## Bookings page example

```tsx
"use client";
import { useTranslations } from "next-intl";
import { DownloadUblButton } from "@/components/invoices/DownloadUblButton";

export function BookingsHeader() {
  const t = useTranslations("Dashboard.bookings");
  return (
    <div className="flex items-center justify-between">
      <h1>{t("title")}</h1>
      <button type="button">{t("new")}</button>
    </div>
  );
}

// Status chip
function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Dashboard.bookings.status");
  const key = status as "requested" | "confirmed" | "assigned" | "inProgress" | "completed" | "cancelled";
  return <span>{t(key)}</span>;
}

// Row action when invoice exists
function InvoiceActions({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber?: string }) {
  const t = useTranslations("Dashboard.bookings.actions");
  return (
    <>
      <span>{t("invoice")}</span>
      <DownloadUblButton invoiceId={invoiceId} invoiceNumber={invoiceNumber} variant="menu" />
    </>
  );
}
```

## Sidebar sketch

```tsx
const t = useTranslations("Dashboard.nav");
const items = [
  { href: "/dashboard", label: t("dashboard") },
  { href: "/bookings", label: t("bookings") },
  { href: "/calendar", label: t("calendar") },
  { href: "/dispatch", label: t("dispatch") },
  { href: "/cleaners", label: t("cleaners") },
  // ...
];
```
