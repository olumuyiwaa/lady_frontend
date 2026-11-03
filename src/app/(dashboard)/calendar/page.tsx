"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";

import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { CalendarSync } from "@/components/calendar/CalendarSync";
import {
    fetchCalendarEvents,
    type BackendCalendarEvent,
    type CalendarEventType,
} from "@/app/api/calendar";
import { useAuth } from "@/app/auth/useAuth";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/app/api/cleansera-types";

const EVENT_TYPE_CONFIG: Record<
    CalendarEventType,
    { label: string; badgeClass: string }
> = {
    BOOKING: {
        label: "booking",
        badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    },
    RECURRING: {
        label: "recurring",
        badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
};

const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[];

function formatLabel(value?: string | null) {
    if (!value) return "—";
    return value.replace(/_/g, " ");
}

function formatDateTime(value: string | null | undefined, locale: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span className="break-words text-sm text-gray-800 dark:text-white/90">{value}</span>
        </div>
    );
}

function EventDetailRows({
    event,
    labels,
    locale,
}: {
    event: BackendCalendarEvent;
    labels: Record<string, string>;
    locale: string;
}) {
    const { meta, type, status } = event;

    if (type === "BOOKING") {
        return (
            <>
                <DetailRow label={labels.service} value={meta.serviceName} />
                <DetailRow label={labels.customer} value={meta.customerName} />
                <DetailRow label={labels.address} value={meta.address} />
                <DetailRow label={labels.cleaners} value={meta.cleaners?.length ? meta.cleaners.join(", ") : undefined} />
                <DetailRow label={labels.status} value={formatLabel(status)} />
                <DetailRow label={labels.payment} value={formatLabel(meta.paymentStatus)} />
                <DetailRow
                    label={labels.quoted}
                    value={
                        meta.quotedPriceCents != null ? formatMoney(meta.quotedPriceCents) : undefined
                    }
                />
                {meta.cancelReason && <DetailRow label={labels.cancelReason} value={meta.cancelReason} />}
            </>
        );
    }

    return (
        <>
            <DetailRow label={labels.service} value={meta.serviceName} />
            <DetailRow label={labels.customer} value={meta.customerName} />
            <DetailRow label={labels.frequency} value={formatLabel(meta.frequency)} />
            <DetailRow label={labels.startTime} value={meta.startTime} />
            <DetailRow label={labels.nextRun} value={formatDateTime(meta.nextRunDate, locale)} />
            <DetailRow label={labels.status} value={formatLabel(status)} />
        </>
    );
}

