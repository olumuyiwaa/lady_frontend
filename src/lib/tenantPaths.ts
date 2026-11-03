"use client";

import { useSyncExternalStore } from "react";

/**
 * Tenant storefronts are reachable two ways:
 *   - app host, path based:   app.example.com/acme/portal
 *   - tenant host (subdomain or custom domain): acme.example.nl/portal
 *
 * proxy.ts redirects "/acme/portal" to "/portal" on a tenant host, so
 * hard-coding "/{slug}/portal" costs every click an extra 307 (and a full
 * page load when written as <a>). This hook returns links that are already
 * correct for the host the visitor is on.
 *
 * The server renders the path-based form; the browser snapshot takes over
 * after hydration.
 */
const APP_HOSTS = (process.env.NEXT_PUBLIC_APP_HOSTS || "localhost:3000")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const subscribe = () => () => {};
const isTenantHost = () => !APP_HOSTS.includes(window.location.host.toLowerCase());
// Server and first hydration pass use the path-based form (false); the client
// snapshot takes over afterwards, so there is no hydration mismatch.
const serverSnapshot = () => false;

export function useTenantPaths(slug: string) {
  const onTenantHost = useSyncExternalStore(subscribe, isTenantHost, serverSnapshot);

  const base = onTenantHost ? "" : `/${encodeURIComponent(slug)}`;
  return {
    home: base || "/",
    portal: `${base}/portal`,
    /** /book-now is a real top-level route on every host. */
    book: `/book-now/${encodeURIComponent(slug)}`,
  };
}
