# Phase 1 — Business dashboard NL

## Goal

Make the **staff dashboard** usable in Dutch: sidebar, common actions, bookings, cleaners, customers, dispatch, settings labels, invoices/UBL, and auth chrome.

Customer-facing surfaces (widget + portal) and the cleaner app are already NL. This closes the remaining gap for Dutch business owners.

## What this package contains

| File | Role |
|------|------|
| `messages/dashboard-en-fragment.json` | Full `Dashboard` + `Invoices` + `Auth` EN keys |
| `messages/dashboard-nl-fragment.json` | Same structure in Dutch |
| `docs/APPLY.md` | This file |
| `docs/WIRING.md` | How to replace hardcoded strings |

## Steps

### 1. Merge message catalogs

Deep-merge into existing files (do **not** replace Booking / Portal):

```bash
# Conceptually:
# messages/en.json  ← merge Dashboard, Invoices, Auth from dashboard-en-fragment.json
# messages/nl.json  ← merge Dashboard, Invoices, Auth from dashboard-nl-fragment.json
```

Your current `Dashboard` only has `markPaymentReceived`. Replace/extend that object with the full `Dashboard` from the fragment (keep any extra keys you already added).

Also merge top-level `Invoices` and `Auth` if missing.

### 2. Optional: default locale for NL market

In `src/i18n/locales.ts` you currently have:

```ts
export const defaultLocale: AppLocale = "en";
```

For a Netherlands-first product, consider:

```ts
export const defaultLocale: AppLocale = "nl";
```

Staff can still switch to English via the language switcher.

### 3. Show language switcher on the dashboard

If `LanguageSwitcher` already exists under `src/components/i18n/`, add it to the dashboard header/sidebar (next to profile).

```tsx
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
// in header:
<LanguageSwitcher />
```

### 4. Wire navigation labels

In the sidebar config, replace hardcoded English labels with:

```tsx
const t = useTranslations("Dashboard.nav");
// e.g. t("bookings") → "Boekingen"
```

See `WIRING.md` for a mapping of routes → keys.

### 5. Wire high-traffic pages (Phase 1 order)

1. Sidebar + header (nav + common)
2. Bookings list + row actions (incl. UBL + mark paid)
3. Cleaners list
4. Customers list
5. Dispatch + calendar titles
6. Business settings section titles
7. Auth sign-in chrome

Page bodies can stay partly English until Phase 2; **nav + bookings** alone make the product feel Dutch for daily use.

### 6. Smoke test

1. Set locale cookie / switcher to **NL**.
2. Sidebar shows Boekingen, Schoonmakers, Planning, etc.
3. Bookings filters and status chips in Dutch.
4. Language switcher flips back to EN.

## Phase 2 (later)

Per-page forms: pricing engine, payroll details, reports charts labels, onboarding wizard, support tickets, full business-settings field labels.
