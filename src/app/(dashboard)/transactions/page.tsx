"use client";

import { Suspense } from "react";
import { TransactionLog } from "@/components/transactions/TransactionLog";

// Suspense: the log reads ?q= from the URL, which Next requires to be wrapped.
export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionLog scope="business" />
    </Suspense>
  );
}
