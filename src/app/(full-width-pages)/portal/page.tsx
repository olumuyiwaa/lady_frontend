"use client";

/**
 * Legacy host-based portal entry at /portal.
 * Prefer /portal/[slug] (slug-resolved, zero DNS) for production links.
 * This page keeps Host-header resolution for businesses on a custom domain
 * or *.WIDGET_BASE_DOMAIN subdomain.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import {
  requestPortalAccess,
  verifyPortalAccess,
  listPortalBookings,
  cancelPortalBooking,
  reschedulePortalBooking,
  leavePortalReview,
  tipPortalBooking,
  formatMoney,
  statusLabel,
  statusColor,
  type PortalBooking,
  type PortalCustomer,
} from "@/app/api/portal.api";

const TOKEN_KEY = "cleansera_portal_token";
const CUSTOMER_KEY = "cleansera_portal_customer";

export default function CustomerPortalHostPage() {
  const t = useTranslations("Portal");
  const tStatus = useTranslations("Portal.status");
  const [step, setStep] = useState<"phone" | "code" | "bookings">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [bookings, setBookings] = useState<PortalBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [tipId, setTipId] = useState<string | null>(null);
  const [tipCents, setTipCents] = useState(500);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const c = typeof window !== "undefined" ? localStorage.getItem(CUSTOMER_KEY) : null;
    if (t && c) {
      try {
        setToken(t);
        setCustomer(JSON.parse(c));
        setStep("bookings");
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (step !== "bookings" || !token) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        setBookings(await listPortalBookings(null, token));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.failedToLoadBookings"));
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_KEY);
        setStep("phone");
      } finally {
        setLoading(false);
      }
    })();
  }, [step, token, t]);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await requestPortalAccess(null, phone);
      setMsg(t("success.codeSent"));
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.failedToSendCode"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await verifyPortalAccess(null, phone, code);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data.customer));
      setToken(data.token);
      setCustomer(data.customer);
      setStep("bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    setToken(null);
    setCustomer(null);
    setBookings([]);
    setStep("phone");
  };

  const handleCancel = async (id: string) => {
    if (!token || !confirm(t("legacy.confirmCancel"))) return;
    setLoading(true);
    try {
      await cancelPortalBooking(null, token, id);
      setBookings(await listPortalBookings(null, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.cancelFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!token || !rescheduleId || !rescheduleStart) return;
    setLoading(true);
    try {
      await reschedulePortalBooking(
          null,
          token,
          rescheduleId,
          new Date(rescheduleStart).toISOString()
      );
      setRescheduleId(null);
      setBookings(await listPortalBookings(null, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.rescheduleFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!token || !reviewId) return;
    setLoading(true);
    try {
      await leavePortalReview(null, token, reviewId, rating, comment || undefined);
      setReviewId(null);
      setBookings(await listPortalBookings(null, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.reviewFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async () => {
    if (!token || !tipId) return;
    setLoading(true);
    try {
      const origin = window.location.origin;
      const data = await tipPortalBooking(
          null,
          token,
          tipId,
          tipCents,
          `${origin}/portal?tipped=1`,
          `${origin}/portal?tip_cancelled=1`
      );
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.tipFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="mx-auto min-h-screen max-w-lg bg-gray-50 px-4 py-10">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">{t("header.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("legacy.subtitle")}
          </p>
        </div>

        {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
        )}
        {msg && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {msg}
            </div>
        )}

        {step === "phone" && (
            <form
                onSubmit={sendCode}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("phoneStep.phoneLabel")}
              </label>
              <input
                  className="mb-4 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1…"
                  required
              />
              <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-emerald-700 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? t("phoneStep.sending") : t("phoneStep.sendCode")}
              </button>
            </form>
        )}

        {step === "code" && (
            <form
                onSubmit={verify}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("codeStep.codeLabel")}
              </label>
              <input
                  className="mb-4 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
              />
              <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-emerald-700 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? t("codeStep.verifying") : t("codeStep.continue")}
              </button>
              <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="mt-3 w-full text-sm text-gray-500"
              >
                {t("codeStep.useDifferentPhone")}
              </button>
            </form>
        )}

        {step === "bookings" && customer && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {t("legacy.hi")} <span className="font-medium">{customer.firstName}</span>
                </p>
                <button onClick={logout} className="text-sm text-gray-500">
                  {t("header.signOut")}
                </button>
              </div>

              {loading && <p className="text-sm text-gray-500">{t("legacy.loading")}</p>}

              <div className="space-y-3">
                {bookings.map((b) => (
                    <div
                        key={b.id}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {b.service?.name || t("card.defaultServiceName")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(b.scheduledStart).toLocaleString()}
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {formatMoney(b.quotedPriceCents)}
                          </p>
                        </div>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor(
                                b.status
                            )}`}
                        >
                    {statusLabel(b.status, tStatus)}
                  </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!["COMPLETED", "CANCELLED", "IN_PROGRESS"].includes(b.status) && (
                            <>
                              <button
                                  onClick={() => {
                                    setRescheduleId(b.id);
                                    setRescheduleStart("");
                                  }}
                                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium"
                              >
                                {t("card.reschedule")}
                              </button>
                              <button
                                  onClick={() => handleCancel(b.id)}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                              >
                                {t("card.cancel")}
                              </button>
                            </>
                        )}
                        {b.status === "COMPLETED" && !b.review && (
                            <button
                                onClick={() => {
                                  setReviewId(b.id);
                                  setRating(5);
                                  setComment("");
                                }}
                                className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700"
                            >
                              {t("legacy.leaveReview")}
                            </button>
                        )}
                        {b.status === "COMPLETED" && !b.tipAmountCents && (
                            <button
                                onClick={() => {
                                  setTipId(b.id);
                                  setTipCents(500);
                                }}
                                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800"
                            >
                              {t("card.tip")}
                            </button>
                        )}
                      </div>
                    </div>
                ))}
                {!loading && bookings.length === 0 && (
                    <p className="text-center text-sm text-gray-500">{t("legacy.noBookingsYet")}</p>
                )}
              </div>

              {rescheduleId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5">
                      <h3 className="mb-3 font-semibold">{t("rescheduleModal.title")}</h3>
                      <input
                          type="datetime-local"
                          className="mb-4 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                          value={rescheduleStart}
                          onChange={(e) => setRescheduleStart(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setRescheduleId(null)}
                            className="px-3 py-2 text-sm text-gray-500"
                        >
                          {t("detailModal.close")}
                        </button>
                        <button
                            onClick={handleReschedule}
                            disabled={loading || !rescheduleStart}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {t("legacy.save")}
                        </button>
                      </div>
                    </div>
                  </div>
              )}

              {reviewId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5">
                      <h3 className="mb-3 font-semibold">{t("reviewModal.title")}</h3>
                      <select
                          className="mb-3 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm"
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {t("legacy.starsOption", { n })}
                            </option>
                        ))}
                      </select>
                      <textarea
                          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          rows={3}
                          placeholder={t("reviewModal.commentPlaceholder")}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setReviewId(null)}
                            className="px-3 py-2 text-sm text-gray-500"
                        >
                          {t("detailModal.close")}
                        </button>
                        <button
                            onClick={handleReview}
                            disabled={loading}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {t("legacy.submit")}
                        </button>
                      </div>
                    </div>
                  </div>
              )}

              {tipId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5">
                      <h3 className="mb-3 font-semibold">{t("tipModal.title")}</h3>
                      <div className="mb-3 flex gap-2">
                        {[300, 500, 1000, 2000].map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setTipCents(c)}
                                className={`rounded-lg border px-2 py-1 text-sm ${
                                    tipCents === c
                                        ? "border-emerald-600 bg-emerald-50"
                                        : "border-gray-200"
                                }`}
                            >
                              {formatMoney(c)}
                            </button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setTipId(null)}
                            className="px-3 py-2 text-sm text-gray-500"
                        >
                          {t("detailModal.close")}
                        </button>
                        <button
                            onClick={handleTip}
                            disabled={loading}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {t("tipModal.tipButton", { amount: formatMoney(tipCents) })}
                        </button>
                      </div>
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}