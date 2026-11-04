"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getSlots, getStorefront, type Slot, type StorefrontCancellationPolicy, type StorefrontResponse } from "@/app/api/widget.api";
import { BookingWidgetModal } from "@/components/widget/BookingWidgetModal";
import { isoDateInTimeZone, setActiveCurrency } from "@/app/services/currency";
import { useActiveCurrency } from "@/app/services/useActiveCurrency";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { cancellationPolicyLabel } from "@/components/booking/types";
import { brandScaleVars } from "@/lib/color";
import { formatAnswer } from "@/lib/bookingQuestions";
import { useTenantPaths } from "@/lib/tenantPaths";
import { cleanerName, clearSession as clearStoredSession, readSession, rememberPendingTip, saveSession, takePendingTip } from "./portalSession";
import { buildIcs, downloadIcs } from "@/lib/ics";
import {
    requestPortalAccess,
    verifyPortalAccess,
    listPortalBookings,
    cancelPortalBooking,
    reschedulePortalBooking,
    leavePortalReview,
    tipPortalBooking,
    getPortalBooking,
    fetchPortalInvoiceHtml,
    formatMoney,
    statusLabel,
    statusColor,
    type PortalBooking,
    type PortalCustomer,
} from "@/app/api/portal.api";

import { StatCard, ActionBtn, Modal, ModalActions, DetailRow, PlusIcon, CheckIcon, CalendarIcon, PinIcon, UserIcon, ClockIcon, HistoryIcon } from "./PortalParts";
type Step = "phone" | "code" | "bookings";

const RESEND_COOLDOWN_SECONDS = 30;

const FALLBACK_LOGO = "/images/logo/todcleaning-logo.png";

