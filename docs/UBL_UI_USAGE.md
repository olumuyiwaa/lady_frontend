# UBL invoice download — UI usage guide

The helpers in `src/lib/invoices-api.ts` provide UBL 2.1 XML downloads for
Dutch accounting tools (Exact Online, Moneybird, e-Boekhouden, SnelStart).
The `DownloadUblButton` component in `src/components/invoices/` wraps them.

## Row action in a bookings table

```tsx
import { DownloadUblButton } from "@/components/invoices/DownloadUblButton";
import { IssueAndDownloadUblButton } from "@/components/invoices/IssueAndDownloadUblButton";

function BookingActions({ booking }: { booking: BookingRow }) {
  if (!booking.invoiceId) {
    // No invoice yet — create one and download in a single click.
    return <IssueAndDownloadUblButton bookingId={booking.id} />;
  }
  return (
    <DownloadUblButton
      invoiceId={booking.invoiceId}
      invoiceNumber={booking.invoiceNumber}
      variant="menu"
    />
  );
}
```

## Toast on success (optional)

```tsx
<DownloadUblButton
  invoiceId={invoice.id}
  invoiceNumber={invoice.number}
  onSuccess={(filename) => toast.success(t("ubl.success", { filename }))}
  onError={(msg) => toast.error(msg)}
/>
```

## Environment variable

The app-wide API base URL is:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

This is the variable read by `authFetch`, `publicFetch`, `widget.api`,
`portal.api`, and all other API clients.

> **Note:** `src/lib/invoices-api.ts` is the odd one out — it still falls back
> to the older `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE` names before
> giving up. Set `NEXT_PUBLIC_API_BASE_URL` and it will work correctly.
