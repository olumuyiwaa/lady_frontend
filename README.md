# Lady Greener web

Website and staff dashboard for **Lady Greener**, a cleaning company in the
Netherlands (Next.js 16, App Router, next-intl `nl`/`en`, Tailwind).

It started from the multi-tenant CleanSera frontend and keeps its features:
public storefront with online booking and postcode check, customer portal
(email OTP), and the dashboard for bookings, calendar, dispatch, recurring
schedules, cleaners and documents, payroll, invoices, coupons, gift cards,
inventory, compliance, reviews, waitlist, reports, messages and the
transaction log. It runs **one business**: no signup, subscriptions, platform
admin, marketing pages or custom domains.

Backend: [lady](https://github.com/olumuyiwaa/lady)

## How routes work

`src/proxy.ts` serves the storefront at the site root, using the single
business slug (`NEXT_PUBLIC_BUSINESS_SLUG`, default `ladygreener`):

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

- Logos in `public/images/logo` are still the CleanSera artwork; replace them
  with Lady Greener's.
- Privacy policy and terms pages were part of the CleanSera marketing site and
  were removed; add Lady Greener's own text before launch.
