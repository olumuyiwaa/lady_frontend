# Dashboard NL — merge catalogs + wire layout

## 1. Merge keys into `messages/en.json` and `messages/nl.json`

You should already have applied `cleansera-dashboard-nl.patch` (fragments).

Also merge **into** `Dashboard.nav` the extra group keys from:

- `messages/nav-extra-en.json` → `en.json`
- `messages/nav-extra-nl.json` → `nl.json`

Required extra keys (if missing after the first patch):

| Key | EN | NL |
|-----|----|----|
| `usersGroup` | Users | Gebruikers |
| `bookingSchedulesGroup` | Booking & Schedules | Boekingen & planning |
| `businessGroup` | Business | Bedrijf |
| `userProfile` | User Profile | Gebruikersprofiel |
| `menu` | Menu | Menu |
| `others` | Others | Overig |
| `platform` | Platform | Platform |
| `overview` | Overview | Overzicht |
| `businesses` | Businesses | Bedrijven |
| `subscriptions` | Subscriptions | Abonnementen |

If `Dashboard.nav` is incomplete, copy the full `nav` object from `dashboard-*-fragment.json` **plus** these extras.

## 2. Apply this wiring patch

```bash
git apply cleansera-dashboard-nl-wire.patch
```

This replaces:

- `src/layout/AppSidebar.tsx` — all labels via `useTranslations("Dashboard.nav")`
- `src/layout/AppHeader.tsx` — adds `<LanguageSwitcher />` next to theme toggle

## 3. Verify

1. Open the business dashboard.
2. Switch **NL** in the header → sidebar shows Boekingen, Schoonmakers, Planning, etc.
3. Switch **EN** → English labels return.
4. Submenus (Gebruikers → Klanten / Schoonmakers / Team) still expand correctly.

## 4. Next (optional Phase 1b)

Wire page titles on `/bookings`, `/cleaners`, `/customers` with `Dashboard.bookings.title`, etc., and row actions + `DownloadUblButton`.
