/**
 * Hosts next/image may optimise: the storage CDN business uploads are served
 * from, plus any extras in NEXT_PUBLIC_IMAGE_HOSTS (comma-separated, for
 * example the non-CDN Spaces endpoint). Shared by next.config.ts and
 * <SiteImage/> so the allow-list and the component never disagree: a host not
 * listed here is rendered as a plain <img>, which can never throw.
 */
function toHost(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).host.toLowerCase();
  } catch {
    return null;
  }
}

export function optimizableHosts(): string[] {
  const raw = [process.env.NEXT_PUBLIC_DO_SPACES_CDN || "", ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS || "").split(",")];
  return [...new Set(raw.map(toHost).filter((h): h is string => !!h))];
}
