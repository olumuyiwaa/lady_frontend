"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile challenge for the public booking form and waitlist.
 * The API (POST /widget/.../bookings, /waitlist) requires a valid token once
 * TURNSTILE_SECRET_KEY is configured on the server; without it anyone can
 * script the endpoint and make Tod Cleaning Services send SMS/e-mail to arbitrary numbers.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (local dev),
 * matching the server, which then skips the check. Tokens are single-use, so
 * bump `resetKey` after every submit attempt to get a fresh challenge.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the verification challenge"));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

type Props = {
  onToken: (token: string | null) => void;
  resetKey?: number;
};

export function Turnstile({ onToken, resetKey = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  // Keep the latest callback without re-rendering the challenge (updated in an effect, not during render).
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}
