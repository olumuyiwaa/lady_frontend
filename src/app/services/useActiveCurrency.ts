"use client";

import { useSyncExternalStore } from "react";
import { getActiveCurrency, subscribeActiveCurrency } from "./currency";

/**
 * The ISO currency amounts are currently shown in. Call it in a screen that
 * formats money so the screen re-renders when the business currency arrives
 * (it starts as NEXT_PUBLIC_DEFAULT_CURRENCY, EUR by default).
 */
export function useActiveCurrency(): string {
  return useSyncExternalStore(subscribeActiveCurrency, getActiveCurrency, getActiveCurrency);
}
