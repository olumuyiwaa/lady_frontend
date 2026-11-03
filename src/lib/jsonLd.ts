/**
 * Serialises JSON-LD for a <script type="application/ld+json"> tag.
 *
 * JSON.stringify does not escape "<", so a value containing "</script><script>…"
 * ends the tag and runs arbitrary script. The FAQ answers on a public business
 * site are typed by the business owner, and public sites are served from the
 * same origin as the dashboard (which keeps session tokens in localStorage), so
 * this was a stored-XSS path from any tenant to any logged-in visitor. Escaping
 * "<", ">", "&" and the JS line separators keeps the payload valid JSON while
 * making it impossible to break out of the script element.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
