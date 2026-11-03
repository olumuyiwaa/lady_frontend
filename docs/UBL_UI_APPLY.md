# Apply UBL download UI (frontend)

Backend already generates UBL 2.1 via `src/lib/ubl.js` (commit `e011133`).  
This patch adds the dashboard/customer-facing **Download UBL** control.

## 1. Copy files into `cleansera_sass_frontend`

```text
src/lib/invoices-api.ts
src/components/invoices/DownloadUblButton.tsx
src/components/invoices/IssueAndDownloadUblButton.tsx
```

## 2. Merge i18n fragments

Merge the contents of:

- `messages/invoices-en-fragment.json` → into `messages/en.json` (top-level `Invoices` key)
- `messages/invoices-nl-fragment.json` → into `messages/nl.json`

If `Invoices` already exists, deep-merge the `ubl` and `actions` objects.

## 3. Confirm backend route

Expected (adjust in `invoices-api.ts` if different):

```http
GET /invoices/:id/ubl
Authorization: same as other staff/dashboard calls
Accept: application/xml
→ 200 application/xml (or text/xml)
Content-Disposition: attachment; filename="factuur-INV-….xml"
```

If your route is e.g. `/api/invoices/:id/ubl.xml`, set:

```ts
pathTemplate: "/api/invoices/:id/ubl.xml"
```

on the button, or change the default in `downloadInvoiceUbl`.

**Issue-from-booking** (optional helper):

```http
POST /bookings/:id/invoice
→ { id, number, ... }
```

Align with the path used by your existing “Invoice” action (`bee6423`).

## 4. Wire into UI

### A. Booking row actions / invoice panel (recommended)

Where you already show “Invoice” / PDF for a booking:

```tsx
import { DownloadUblButton } from "@/components/invoices/DownloadUblButton";
// or issue + download in one step:
import { IssueAndDownloadUblButton } from "@/components/invoices/IssueAndDownloadUblButton";

// If invoice already exists:
<DownloadUblButton
  invoiceId={booking.invoiceId}
  invoiceNumber={booking.invoiceNumber}
  variant="menu" // or "secondary"
/>

// If invoice may not exist yet:
<IssueAndDownloadUblButton
  bookingId={booking.id}
  existingInvoiceId={booking.invoiceId}
  existingInvoiceNumber={booking.invoiceNumber}
/>
```

### B. Invoice detail page

```tsx
<section className="rounded-xl border border-slate-200 p-4 space-y-2">
  <h3 className="font-medium">{t("ubl.sectionTitle")}</h3>
  <p className="text-sm text-slate-600">{t("ubl.sectionDescription")}</p>
  <DownloadUblButton
    invoiceId={invoice.id}
    invoiceNumber={invoice.number}
    variant="primary"
  />
  <p className="text-xs text-slate-500">{t("ubl.hint")}</p>
</section>
```

### C. Auth headers

If the dashboard uses Bearer tokens instead of cookies:

```tsx
<DownloadUblButton
  invoiceId={id}
  authHeaders={{ Authorization: `Bearer ${token}` }}
/>
```

## 5. Backend checklist (if download 404s)

Ensure `invoices.routes.js` exposes something like:

```js
// illustrative — match your existing auth middleware
router.get("/:id/ubl", requireStaff, async (req, res, next) => {
  try {
    const inv = await invoicesService.getInvoiceForBusiness(req.params.id, req.businessId);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    const xml = generateUBLInvoiceXML(inv);
    const filename = `factuur-${inv.number || inv.id}-ubl.xml`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (e) {
    next(e);
  }
});
```

Tenant-scope the lookup by `businessId` the same way as other invoice reads.

## 6. Smoke test

1. Issue an invoice for a completed NL booking (with KvK + BTW on the business).
2. Click **UBL downloaden** / **Download UBL**.
3. Open the XML — should contain `UBLVersionID` 2.1, supplier KvK/VAT, tax totals.
4. Optional: import into Moneybird or Exact sandbox.

## Notes

- Scope is **file-based UBL 2.1**, not Peppol Access Point delivery (same boundary as backend).
- Filename uses invoice number when available: `factuur-{number}-ubl.xml`.
