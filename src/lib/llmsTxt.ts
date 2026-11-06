import type { StorefrontResponse } from "../app/api/widget.api.ts";
import { localizedPath } from "./localePath.ts";

const clean = (s: string | null | undefined, max = 240) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/**
 * /llms.txt: a short markdown summary for AI assistants and crawlers, built
 * from the same storefront data as the site so it never drifts from it. Only
 * public facts; per-m²/room/hour prices are shown as "from" rates, never as a
 * fixed price.
 */
export function buildLlmsTxt(data: StorefrontResponse, origin: string): string {
  const b = data.business;
  const lines: string[] = [`# ${b.name}`, ""];
  const about = clean(b.branding?.tagline) || clean(b.branding?.aboutBody);
  if (about) lines.push(`> ${about}`, "");

  const services = (data.services || []).filter((s) => s.isActive !== false);
  if (services.length) {
    lines.push("## Services", "");
    const cur = (b.currency || "eur").toUpperCase();
    const money = (cents: number) => new Intl.NumberFormat("en", { style: "currency", currency: cur }).format(cents / 100);
    const unit: Record<string, string> = { FLAT: "", PER_SQFT: " per m²", PER_ROOM: " per room", HOURLY: " per hour" };
    for (const s of services) {
      const price = s.basePriceCents > 0 ? ` (${s.pricingModel === "FLAT" ? "" : "from "}${money(s.basePriceCents)}${unit[s.pricingModel] || ""})` : "";
      const d = clean(s.description, 160);
      lines.push(`- ${s.name}${price}${d ? `: ${d}` : ""}`);
    }
    lines.push("");
  }

  const a = b.legal?.address;
  const contact: string[] = [];
  if (b.phone) contact.push(`- Phone: ${b.phone}`);
  if (a) contact.push(`- Address: ${[a.line1, `${a.postalCode} ${a.city}`.trim(), a.country].filter(Boolean).join(", ")}`);
  if (b.legal?.kvkNumber) contact.push(`- KvK: ${b.legal.kvkNumber}`);
  if (contact.length) lines.push("## Contact", "", ...contact, "");

  lines.push(
    "## Pages",
    "",
    `- [Home (English)](${origin}${localizedPath("en", "/")})`,
    `- [Home (Nederlands)](${origin}${localizedPath("nl", "/")})`,
    `- [Terms and conditions](${origin}${localizedPath("en", "/terms")})`,
    `- [Privacy policy](${origin}${localizedPath("en", "/privacy")})`,
    ""
  );
  return lines.join("\n");
}