export default function CustomerPortalPage() {
    const params = useParams();
    // Unified under /[subdomain]/portal — param is now "subdomain"
    const slug = (params?.subdomain as string) || (params?.slug as string) || "";
    // Amounts were formatted with a hardcoded USD default. Use the business's own currency.
    const currency = useActiveCurrency();
    const locale = useLocale();
    const t = useTranslations("Portal");
    const tStatus = useTranslations("Portal.status");
    // Reuse the booking wizard's wording for the slot picker states.
    const tSchedule = useTranslations("Booking.schedule");
    const tPolicy = useTranslations("Booking.cancellationPolicy");
    const tx = useTranslations("PortalExtra");
    const paths = useTenantPaths(slug);

    // Tenant branding: the portal is a "My Account" for THIS business, so it
    // wears the business's logo and colour, not Tod Cleaning Services'.
    const [brand, setBrand] = useState<{ name: string; logoUrl: string | null; primary: string | null } | null>(null);
    const brandVars = brand?.primary ? (brandScaleVars(brand.primary) as CSSProperties) : undefined;

    // Booking modal — opened by the "Book Again" / "Book a cleaning" buttons.
    const [bookOpen, setBookOpen] = useState(false);
    const [storefrontData, setStorefrontData] = useState<StorefrontResponse | null>(null);

    // Business timezone + cancellation policy come from the same storefront
    // call that already supplies the currency.
    const [timezone, setTimezone] = useState<string | undefined>(undefined);
    const [menuOpen, setMenuOpen] = useState(false);
    const [policy, setPolicy] = useState<StorefrontCancellationPolicy | null>(null);

    // Times are shown in the BUSINESS's timezone, not the visitor's: a customer
    // travelling (or a VPN) would otherwise see a different hour than the cleaner.
    const formatWhen = useCallback(
        (iso: string) => {
            const opts: Intl.DateTimeFormatOptions = {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
            };
            try {
                return new Date(iso).toLocaleString(locale, { ...opts, timeZone: timezone });
            } catch {
                // An unrecognised IANA name must not crash the whole page.
                return new Date(iso).toLocaleString(locale, opts);
            }
        },
        [locale, timezone]
    );

    // Currency was formatted with the browser locale (so a Dutch UI on an
    // English browser showed "EUR 1,234.50"); use the app locale like dates do.
    const money = useCallback(
        (cents: number) => formatMoney(cents, currency, locale),
        [currency, locale]
    );

    useEffect(() => {
        if (!slug) return;
        getStorefront(slug)
            .then((s) => {
                setActiveCurrency(s.business?.currency);
                setTimezone(s.business?.timezone);
                setPolicy(s.cancellationPolicy ?? null);
                setBrand({
                    name: s.business?.name ?? "",
                    logoUrl: s.business?.branding?.logoUrl ?? null,
                    primary: s.business?.branding?.primaryColor ?? null,
                });
                setStorefrontData(s);
            })
            .catch(() => {
                /* keep the default currency; times fall back to the browser timezone */
            });
    }, [slug]);

    const [step, setStep] = useState<Step>("phone");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    // Phone sends an SMS (and an email if we have one); email sends an email only.
    const [method, setMethod] = useState<"phone" | "email">("phone");
    const identity = method === "email" ? { email: email.trim() } : { phone: phone.trim() };
    const identityText = method === "email" ? email.trim() : phone.trim();
    const [code, setCode] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [customer, setCustomer] = useState<PortalCustomer | null>(null);
    const [bookings, setBookings] = useState<PortalBooking[]>([]);
    const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const [detail, setDetail] = useState<PortalBooking | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [invoiceBusy, setInvoiceBusy] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [cancelReason, setCancelReason] = useState("");
    const [tipPendingId, setTipPendingId] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const returnHandledRef = useRef(false);
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    // rescheduleStart is the ISO start of a slot the backend offered - never free text.
    const [rescheduleStart, setRescheduleStart] = useState("");
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [slots, setSlots] = useState<Slot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState("");
    const [reviewId, setReviewId] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    // Cancellation is confirmed in a modal that shows the fee up front; the fee
    // is computed when the modal opens (an event handler) so render stays pure.
    const [cancelPreview, setCancelPreview] = useState<{ id: string; feeCents: number } | null>(
        null
    );
    const [tipId, setTipId] = useState<string | null>(null);
    const [tipCents, setTipCents] = useState(500);
    // The custom-amount field keeps what the customer typed. Clamping on every
    // keystroke made it impossible to clear the field or type "2" on the way to
    // "2.50", because each change was re-rendered as toFixed(2) with a floor.
    const [tipInput, setTipInput] = useState("5.00");

    const MIN_TIP_CENTS = 50;
    const selectTipPreset = (cents: number) => {
        setTipCents(cents);
        setTipInput((cents / 100).toFixed(2));
    };
    const typeTipAmount = (raw: string) => {
        setTipInput(raw);
        // Accept a decimal comma too ("2,50"), which is what Dutch keyboards type.
        const n = Number(raw.trim().replace(",", "."));
        setTipCents(raw.trim() !== "" && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0);
    };

    // Only an expired/invalid token (401) should end the session. Any other
    // failure - a network blip, a 5xx - used to wipe the token and bounce the
    // customer back to the phone screen even though they were still signed in.
    const isUnauthorized = (e: unknown) => (e as { status?: number } | null)?.status === 401;

    const clearSession = useCallback(() => {
        clearStoredSession(slug);
        setToken(null);
        setCustomer(null);
        setBookings([]);
        setStep("phone");
    }, [slug]);

    /** Shared catch for every token-authenticated call. */
    const handleActionError = (err: unknown, fallback: string) => {
        if (isUnauthorized(err)) {
            clearSession();
            setError(t("errors.sessionExpired"));
            return;
        }
        setError(err instanceof Error ? err.message : fallback);
    };

    const loadBookings = useCallback(
        async (tok: string) => {
            const list = await listPortalBookings(slug, tok);
            setBookings(list);
        },
        [slug]
    );

    useEffect(() => {
        if (!slug || typeof window === "undefined") return;
        const saved = readSession(slug);
        if (saved) {
            // Restoring a saved session can only happen after mount (localStorage), hence setState here.
            /* eslint-disable react-hooks/set-state-in-effect */
            setToken(saved.token);
            setCustomer(saved.customer);
            setStep("bookings");
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [slug]);

    useEffect(() => {
        if (step !== "bookings" || !token || !slug) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError("");
            try {
                await loadBookings(token);
            } catch (e) {
                if (!cancelled) {
                    if ((e as { status?: number } | null)?.status === 401) {
                        clearSession();
                        setError(t("errors.sessionExpired"));
                    } else {
                        setError(e instanceof Error ? e.message : t("errors.failedToLoadBookings"));
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [step, token, slug, loadBookings, clearSession, t]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Resend-code cooldown
    useEffect(() => {
        if (resendIn <= 0) return;
        const id = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
        return () => window.clearTimeout(id);
    }, [resendIn]);

    // Returning from Stripe Checkout (?tipped=1 / ?tip_cancelled=1). Previously
    // these flags were sent to Stripe but never read, so the customer landed
    // back with no confirmation and a Tip button that still looked clickable.
    useEffect(() => {
        if (returnHandledRef.current || step !== "bookings" || !token || !slug) return;
        const params = new URLSearchParams(window.location.search);
        const tipped = params.get("tipped") === "1";
        const cancelled = params.get("tip_cancelled") === "1";
        if (!tipped && !cancelled) return;
        returnHandledRef.current = true;

        params.delete("tipped");
        params.delete("tip_cancelled");
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));

        const pendingId = takePendingTip(slug);

        if (cancelled) {
            queueMicrotask(() => setMsg(tx("tipCancelled")));
            return;
        }

        // The tip is recorded by Stripe's webhook, which can land a moment after
        // the redirect. Poll briefly instead of showing a stale list.
        (async () => {
            if (pendingId) setTipPendingId(pendingId);
            for (let attempt = 0; attempt < 6 && mountedRef.current; attempt++) {
                try {
                    const list = await listPortalBookings(slug, token);
                    if (!mountedRef.current) return;
                    setBookings(list);
                    const hit = pendingId ? list.find((b) => b.id === pendingId) : null;
                    if (!pendingId || (hit?.tipAmountCents ?? 0) > 0) {
                        setTipPendingId(null);
                        setMsg(tx("tipThanks"));
                        return;
                    }
                } catch (e) {
                    if (isUnauthorized(e)) return;
                }
                await new Promise((r) => setTimeout(r, 2000));
            }
            if (mountedRef.current) {
                setTipPendingId(null);
                setMsg(tx("tipProcessing"));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, token, slug]);

    // "Now" lives in state (refreshed each minute) so the upcoming/past split is
    // computed from a stable value during render rather than calling Date.now() in it.
    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
        return () => window.clearInterval(id);
    }, []);

    const filtered = useMemo(() => {
        const now = nowMs;
        return bookings.filter((b) => {
            const start = new Date(b.scheduledStart).getTime();
            if (filter === "upcoming") {
                return start >= now && !["CANCELLED", "COMPLETED"].includes(b.status);
            }
            if (filter === "past") {
                return start < now || ["CANCELLED", "COMPLETED"].includes(b.status);
            }
            return true;
        });
    }, [bookings, filter, nowMs]);

    const stats = useMemo(() => {
        const now = nowMs;
        const upcoming = bookings.filter(
            (b) =>
                new Date(b.scheduledStart).getTime() >= now &&
                !["CANCELLED", "COMPLETED"].includes(b.status)
        ).length;
        const completed = bookings.filter((b) => b.status === "COMPLETED").length;
        return { upcoming, completed, total: bookings.length };
    }, [bookings, nowMs]);

    const sendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMsg("");
        try {
            await requestPortalAccess(slug, identity);
            setMsg(t("success.codeSent"));
            setResendIn(RESEND_COOLDOWN_SECONDS);
            setStep("code");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("errors.failedToSendCode"));
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        if (resendIn > 0 || loading) return;
        setLoading(true);
        setError("");
        try {
            await requestPortalAccess(slug, identity);
            setMsg(tx("codeResent"));
            setResendIn(RESEND_COOLDOWN_SECONDS);
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
            const data = await verifyPortalAccess(slug, identity, code.trim());
            saveSession(slug, { token: data.token, customer: data.customer });
            setToken(data.token);
            setCustomer(data.customer);
            setStep("bookings");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("errors.invalidCode"));
        } finally {
            setLoading(false);
        }
    };

    const logout = () => clearSession();

    // Mobile menu: Escape closes it.
    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    // "YYYY-MM-DD" of an instant in the business timezone (browser tz if unknown/invalid).
    const dayInBusinessTz = useCallback(
        (d: Date) => {
            try {
                return isoDateInTimeZone(d, timezone);
            } catch {
                return isoDateInTimeZone(d);
            }
        },
        [timezone]
    );

    const pickRescheduleDate = (date: string) => {
        setRescheduleDate(date);
        setRescheduleStart("");
        setSlots([]);
        setSlotsError("");
        setSlotsLoading(!!date);
    };

    const openReschedule = (b: PortalBooking) => {
        const today = dayInBusinessTz(new Date());
        const current = dayInBusinessTz(new Date(b.scheduledStart));
        setRescheduleId(b.id);
        pickRescheduleDate(current >= today ? current : today);
    };

    const rescheduleServiceId = useMemo(
        () => bookings.find((b) => b.id === rescheduleId)?.service?.id ?? null,
        [bookings, rescheduleId]
    );

    // Offer only slots the business can actually serve (same endpoint as the
    // booking wizard) instead of letting the customer type any date/time and
    // hoping the backend rejects the bad ones.
    const canLoadSlots = !!rescheduleId && !!rescheduleDate && !!rescheduleServiceId;

    useEffect(() => {
        if (!canLoadSlots || !rescheduleServiceId) return;
        let cancelled = false;
        // The loading flag and list reset happen in the handlers that change the
        // date (openReschedule / pickRescheduleDate) so this effect only syncs
        // with the network.
        getSlots(slug, { serviceId: rescheduleServiceId, date: rescheduleDate })
            .then((r) => {
                if (cancelled) return;
                setSlots(r.slots ?? []);
                setSlotsLoading(false);
            })
            .catch((e) => {
                if (cancelled) return;
                setSlots([]);
                setSlotsError(e instanceof Error ? e.message : t("errors.failedToLoadSlots"));
                setSlotsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [slug, canLoadSlots, rescheduleDate, rescheduleServiceId, t]);


    const formatSlotTime = useCallback(
        (iso: string) => {
            const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
            try {
                return new Date(iso).toLocaleTimeString(locale, { ...opts, timeZone: timezone });
            } catch {
                return new Date(iso).toLocaleTimeString(locale, opts);
            }
        },
        [locale, timezone]
    );

    // Mirrors lib/cancellationPolicy.js on the backend: a fee applies only inside
    // the window, as PERCENT of the quoted price or a flat AMOUNT (cents), never
    // more than the quote. The backend also caps it at what was actually paid and
    // is the source of truth, so this is shown as "up to".
    const openCancel = (b: PortalBooking) => {
        let feeCents = 0;
        if (policy && policy.windowHours != null) {
            const hoursUntilStart = (new Date(b.scheduledStart).getTime() - Date.now()) / 3_600_000;
            if (hoursUntilStart < policy.windowHours) {
                if (policy.feeType === "PERCENT") {
                    feeCents = Math.round((b.quotedPriceCents * (policy.feeValue ?? 0)) / 100);
                } else if (policy.feeType === "AMOUNT") {
                    feeCents = policy.feeValue ?? 0;
                }
                feeCents = Math.min(feeCents, b.quotedPriceCents);
            }
        }
        setCancelReason("");
        setCancelPreview({ id: b.id, feeCents });
    };

    const handleCancel = async () => {
        if (!token || !cancelPreview) return;
        const id = cancelPreview.id;
        setLoading(true);
        setError("");
        try {
            // No reason => the API stores its own default; never send English text from a Dutch UI.
            await cancelPortalBooking(slug, token, id, cancelReason.trim() || undefined);
            setCancelPreview(null);
            await loadBookings(token);
            setDetail(null);
            setMsg(t("success.bookingCancelled"));
        } catch (err) {
            setCancelPreview(null);
            handleActionError(err, t("errors.cancelFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!token || !rescheduleId || !rescheduleStart) return;
        setLoading(true);
        setError("");
        try {
            await reschedulePortalBooking(slug, token, rescheduleId, rescheduleStart);
            setRescheduleId(null);
            await loadBookings(token);
            setMsg(t("success.bookingRescheduled"));
        } catch (err) {
            handleActionError(err, t("errors.rescheduleFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (!token || !reviewId) return;
        setLoading(true);
        setError("");
        try {
            await leavePortalReview(slug, token, reviewId, rating, comment || undefined);
            setReviewId(null);
            setComment("");
            await loadBookings(token);
            setMsg(t("success.reviewThanks"));
        } catch (err) {
            handleActionError(err, t("errors.reviewFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleTip = async () => {
        if (!token || !tipId || tipCents < MIN_TIP_CENTS) return;
        setLoading(true);
        setError("");
        try {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const path = paths.portal;
            const data = await tipPortalBooking(
                slug,
                token,
                tipId,
                tipCents,
                `${origin}${path}?tipped=1`,
                `${origin}${path}?tip_cancelled=1`
            );
            if (data.url) {
                rememberPendingTip(slug, tipId);
                window.location.href = data.url;
                return;
            }
            setError(t("errors.couldNotStartTipCheckout"));
        } catch (err) {
            handleActionError(err, t("errors.tipFailed"));
        } finally {
            setLoading(false);
        }
    };

    // The list endpoint is light; the single-booking endpoint adds checklist,
    // photos (signed URLs) and review. Open instantly with what we have, then enrich.
    const openDetail = async (b: PortalBooking) => {
        setDetail(b);
        if (!token) return;
        setDetailLoading(true);
        try {
            const full = await getPortalBooking(slug, token, b.id);
            if (mountedRef.current) {
                setDetail((cur) => (cur && cur.id === b.id ? { ...b, ...full, assignments: full.assignments ?? b.assignments } : cur));
            }
        } catch (err) {
            if (isUnauthorized(err)) handleActionError(err, tx("detailsFailed"));
        } finally {
            if (mountedRef.current) setDetailLoading(false);
        }
    };

    const openInvoice = async (b: PortalBooking) => {
        if (!token || invoiceBusy) return;
        // Open the tab synchronously (popup blockers), fill it once the HTML arrives.
        const win = window.open("about:blank", "_blank");
        setInvoiceBusy(true);
        try {
            const html = await fetchPortalInvoiceHtml(slug, token, b.id);
            const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
            if (win) win.location.href = url;
            else window.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (err) {
            win?.close();
            handleActionError(err, tx("invoiceFailed"));
        } finally {
            setInvoiceBusy(false);
        }
    };

    const addToCalendar = (b: PortalBooking) => {
        const where = [b.addressLine1, b.addressLine2, b.city].filter(Boolean).join(", ");
        const title = [b.service?.name || t("card.defaultServiceName"), brand?.name].filter(Boolean).join(" · ");
        downloadIcs(
            `booking-${b.id}.ics`,
            buildIcs({
                uid: b.id,
                title,
                start: b.scheduledStart,
                end: b.scheduledEnd || b.scheduledStart,
                location: where || undefined,
            })
        );
    };

    const canModify = (b: PortalBooking) =>
        !["COMPLETED", "CANCELLED", "IN_PROGRESS"].includes(b.status);

    return (
        <div
            className="min-h-screen bg-[#F6F2ED] text-gray-800 dark:bg-gray-900 dark:text-white/90"
            style={brandVars}
        >
            {/* ── Header ── */}
            <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    {/* Brand + title */}
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={paths.home}
                            aria-label={brand?.name || t("header.site")}
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- tenant-uploaded asset, arbitrary host */}
                            <img
                                src={brand?.logoUrl || FALLBACK_LOGO}
                                alt=""
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                    if (!e.currentTarget.src.endsWith(FALLBACK_LOGO)) e.currentTarget.src = FALLBACK_LOGO;
                                }}
                            />
                        </Link>
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-500 dark:text-brand-400">
                                {brand?.name || t("header.badge")}
                            </p>
                            <h1 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90 sm:text-base">
                                {t("header.title")}
                            </h1>
                        </div>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden items-center gap-2 sm:flex">
                        <LanguageSwitcher />
                        <ThemeToggleButton />
                        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" aria-hidden />
                        <button
                            type="button"
                            onClick={() => setBookOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1"
                        >
                            <PlusIcon className="h-4 w-4" />
                            {t("header.bookAgain")}
                        </button>
                        {customer && (
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                {t("header.signOut")}
                            </button>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-expanded={menuOpen}
                        aria-controls="portal-mobile-menu"
                        aria-label={menuOpen ? t("header.closeMenu") : t("header.openMenu")}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:hidden"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu drawer */}
                {menuOpen && (
                    <div id="portal-mobile-menu" className="border-t border-gray-200 bg-white px-4 pb-4 pt-3 dark:border-gray-800 dark:bg-gray-900 sm:hidden">
                        <div className="mx-auto flex max-w-7xl flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => { setMenuOpen(false); setBookOpen(true); }}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                            >
                                <PlusIcon className="h-4 w-4" />
                                {t("header.bookAgain")}
                            </button>
                            <Link
                                href={paths.home}
                                onClick={() => setMenuOpen(false)}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                {t("header.site")}
                            </Link>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-2 dark:border-gray-700">
                                <LanguageSwitcher />
                                <ThemeToggleButton />
                            </div>
                            {customer && (
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); logout(); }}
                                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    {t("header.signOut")}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                {/* ── Toast alerts ── */}
                {(error || msg) && (
                    <div className="mb-6 space-y-2">
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                            >
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
                                <span className="flex-1">{error}</span>
                                <button type="button" onClick={() => setError("")} className="text-red-400 transition hover:text-red-600" aria-label="Dismiss">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                </button>
                            </div>
                        )}
                        {msg && (
                            <div
                                role="status"
                                className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                            >
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span className="flex-1">{msg}</span>
                                <button type="button" onClick={() => setMsg("")} className="text-green-500 transition hover:text-green-700" aria-label="Dismiss">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Auth screens ── */}
                {(step === "phone" || step === "code") && (
                    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                        {/* Marketing panel — desktop only */}
                        <div className="hidden lg:block">
                            {/* Icon lockup */}
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg">
                                    <CalendarIcon className="h-7 w-7" />
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent dark:from-brand-700" aria-hidden />
                            </div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                {t("marketing.selfService")}
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white xl:text-4xl">
                                {t("marketing.heading")}
                            </h2>
                            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
                                {t("marketing.description")}
                            </p>
                            <ul className="mt-8 space-y-4">
                                {[
                                    t("marketing.feature1"),
                                    t("marketing.feature2"),
                                    t("marketing.feature3"),
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                                            <CheckIcon className="h-3 w-3" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Auth card */}
                        <div className="mx-auto w-full max-w-md lg:mx-0">
                            {step === "phone" && (
                                <form
                                    onSubmit={sendCode}
                                    className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                                >
                                    <div className="mb-7">
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t("phoneStep.heading")}
                                        </h2>
                                        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                            {t("phoneStep.description")}
                                        </p>
                                    </div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {method === "email" ? tx("emailLabel") : t("phoneStep.phoneLabel")}
                                    </label>
                                    {method === "email" ? (
                                        <input
                                            key="email"
                                            className="mb-3 h-12 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={tx("emailPlaceholder")}
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            required
                                        />
                                    ) : (
                                        <input
                                            key="phone"
                                            className="mb-3 h-12 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-sm outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder={t("phoneStep.phonePlaceholder")}
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            required
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMethod(method === "email" ? "phone" : "email");
                                            setError("");
                                        }}
                                        className="mb-6 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                                    >
                                        {method === "email" ? tx("usePhoneInstead") : tx("useEmailInstead")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !identityText}
                                        className="h-12 w-full rounded-xl bg-brand-500 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
                                    >
                                        {loading ? t("phoneStep.sending") : t("phoneStep.sendCode")}
                                    </button>
                                </form>
                            )}

                            {step === "code" && (
                                <form
                                    onSubmit={verify}
                                    className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                                >
                                    <div className="mb-7">
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round"/></svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t("codeStep.heading")}
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            {t("codeStep.sentTo")}{" "}
                                            <span className="font-semibold text-gray-800 dark:text-white">{identityText}</span>
                                        </p>
                                    </div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t("codeStep.codeLabel")}
                                    </label>
                                    <input
                                        className="mb-6 h-16 w-full rounded-xl border border-gray-300 bg-transparent px-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500"
                                        value={code}
                                        onChange={(e) =>
                                            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                        placeholder="••••••"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || code.length < 6}
                                        className="h-12 w-full rounded-xl bg-brand-500 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
                                    >
                                        {loading ? t("codeStep.verifying") : t("codeStep.continue")}
                                    </button>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={resendCode}
                                            disabled={resendIn > 0 || loading}
                                            className="w-full text-sm font-medium text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                                        >
                                            {resendIn > 0 ? tx("resendIn", { seconds: resendIn }) : tx("resend")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("phone");
                                                setCode("");
                                            }}
                                            className="w-full text-sm text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            {method === "email" ? tx("useDifferentEmail") : t("codeStep.useDifferentPhone")}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Bookings dashboard ── */}
                {step === "bookings" && customer && (
                    <div className="space-y-8">
                        {/* Welcome banner */}
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                    {brand?.name}
                                </p>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                                    {t("welcome", { name: customer.firstName })}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <StatCard
                                    label={t("stats.upcoming")}
                                    value={stats.upcoming}
                                    accent
                                    icon={<ClockIcon className="h-4 w-4" />}
                                />
                                <StatCard
                                    label={t("stats.completed")}
                                    value={stats.completed}
                                    icon={<CheckIcon className="h-4 w-4" />}
                                />
                                <StatCard
                                    label={t("stats.total")}
                                    value={stats.total}
                                    icon={<HistoryIcon className="h-4 w-4" />}
                                />
                            </div>
                        </div>

                        {/* Filter bar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                                {(
                                    [
                                        ["upcoming", t("filters.upcoming")],
                                        ["past", t("filters.past")],
                                        ["all", t("filters.all")],
                                    ] as const
                                ).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFilter(key)}
                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                            filter === key
                                                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                                                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {loading && (
                                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" /></svg>
                                    {t("filters.refreshing")}
                                </p>
                            )}
                        </div>

                        {/* Booking grid */}
                        {loading && bookings.length === 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-52 animate-pulse rounded-2xl bg-white ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/10"
                                    />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-20 text-center dark:border-gray-700 dark:bg-white/[0.03]">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400 dark:bg-brand-500/10 dark:text-brand-400">
                                    <CalendarIcon className="h-8 w-8" />
                                </div>
                                <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                                    {t("empty.noBookings")}
                                </p>
                                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                                    {t("empty.scheduleWhenReady")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setBookOpen(true)}
                                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    {t("empty.bookACleaning")}
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((b) => (
                                    <article
                                        key={b.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-white/[0.04]"
                                    >
                                        {/* Colored top accent strip keyed to status */}
                                        <div
                                            className={`h-1 w-full shrink-0 ${
                                                b.status === "COMPLETED" ? "bg-green-400" :
                                                b.status === "CANCELLED" ? "bg-red-400" :
                                                b.status === "IN_PROGRESS" ? "bg-amber-400" :
                                                "bg-brand-500"
                                            }`}
                                            aria-hidden
                                        />

                                        <div className="flex flex-1 flex-col p-5">
                                            {/* Title row */}
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <h3 className="min-w-0 truncate text-base font-semibold text-gray-900 dark:text-white">
                                                    {b.service?.name || t("card.defaultServiceName")}
                                                </h3>
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusColor(b.status)}`}
                                                >
                                                    {statusLabel(b.status, tStatus)}
                                                </span>
                                            </div>

                                            {/* Date/time */}
                                            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                                {formatWhen(b.scheduledStart)}
                                            </p>

                                            {/* Location / cleaner */}
                                            {(b.city || cleanerName(b)) && (
                                                <div className="mb-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {b.city && (
                                                        <p className="flex items-center gap-1.5 truncate">
                                                            <PinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                            {[b.addressLine1, b.city].filter(Boolean).join(", ")}
                                                        </p>
                                                    )}
                                                    {cleanerName(b) && (
                                                        <p className="flex items-center gap-1.5">
                                                            <UserIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                            {cleanerName(b)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Price + actions */}
                                            <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-700">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">{t("detailModal.price")}</span>
                                                    <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                                                        {money(b.quotedPriceCents)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <ActionBtn onClick={() => openDetail(b)}>{t("card.details")}</ActionBtn>
                                                    {canModify(b) && (
                                                        <>
                                                            <ActionBtn onClick={() => openReschedule(b)}>
                                                                {t("card.reschedule")}
                                                            </ActionBtn>
                                                            <ActionBtn onClick={() => addToCalendar(b)}>
                                                                {tx("addToCalendar")}
                                                            </ActionBtn>
                                                            <ActionBtn danger onClick={() => openCancel(b)}>
                                                                {t("card.cancel")}
                                                            </ActionBtn>
                                                        </>
                                                    )}
                                                    {b.status === "COMPLETED" && !b.review && (
                                                        <ActionBtn
                                                            primary
                                                            onClick={() => {
                                                                setReviewId(b.id);
                                                                setRating(5);
                                                                setComment("");
                                                            }}
                                                        >
                                                            {t("card.review")}
                                                        </ActionBtn>
                                                    )}
                                                    {b.status === "COMPLETED" && !b.tipAmountCents && tipPendingId !== b.id && (
                                                        <ActionBtn
                                                            onClick={() => {
                                                                setTipId(b.id);
                                                                selectTipPreset(500);
                                                            }}
                                                        >
                                                            {t("card.tip")}
                                                        </ActionBtn>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="mx-auto max-w-7xl border-t border-gray-200 px-4 py-8 dark:border-gray-800 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                    <p className="text-xs text-gray-400">{t("footer")}</p>
                    <Link
                        href={paths.home}
                        className="text-xs font-medium text-brand-500 transition hover:text-brand-600 dark:text-brand-400"
                    >
                        {t("header.site")} →
                    </Link>
                </div>
            </footer>

            {/* ── Modals ── */}
            {detail && (
                <Modal onClose={() => setDetail(null)} title={t("detailModal.title")} wide>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label={t("detailModal.service")} value={detail.service?.name || "—"} />
                        <DetailRow label={t("detailModal.when")} value={formatWhen(detail.scheduledStart)} />
                        <DetailRow
                            label={t("detailModal.address")}
                            value={[detail.addressLine1, detail.city, detail.state]
                                .filter(Boolean)
                                .join(", ")}
                        />
                        <DetailRow label={t("detailModal.status")} value={statusLabel(detail.status, tStatus)} />
                        <DetailRow
                            label={t("detailModal.price")}
                            value={money(detail.quotedPriceCents)}
                        />
                        {detail.tipAmountCents != null && detail.tipAmountCents > 0 && (
                            <DetailRow
                                label={t("detailModal.tip")}
                                value={money(detail.tipAmountCents)}
                            />
                        )}
                        {cleanerName(detail) && (
                            <DetailRow label={t("detailModal.cleaner")} value={cleanerName(detail)!} />
                        )}
                        {(detail.customAnswers ?? []).map((a) => (
                            <DetailRow
                                key={a.questionId}
                                label={a.label}
                                value={formatAnswer(a.value, tx("yes"), tx("no"))}
                            />
                        ))}
                        {detail.paymentStatus && (
                            <DetailRow
                                label={tx("payment")}
                                value={`${
                                    ["UNPAID", "DEPOSIT_PAID", "PARTIAL", "PAID", "REFUNDED"].includes(detail.paymentStatus)
                                        ? tx(`paymentStatus.${detail.paymentStatus}` as "paymentStatus.PAID")
                                        : detail.paymentStatus
                                }${
                                    detail.amountPaidCents ? ` · ${money(detail.amountPaidCents)}` : ""
                                }`}
                            />
                        )}
                        {detail.cancellationFeeCents != null && detail.cancellationFeeCents > 0 && (
                            <DetailRow
                                label={tx("cancellationFee")}
                                value={money(detail.cancellationFeeCents)}
                            />
                        )}
                        {detail.review && (
                            <DetailRow
                                label={t("detailModal.yourReview")}
                                value={`${detail.review.rating}/5${
                                    detail.review.comment ? ` — ${detail.review.comment}` : ""
                                }`}
                            />
                        )}
                    </dl>

                    {detailLoading && (
                        <p className="mt-4 text-sm text-gray-400">{tx("loadingDetails")}</p>
                    )}

                    {(() => {
                        const a = detail.assignments?.[0];
                        const steps = [
                            [tx("onMyWay"), a?.onMyWayAt],
                            [tx("checkedIn"), a?.checkedInAt],
                            [tx("checkedOut"), a?.checkedOutAt],
                        ].filter(([, at]) => !!at) as Array<[string, string]>;
                        if (steps.length === 0) return null;
                        return (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                    {tx("visit")}
                                </p>
                                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                                    {steps.map(([label, at]) => (
                                        <li key={label} className="flex justify-between gap-3">
                                            <span>{label}</span>
                                            <span className="tabular-nums text-gray-500 dark:text-gray-400">
                                                {formatSlotTime(at)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })()}

                    {detail.checklist?.items && detail.checklist.items.length > 0 && (
                        <div className="mt-5">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                {tx("checklist")} ·{" "}
                                {tx("checklistDone", {
                                    done: detail.checklist.items.filter((i) => i.done).length,
                                    total: detail.checklist.items.length,
                                })}
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {detail.checklist.items.map((item, i) => (
                                    <li key={`${item.label}-${i}`} className="flex items-start gap-2">
                                        <span
                                            aria-hidden
                                            className={item.done ? "text-success-500" : "text-gray-300"}
                                        >
                                            {item.done ? "✓" : "○"}
                                        </span>
                                        <span className={item.done ? "" : "text-gray-500 dark:text-gray-400"}>
                                            {item.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(() => {
                        const shots = (detail.photos ?? []).filter((p) => !!p.url);
                        if (shots.length === 0) return null;
                        return (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                    {tx("photos")}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {shots.map((p) => (
                                        <figure key={p.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                                            <img
                                                src={p.url as string}
                                                alt={`${p.stage === "BEFORE" ? tx("before") : tx("after")}`}
                                                loading="lazy"
                                                className="aspect-square w-full object-cover"
                                            />
                                            <figcaption className="px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                {p.stage === "BEFORE" ? tx("before") : tx("after")}
                                            </figcaption>
                                        </figure>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        {detail.status !== "CANCELLED" && (
                            <button
                                type="button"
                                onClick={() => openInvoice(detail)}
                                disabled={invoiceBusy}
                                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                {tx("invoice")}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setDetail(null)}
                            className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            {t("detailModal.close")}
                        </button>
                    </div>
                </Modal>
            )}

            {rescheduleId && (
                <Modal onClose={() => setRescheduleId(null)} title={t("rescheduleModal.title")}>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                        {t("rescheduleModal.description")}
                    </p>
                    {!rescheduleServiceId ? (
                        <p className="mb-5 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {t("rescheduleModal.contactBusiness")}
                        </p>
                    ) : (
                        <>
                            <label
                                htmlFor="reschedule-date"
                                className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                {t("rescheduleModal.dateLabel")}
                            </label>
                            <input
                                id="reschedule-date"
                                type="date"
                                min={dayInBusinessTz(new Date())}
                                className="mb-4 h-12 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 text-sm outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:focus:border-brand-500"
                                value={rescheduleDate}
                                onChange={(e) => pickRescheduleDate(e.target.value)}
                            />
                            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                {t("rescheduleModal.timeLabel")}
                            </p>
                            <div className="mb-5 min-h-[3rem]">
                                {slotsLoading && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tSchedule("loadingTimes")}</p>
                                )}
                                {!slotsLoading && slotsError && (
                                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                                        {slotsError}
                                    </p>
                                )}
                                {!slotsLoading && !slotsError && rescheduleDate && slots.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tSchedule("noTimesAvailable")}</p>
                                )}
                                {!slotsLoading && slots.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {slots.map((slot) => {
                                            const active = rescheduleStart === slot.start;
                                            return (
                                                <button
                                                    key={slot.start}
                                                    type="button"
                                                    aria-pressed={active}
                                                    onClick={() => setRescheduleStart(slot.start)}
                                                    className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                                                        active
                                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20"
                                                            : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                                                    }`}
                                                >
                                                    {formatSlotTime(slot.start)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <ModalActions
                        onClose={() => setRescheduleId(null)}
                        onConfirm={handleReschedule}
                        confirmLabel={t("rescheduleModal.save")}
                        disabled={loading || !rescheduleStart}
                        loading={loading}
                    />
                </Modal>
            )}

            {reviewId && (
                <Modal onClose={() => setReviewId(null)} title={t("reviewModal.title")}>
                    <div className="mb-4 flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className={`text-3xl transition ${
                                    n <= rating
                                        ? "text-amber-400 scale-110"
                                        : "text-gray-200 dark:text-gray-600 hover:text-amber-200"
                                }`}
                                aria-label={t("reviewModal.starsAriaLabel", { n })}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="mb-5 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:focus:border-brand-500"
                        rows={3}
                        placeholder={t("reviewModal.commentPlaceholder")}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <ModalActions
                        onClose={() => setReviewId(null)}
                        onConfirm={handleReview}
                        confirmLabel={t("reviewModal.submit")}
                        disabled={loading}
                        loading={loading}
                    />
                </Modal>
            )}

            {cancelPreview && (
                <Modal onClose={() => setCancelPreview(null)} title={t("cancelModal.title")}>
                    <p
                        className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                            cancelPreview.feeCents > 0
                                ? "bg-amber-50 text-amber-900"
                                : "bg-brand-50 dark:bg-brand-500/10 text-brand-800 dark:text-brand-200"
                        }`}
                    >
                        {cancelPreview.feeCents > 0
                            ? t("cancelModal.fee", { fee: money(cancelPreview.feeCents) })
                            : t("cancelModal.free")}
                    </p>
                    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                        {cancellationPolicyLabel(policy, tPolicy)}
                    </p>
                    <label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {tx("cancelReasonLabel")}
                    </label>
                    <textarea
                        id="cancel-reason"
                        rows={2}
                        maxLength={300}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder={tx("cancelReasonPlaceholder")}
                        className="mb-5 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500"
                    />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setCancelPreview(null)}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800"
                        >
                            {t("cancelModal.keep")}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                        >
                            {loading ? t("pleaseWait") : t("cancelModal.confirm")}
                        </button>
                    </div>
                </Modal>
            )}

            {tipId && (
                <Modal onClose={() => setTipId(null)} title={t("tipModal.title")}>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                        {t("tipModal.description")}
                    </p>
                    <div className="mb-4 grid grid-cols-4 gap-2">
                        {[300, 500, 1000, 2000].map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => selectTipPreset(c)}
                                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                                    tipCents === c
                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20"
                                        : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                                }`}
                            >
                                {money(c)}
                            </button>
                        ))}
                    </div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t("tipModal.customAmount", { currency })}
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="mb-1.5 h-12 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 text-sm outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:focus:border-brand-500"
                        value={tipInput}
                        onChange={(e) => typeTipAmount(e.target.value)}
                        aria-invalid={tipInput.trim() !== "" && tipCents < MIN_TIP_CENTS}
                    />
                    <p
                        className={`mb-5 min-h-[1.25rem] text-xs ${
                            tipInput.trim() !== "" && tipCents < MIN_TIP_CENTS
                                ? "text-red-600"
                                : "text-gray-400"
                        }`}
                    >
                        {t("tipModal.minimum", { amount: money(MIN_TIP_CENTS) })}
                    </p>
                    <ModalActions
                        onClose={() => setTipId(null)}
                        onConfirm={handleTip}
                        confirmLabel={t("tipModal.tipButton", { amount: money(Math.max(tipCents, 0)) })}
                        disabled={loading || tipCents < MIN_TIP_CENTS}
                        loading={loading}
                    />
                </Modal>
            )}

            {/* Booking modal — same wizard used on the storefront */}
            {storefrontData && (
                <BookingWidgetModal
                    open={bookOpen}
                    onClose={() => setBookOpen(false)}
                    subdomain={slug}
                    business={storefrontData.business}
                    services={storefrontData.services}
                    payment={storefrontData.payment}
                    cancellationPolicy={storefrontData.cancellationPolicy}
                    questions={storefrontData.questions}
                    businessName={brand?.name}
                    primaryColor={brand?.primary ?? undefined}
                />
            )}
        </div>
    );
}
