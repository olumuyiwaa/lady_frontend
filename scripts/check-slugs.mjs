/**
 * check-slugs.mjs
 *
 * Verifies that NEXT_PUBLIC_BUSINESS_SLUG does not collide with a real
 * top-level Next.js route segment. If it did, the proxy middleware would
 * rewrite "/" → "/{slug}" correctly, but a direct hit to "/{slug}/anything"
 * would be ambiguous and the real route would win.
 *
 * Run via: npm run check:slugs
 * Also executed by CI before the build step.
 */

import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "../src/app");

// Read the top-level entries of src/app and derive real route segments.
// Route groups like (dashboard) are not URL segments — skip them.
// Dynamic segments like [subdomain] are not fixed slugs — skip them.
const entries = await readdir(APP_DIR, { withFileTypes: true });
const reservedSegments = entries
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => !name.startsWith("(") && !name.startsWith("["));

const slug = (process.env.NEXT_PUBLIC_BUSINESS_SLUG || "").trim().toLowerCase();

if (!slug) {
  console.error("ERROR: NEXT_PUBLIC_BUSINESS_SLUG is not set.");
  process.exit(1);
}

if (reservedSegments.includes(slug)) {
  console.error(
    `ERROR: NEXT_PUBLIC_BUSINESS_SLUG "${slug}" collides with the real Next.js route /${slug}/.`
  );
  console.error(`Reserved segments: ${reservedSegments.join(", ")}`);
  console.error("Choose a slug that does not match any top-level app directory.");
  process.exit(1);
}

console.log(
  `✓ Slug "${slug}" is safe — no collision with reserved segments: ${reservedSegments.join(", ")}`
);
