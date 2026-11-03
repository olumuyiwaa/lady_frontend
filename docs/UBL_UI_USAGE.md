# Usage examples

## Row action in a bookings table

```tsx
import { DownloadUblButton } from "@/components/invoices/DownloadUblButton";

function BookingActions({ booking }: { booking: BookingRow }) {
  if (!booking.invoiceId) {
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

## Env

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

`invoices-api.ts` reads `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE`.
