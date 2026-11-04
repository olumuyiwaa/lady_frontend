/**
 * Links to the storefront's own pages.
 *
 * Tod Cleaning Services is one business and src/proxy.ts serves its storefront at the
 * site root (/ and /portal). Booking is handled entirely via the modal on the
 * storefront; there is no standalone /book-now route. The `book` path therefore
 * returns visitors to the home page where they can open the modal.
 *
 * Kept as a hook with the old signature so the components that call it need no
 * changes.
 */
export function useTenantPaths(_slug: string) {
  return {
    home: "/",
    portal: "/portal",
    // Written out, not built as `${home}/terms`: home is "/", which would give
    // "//terms", a protocol-relative URL that points at a host called "terms".
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    /** Portal "Book Again" links point here. On the storefront the modal is used instead. */
    book: "/",
  };
}
