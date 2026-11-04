/**
 * Links to the storefront's own pages.
 *
 * Lady Greener is one business and src/proxy.ts serves its storefront at the
 * site root (/ and /portal). Links must therefore be the clean form: a link to
 * "/{slug}/portal" is answered with a 307 redirect to "/portal" on every click.
 * The booking widget is the one real top-level route that still carries the
 * slug (/book-now/{slug}); the API ignores the value.
 *
 * Kept as a hook with the old signature so the components that call it need no
 * changes.
 */
export function useTenantPaths(slug: string) {
  return {
    home: "/",
    portal: "/portal",
    // Written out, not built as `${home}/terms`: home is "/", which would give
    // "//terms", a protocol-relative URL that points at a host called "terms".
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    book: `/book-now/${encodeURIComponent(slug)}`,
  };
}
