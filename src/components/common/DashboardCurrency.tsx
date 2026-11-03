"use client";

import { Fragment, useEffect, type ReactNode } from "react";
import { getBusiness } from "@/app/api/businesses.api";
import { setActiveCurrency } from "@/app/services/currency";
import { useActiveCurrency } from "@/app/services/useActiveCurrency";

/**
 * The dashboard never told the money formatters which currency the business
 * uses, so every screen fell back to the build-time default. This loads the
 * business once and sets the active currency; the subtree is re-keyed when it
 * changes so every formatMoney() call renders with the right one (a no-op for a
 * business already using the default).
 */
export function DashboardCurrency({ children }: { children: ReactNode }) {
  const currency = useActiveCurrency();

  useEffect(() => {
    let cancelled = false;
    getBusiness()
      .then((b) => {
        if (!cancelled) setActiveCurrency(b?.currency);
      })
      .catch(() => {
        /* keep the default; never block the page on this */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Fragment key={currency}>{children}</Fragment>;
}
