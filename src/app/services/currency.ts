/**
 * The currency amounts are shown in. Every formatMoney() call used to default
 * to USD, so a Dutch business's prices rendered as "$" even though the backend
 * charges the business's own currency. The booking widget sets this from the
 * business it is showing; NEXT_PUBLIC_DEFAULT_CURRENCY covers everything else.
 */
let activeCurrency: string =
    (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "EUR").toUpperCase();

const listeners = new Set<() => void>();

export function setActiveCurrency(currency?: string | null) {
    if (currency && /^[A-Za-z]{3}$/.test(currency)) {
        const next = currency.toUpperCase();
        if (next === activeCurrency) return;
        activeCurrency = next;
        // Deferred: this is also called while rendering (BookingWizard), and
        // notifying subscribers synchronously would set state during a render.
        queueMicrotask(() => listeners.forEach((l) => l()));
    }
}

/** For useActiveCurrency(): lets screens re-render once the business currency is known. */
export function subscribeActiveCurrency(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** "€", "$", "£"... for labels and placeholders such as "Price (€)". Falls back to the ISO code. */
export function currencySymbol(currency: string = activeCurrency): string {
    try {
        const part = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
        })
            .formatToParts(0)
            .find((p) => p.type === "currency");
        return part?.value ?? currency;
    } catch {
        return currency;
    }
}

/** Formats an amount that is already in whole currency units (chart axes, KPI tiles). */
export function formatMoneyUnits(
    units: number,
    currency: string = activeCurrency,
    opts: { whole?: boolean } = {}
): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        ...(opts.whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(units);
}

export function getActiveCurrency(): string {
    return activeCurrency;
}

/**
 * The day in a timezone as YYYY-MM-DD. `toISOString().slice(0, 10)` gives the
 * UTC date, which for anyone east of UTC is the previous day around local
 * midnight — the date strip selected the wrong day for every Dutch visitor.
 */
export function isoDateInTimeZone(date: Date, timeZone?: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}
