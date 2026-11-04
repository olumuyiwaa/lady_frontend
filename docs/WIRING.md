# Wiring guide

## Storefront booking flow

All booking CTAs on the public storefront open `BookingWidgetModal` — there is
no `/book-now` route. The modal is wired entirely through props passed down from
`StorefrontClient`:

```
StorefrontClient
  ├─ bookOpen / bookPostcode  (useState)
  ├─ openBook()               (→ setBookOpen(true))
  ├─ openBookWithPostcode(pc) (→ setBookPostcode(pc); setBookOpen(true))
  │
  ├─ SiteHeader     onBook={openBook}
  ├─ SiteHero       onBook={openBook}  onBookWithPostcode={openBookWithPostcode}
  │    └─ SitePostcodeCheck  onBook={openBookWithPostcode}
  ├─ SiteServices   onBook={openBook}
  ├─ SiteCtaBand    onBook={openBook}
  ├─ SiteFooter     onBook={openBook}
  │
  └─ BookingWidgetModal
       open={bookOpen}
       initialPostalCode={bookPostcode}
       └─ BookingWizard compact={true}
            └─ useBookingState  (all form / quote / slot / submit state)
```

Every CTA is a `<button onClick={onBook}>` — no `href`, no navigation.

### Portal booking buttons

`src/app/[subdomain]/portal/page.tsx` fetches the same storefront data on mount
(`getStorefront(slug)`) and stores it in `storefrontData`. The three "Book
again" / "Book a cleaning" buttons call `setBookOpen(true)`, and
`BookingWidgetModal` is rendered at the bottom of the portal page using that
stored data.

---

## Dashboard.nav → routes

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
