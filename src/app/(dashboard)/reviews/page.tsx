"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { listReviews, deleteReview } from "@/app/api/reviews.api";

export default function ReviewsPage() {
  const t = useTranslations("Dashboard.reviews");
  const tc = useTranslations("Dashboard.common");
  const locale = useLocale();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReviews();
      if (!res.success) throw new Error(res.message);
      setReviews(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    load();
  }, [load]);

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <p className="text-sm text-gray-500">{tc("loading")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border p-5 dark:border-gray-800">
              <div className="text-amber-500">{stars(r.rating || 0)}</div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{r.comment || t("noComment")}</p>
              <p className="mt-3 text-xs text-gray-500">
                {r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : t("customerFallback")} ·{" "}
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.createdAt))}
              </p>
              <button
                type="button"
                className="mt-3 text-xs text-red-600 hover:underline"
                onClick={async () => {
                  await deleteReview(r.id);
                  load();
                }}
              >
                {tc("delete")}
              </button>
            </div>
          ))}
          {!reviews.length && <p className="text-sm text-gray-500">{t("empty")}</p>}
        </div>
      )}
    </div>
  );
}