const Calendar: React.FC = () => {
    const t = useTranslations("Dashboard.calendar");
    const tc = useTranslations("Dashboard.common");
    const locale = useLocale();
    const calendarRef = useRef<FullCalendar>(null);
    const { isOpen, openModal, closeModal } = useModal();

    const [selectedEvent, setSelectedEvent] = useState<BackendCalendarEvent | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { user } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (user === null) router.replace("/");
    }, [user, router]);

    const [activeTypes, setActiveTypes] = useState<Set<CalendarEventType>>(
        new Set(ALL_EVENT_TYPES)
    );

    const handleEventsLoad = useCallback(
        async (
            fetchInfo: { startStr: string; endStr: string },
            successCallback: (events: object[]) => void,
            failureCallback: (err: Error) => void
        ) => {
            setLoadError(null);
            try {
                const events = await fetchCalendarEvents({
                    from: fetchInfo.startStr,
                    to: fetchInfo.endStr,
                    types:
                        activeTypes.size === ALL_EVENT_TYPES.length
                            ? undefined
                            : [...activeTypes],
                });

                const formatted = events.map((e) => ({
                    id: e.id,
                    title: e.title,
                    start: e.start,
                    end: e.end ?? undefined,
                    allDay: e.allDay,
                    backgroundColor: e.color,
                    borderColor: e.color,
                    textColor: "#ffffff",
                    extendedProps: {
                        type: e.type,
                        status: e.status,
                        meta: e.meta,
                        resourceId: e.resourceId,
                        businessId: e.businessId,
                        raw: e,
                    },
                }));

                successCallback(formatted);
            } catch (err) {
                const message = err instanceof Error ? err.message : t("loadFailed");
                setLoadError(message);
                failureCallback(err instanceof Error ? err : new Error(message));
            }
        },
        [activeTypes, t]
    );

    const handleEventClick = (clickInfo: EventClickArg) => {
        const raw = clickInfo.event.extendedProps.raw as BackendCalendarEvent;
        if (raw) {
            setSelectedEvent(raw);
            openModal();
        }
    };

    const toggleType = (type: CalendarEventType) => {
        setActiveTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                if (next.size > 1) next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
        calendarRef.current?.getApi().refetchEvents();
    };

    const handleCloseModal = () => {
        closeModal();
        setSelectedEvent(null);
    };

    const typeConfig = selectedEvent ? EVENT_TYPE_CONFIG[selectedEvent.type] : null;

    return (
        <div className="space-y-4 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
              <CalendarSync />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("show")}:
          </span>
                    {ALL_EVENT_TYPES.map((type) => {
                        const cfg = EVENT_TYPE_CONFIG[type];
                        const enabled = activeTypes.has(type);
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleType(type)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                    enabled
                                        ? `${cfg.badgeClass} border-transparent`
                                        : "border-gray-300 bg-transparent text-gray-400 dark:border-gray-700 dark:text-gray-600",
                                ].join(" ")}
                            >
                                {t(`eventTypes.${cfg.label}`)}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTypes(new Set(ALL_EVENT_TYPES));
                            calendarRef.current?.getApi().refetchEvents();
                        }}
                        className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        {t("reset")}
                    </button>
                </div>
            </div>

            {loadError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {t("loadEventsFailed", { error: loadError })}
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="custom-calendar">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={locale === "nl" ? nlLocale : "en"}
                        buttonText={{
                            today: t("today"),
                            month: t("month"),
                            week: t("week"),
                            day: t("day"),
                        }}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        events={handleEventsLoad}
                        eventClick={handleEventClick}
                        eventContent={renderEventContent}
                        loading={(isLoading) => {
                            const el = document.querySelector(".fc-view-harness") as HTMLElement | null;
                            if (el) el.style.opacity = isLoading ? "0.6" : "1";
                        }}
                        height="auto"
                        selectable={false}
                        dayMaxEvents={4}
                        moreLinkContent={(args) => t("moreCount", { count: args.num })}
                    />
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[640px] p-6 lg:p-8">
                {selectedEvent && typeConfig ? (
                    <div className="custom-scrollbar flex max-h-[80vh] flex-col gap-5 overflow-y-auto">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeConfig.badgeClass}`}
                >
                  {t(`eventTypes.${typeConfig.label}`)}
                </span>
                                <h2 className="break-words text-lg font-semibold leading-snug text-gray-800 dark:text-white/90">
                                    {selectedEvent.title}
                                </h2>
                                {selectedEvent.start && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDateTime(selectedEvent.start, locale)}
                                        {selectedEvent.end && !selectedEvent.allDay && (
                                            <> — {formatDateTime(selectedEvent.end, locale)}</>
                                        )}
                                    </p>
                                )}
                            </div>
                            <div
                                className="mt-1 h-4 w-4 flex-shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900"
                                style={{ backgroundColor: selectedEvent.color }}
                            />
                        </div>

                        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-800">
                            <EventDetailRows
                                event={selectedEvent}
                                locale={locale}
                                labels={{
                                    service: t("details.service"),
                                    customer: t("details.customer"),
                                    address: t("details.address"),
                                    cleaners: t("details.cleaners"),
                                    status: t("details.status"),
                                    payment: t("details.payment"),
                                    quoted: t("details.quoted"),
                                    cancelReason: t("details.cancelReason"),
                                    frequency: t("details.frequency"),
                                    startTime: t("details.startTime"),
                                    nextRun: t("details.nextRun"),
                                }}
                            />
                        </div>

                        <p className="break-all font-mono text-xs text-gray-400 dark:text-gray-600">
                            ID: {selectedEvent.resourceId}
                        </p>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {tc("close")}
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

const renderEventContent = (eventInfo: EventContentArg) => {
    const type = eventInfo.event.extendedProps.type as CalendarEventType;
    const icon = type === "RECURRING" ? "↻" : "🧹";

    return (
        <div
            className="flex w-full items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: eventInfo.event.backgroundColor ?? "#3b82f6" }}
            title={eventInfo.event.title}
        >
      <span className="flex-shrink-0 leading-none" style={{ fontSize: "10px" }}>
        {icon}
      </span>
            {eventInfo.timeText && (
                <span className="flex-shrink-0 text-[10px] opacity-80">{eventInfo.timeText}</span>
            )}
            <span className="truncate">{eventInfo.event.title}</span>
        </div>
    );
};

export default Calendar;