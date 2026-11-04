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
| `/signin`, `/dashboard`, ... | Staff sign-in and dashboard |
| `/book-now/{anything}` | Embeddable booking widget |
| `/{slug}/...` | Redirects to the clean URL |
| anything else | 404 |

The pages still live in `src/app/[subdomain]`; the layout returns 404 for any
segment other than the business slug.

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
