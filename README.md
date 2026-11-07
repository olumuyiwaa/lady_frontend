# Tod Cleaning Services web

Website and staff dashboard for **Tod Cleaning Services**, a cleaning company in the
Netherlands (Next.js 16, App Router, next-intl `nl`/`en`, Tailwind).

Features: public storefront with online booking and postcode check, customer
portal (email OTP), and the dashboard for bookings, calendar, dispatch,
recurring schedules, cleaners and documents, payroll, invoices, coupons, gift
cards, inventory, compliance, reviews, waitlist, reports, messages and the
transaction log. Runs **one business**: no signup, subscriptions, platform
admin or custom domains.

Backend: [lady](https://github.com/olumuyiwaa/lady)

## How routes work

`src/proxy.ts` serves the storefront at the site root, using the single
business slug (`NEXT_PUBLIC_BUSINESS_SLUG`, default `todcleaning`):

| URL | Page |
|---|---|
| `/` | Storefront |
| `/portal` | Customer portal |
| `/business` | Landing page for business customers, with a quote form |
| `/en`, `/nl` (also `/en/business`, `/en/terms`, ...) | The same public pages in one language each |
| `/signin`, `/dashboard`, ... | Staff sign-in and dashboard |
| `/{slug}/...` | Redirects to the clean URL |
| anything else | 404 |

The pages still live in `src/app/[subdomain]`; the layout returns 404 for any
segment other than the business slug.

> **Booking** is handled entirely via the `BookingWidgetModal` that opens from
> the storefront and customer portal. There is no standalone `/book-now` route.

## Booking flow

Every "Book" CTA on the storefront (`SiteHero`, `SiteServices`, `SiteHeader`,
`SiteFooter`, `SiteCtaBand`) calls `onBook()` from `StorefrontClient`, which
opens `BookingWidgetModal`. The portal's "Book again" and "Book a cleaning"
buttons do the same. Both use the same `BookingWizard` component (with
`compact={true}` inside the modal).

## Business accounts

- **Staff:** People > Business accounts (`/business-accounts`) lists every company with the month's
  rating, checklist, punctuality, complaints, spend and overdue invoices; open one for the per-branch
  report, a PDF, and its team logins.
- **Portal:** a company admin gets a Team panel to add members as admin or branch manager (chosen
  locations only). Branch managers get a reduced portal: their locations' bookings, report and
  complaints, with no statement, referral or preferences. The backend enforces this; the UI only reflects it.
- Shared team editor: `src/components/b2b/MembersEditor.tsx`.

## Other dashboard and site features

Leave (`/leave`) for cleaner time off, an AI assistant chat on the storefront and in the portal
(shown when the backend reports `assistantEnabled`), and language and WhatsApp preferences in the portal.

## Languages and SEO

Public pages (`/`, `/business`, `/terms`, `/privacy`, `/cookies`) exist in English
and Dutch at `/en/...` and `/nl/...`. `proxy.ts` rewrites them to the normal page and
sets an `x-locale` header, which `src/i18n/request.ts` reads before the cookie.
`/` stays the default (`x-default`). Staff and portal URLs never get a prefix.

- `src/lib/localePath.ts`: prefix parsing and hreflang maps (add a new public page to `LOCALIZED_PATHS`, the proxy's storefront paths and `PUBLIC_SEGMENTS` in `hostRouting.ts`)
- `src/lib/seo.ts`: canonical, hreflang and `og:locale` for a page; needs a known origin (custom domain or `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN`), otherwise none are emitted
- `src/app/sitemap.ts`: every page in every language with alternates
- `src/app/llms.txt/route.ts`: `/llms.txt`, generated from live storefront data (`src/lib/llmsTxt.ts`)
- Business enquiries post to the normal contact endpoint and arrive as tickets starting `[B2B enquiry]` (`src/lib/businessEnquiry.ts`)

## Dashboard additions

Dispatch has a "Plan the day" panel. The sidebar has Live map and Insights. Strings
live in `messages/en.json` and `messages/nl.json`; keep both in step.

## Run it

```bash
cp env.local.example .env.local     # set NEXT_PUBLIC_API_BASE_URL, API_URL
npm ci
npm run dev
npm run test:unit
```

The first staff account is created by the backend seed (`npm run seed` in
the `lady` repo). Staff sign in at `/signin`.

## Still to do

- Replace `public/images/logo/todcleaning-logo.png` with the final high-resolution logo file before launch (the current file was added as a placeholder from the chat conversation).
- Confirm the `effectiveDate` strings on the Terms and Privacy pages (`"March 2021 — Updated for 2025"`) match the actual dates before publishing.
