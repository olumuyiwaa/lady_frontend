"use client";

/**
 * Show on widget confirmation / portal when onlineCardReady is false.
 */

import React from "react";
import { useTranslations } from "next-intl";

type Props = {
  instructions?: string | null;
  className?: string;
};

export default function OfflinePaymentPanel({ instructions, className = "" }: Props) {
  const t = useTranslations("Booking.offlinePayment");
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03] ${className}`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white">{t("heading")}</p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {t("description")}
      </p>
      {instructions ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {instructions}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          {t("noInstructionsFallback")}
        </p>
      )}
    </div>
  );
}
