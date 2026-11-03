/**
 * Colour helpers for tenant branding. Businesses pick arbitrary hex colours,
 * so anything drawn on top of them has to be checked for legibility.
 */

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) – 1 (white). Unparseable colours count as dark. */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Dark or light text, whichever reads better on `bg`. */
export function readableTextOn(bg: string, dark = "#171B1A", light = "#FFFFFF"): string {
  return contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark;
}

/**
 * A brand colour that is safe to put WHITE text on (>= 4.5:1). Pale tenant
 * colours are darkened towards black until they pass; invalid input falls back.
 */
export function brandForWhiteText(hex: string | null | undefined, fallback = "#0B352A"): string {
  if (!hex || !parseHex(hex)) return fallback;
  if (contrastRatio(hex, "#FFFFFF") >= 4.5) return hex.startsWith("#") ? hex : `#${hex}`;
  const rgb = parseHex(hex)!;
  for (let k = 0.9; k > 0; k -= 0.1) {
    const next = `#${rgb
      .map((v) => Math.round(v * k).toString(16).padStart(2, "0"))
      .join("")}`;
    if (contrastRatio(next, "#FFFFFF") >= 4.5) return next;
  }
  return "#000000";
}

/**
 * CSS variables that re-point the dashboard's `brand-*` Tailwind scale at a
 * tenant colour, so a subtree built from `bg-brand-500` etc. (the customer
 * portal) takes on the business's branding without touching every class.
 */
export function brandScaleVars(primary: string): Record<string, string> {
  const base = brandForWhiteText(primary);
  const mix = (pct: number, other: "white" | "black") =>
    `color-mix(in srgb, ${base} ${pct}%, ${other})`;
  return {
    "--color-brand-25": mix(5, "white"),
    "--color-brand-50": mix(10, "white"),
    "--color-brand-100": mix(20, "white"),
    "--color-brand-200": mix(35, "white"),
    "--color-brand-300": mix(55, "white"),
    "--color-brand-400": mix(78, "white"),
    "--color-brand-500": base,
    "--color-brand-600": mix(86, "black"),
    "--color-brand-700": mix(72, "black"),
    "--color-brand-800": mix(58, "black"),
    "--color-brand-900": mix(45, "black"),
    "--color-brand-950": mix(30, "black"),
  };
}
