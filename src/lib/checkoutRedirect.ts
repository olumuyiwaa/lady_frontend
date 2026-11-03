/**
 * Sends the customer to Stripe Checkout.
 *
 * The booking widget is normally embedded in a business's own website through
 * an <iframe> (public/embed.js). Stripe Checkout refuses to render inside a
 * frame, so `window.location.href = checkoutUrl` from within the iframe just
 * produced a blank/blocked frame after the customer had already booked. When
 * embedded, ask the host page (embed.js) to navigate the whole tab instead; if
 * it does not answer (an old embed script, or a custom integration) open the
 * checkout in a new tab.
 */
const ACK_TIMEOUT_MS = 700;

export function redirectToCheckout(url: string): void {
  if (typeof window === "undefined") return;

  const embedded = window.self !== window.top;
  if (!embedded) {
    window.location.assign(url);
    return;
  }

  let acked = false;
  const onMessage = (event: MessageEvent) => {
    const data = event.data as { source?: string; type?: string } | null;
    if (event.source === window.parent && data?.source === "cleansera-embed" && data.type === "redirect-ack") {
      acked = true;
    }
  };
  window.addEventListener("message", onMessage);

  window.parent.postMessage({ source: "cleansera-widget", type: "redirect", url }, "*");

  window.setTimeout(() => {
    window.removeEventListener("message", onMessage);
    if (acked) return; // the host page is navigating the tab
    const opened = window.open(url, "_blank", "noopener");
    // Popup blocked as well: last resort, at least the customer sees the URL fail visibly.
    if (!opened) window.location.assign(url);
  }, ACK_TIMEOUT_MS);
}
