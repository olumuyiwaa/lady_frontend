import type { TransactionStatus, TransactionType } from "@/lib/transactionFilters";

const TYPE_STYLE: Record<TransactionType, string> = {
  BOOKING_PAYMENT: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  DEPOSIT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  TIP: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  REFUND: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  DISPUTE: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  CLEANER_PAYOUT: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  SUBSCRIPTION: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
};

const STATUS_STYLE: Record<TransactionStatus, string> = {
  SUCCEEDED: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  REVERSED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium";

/** The label is passed in (already translated) so this stays presentational. */
export function TypeBadge({ type, label }: { type: TransactionType; label: string }) {
  return <span className={`${pill} ${TYPE_STYLE[type]}`}>{label}</span>;
}

export function StatusBadge({ status, label }: { status: TransactionStatus; label: string }) {
  return <span className={`${pill} ${STATUS_STYLE[status]}`}>{label}</span>;
}
