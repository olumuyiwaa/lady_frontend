"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {authFetch} from "@/app/api/authFetch";

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: unknown;
  isRead: boolean;
  readAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  return "Something went wrong.";
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return formatter.format(diffInSeconds, "second");

  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) return formatter.format(diffInMinutes, "minute");

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) return formatter.format(diffInHours, "hour");

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) return formatter.format(diffInDays, "day");

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}

function getNotificationHref(notification: NotificationItem) {
  switch (notification.type) {
    case "CREDENTIAL_APPROVED":
    case "CREDENTIAL_REJECTED":
    case "CREDENTIAL_EXPIRY":
      return "/credential-management";

    case "SHIFT_ALERT":
    case "BOOKING_CONFIRMATION":
    case "SHIFT_CANCELLED":
    case "ASSIGNMENT_UPDATE":
      return "/shifts";

    case "PAYMENT_ALERT":
      return "/";

    case "NEW_MESSAGE":
      return "/";

    case "SYSTEM_ALERT":
    default:
      return "/notifications";
  }
}

function getNotificationIconClass(type: string) {
  switch (type) {
    case "CREDENTIAL_APPROVED":
    case "BOOKING_CONFIRMATION":
      return "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300";

    case "CREDENTIAL_REJECTED":
    case "SHIFT_CANCELLED":
      return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300";

    case "CREDENTIAL_EXPIRY":
    case "PAYMENT_ALERT":
      return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300";

    case "NEW_MESSAGE":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300";

    default:
      return "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300";
  }
}

function NotificationIcon({ type }: { type: string }) {
  return (
      <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getNotificationIconClass(
              type,
          )}`}
      >
      <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
      >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 1.875C6.54822 1.875 3.75 4.67322 3.75 8.125V11.25L2.71967 12.2803C2.54018 12.4598 2.48648 12.7298 2.58361 12.9642C2.68074 13.1986 2.90957 13.3516 3.16341 13.3516H16.8366C17.0904 13.3516 17.3193 13.1986 17.4164 12.9642C17.5135 12.7298 17.4598 12.4598 17.2803 12.2803L16.25 11.25V8.125C16.25 4.67322 13.4518 1.875 10 1.875ZM5 8.125C5 5.36358 7.23858 3.125 10 3.125C12.7614 3.125 15 5.36358 15 8.125V11.5089C15 11.6747 15.0658 11.8337 15.1831 11.9509L15.3338 12.1016H4.66619L4.81694 11.9509C4.93415 11.8337 5 11.6747 5 11.5089V8.125ZM7.9375 15.1562C7.59232 15.1562 7.3125 15.4361 7.3125 15.7812C7.3125 16.1264 7.59232 16.4062 7.9375 16.4062H12.0625C12.4077 16.4062 12.6875 16.1264 12.6875 15.7812C12.6875 15.4361 12.4077 15.1562 12.0625 15.1562H7.9375Z"
            fill="currentColor"
        />
      </svg>
    </span>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [error, setError] = useState("");

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await authFetch(
          `/notifications?page=1&limit=1&unreadOnly=true`,
          {
            method: "GET",
          }
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to load unread notifications.");
      }

      setUnreadCount(result.pagination?.total || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authFetch(
          `/notifications?page=1&limit=10`,
          {
            method: "GET",
          }
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to load notifications.");
      }

      setNotifications(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const interval = window.setInterval(() => {
      fetchUnreadCount();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [fetchUnreadCount]);

  function toggleDropdown() {
    setIsOpen((previous) => {
      const next = !previous;

      if (next) {
        fetchNotifications();
        fetchUnreadCount();
      }

      return next;
    });
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      const result = await authFetch(
          `/notifications/${notificationId}/read`,
          {
            method: "PATCH",
          }
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to mark notification as read.");
      }

      setNotifications((previous) =>
          previous.map((notification) =>
              notification.id === notificationId
                  ? {
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                  : notification,
          ),
      );

      await fetchUnreadCount();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function markAllAsRead() {
    setIsMarkingAllRead(true);
    setError("");

    try {
      const result = await authFetch(
          `/notifications/read-all`,
          {
            method: "PATCH",
          }
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to mark notifications as read.");
      }

      setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || new Date().toISOString(),
          })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  return (
      <div className="relative">
        <button
            className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            onClick={toggleDropdown}
            type="button"
            aria-label="Notifications"
        >
          {unreadCount > 0 ? (
              <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
          </span>
          ) : null}

          <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
          >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                fill="currentColor"
            />
          </svg>
        </button>

        <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
        >
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
            <div>
              <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Notifications
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                  <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={isMarkingAllRead}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMarkingAllRead ? "Saving..." : "Read all"}
                  </button>
              ) : null}

              <button
                  onClick={toggleDropdown}
                  className="dropdown-toggle text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  type="button"
                  aria-label="Close notifications"
              >
                <svg
                    className="fill-current"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                      fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          {error ? (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
          ) : null}

          <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
            {isLoading ? (
                <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading notifications...
                </li>
            ) : notifications.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet.
                </li>
            ) : (
                notifications.map((notification) => (
                    <li key={notification.id}>
                      <DropdownItem
                          href={getNotificationHref(notification)}
                          onItemClick={() => {
                            if (!notification.isRead) {
                              markNotificationAsRead(notification.id);
                            }

                            closeDropdown();
                          }}
                          className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                              !notification.isRead ? "bg-brand-50/50 dark:bg-brand-500/5" : ""
                          }`}
                      >
                        <NotificationIcon type={notification.type} />

                        <span className="block min-w-0">
                    <span className="mb-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2">
                        {notification.body}
                      </span>
                    </span>

                    <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      <span>{formatNotificationType(notification.type)}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400" />
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                      {!notification.isRead ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-gray-400" />
                            <span className="font-medium text-brand-500">Unread</span>
                          </>
                      ) : null}
                    </span>
                  </span>
                      </DropdownItem>
                    </li>
                ))
            )}
          </ul>

          <Link
              href="/notifications"
              onClick={closeDropdown}
              className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            View All Notifications
            {pagination?.total ? ` (${pagination.total})` : ""}
          </Link>
        </Dropdown>
      </div>
  );
}