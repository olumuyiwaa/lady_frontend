/**
 * check-slugs.mjs
 *
 * Verifies that NEXT_PUBLIC_BUSINESS_SLUG does not collide with a real
 * top-level Next.js route segment (including ones inside route groups). If it
 * did, the proxy middleware would
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

// Collect the URL segments that exist at the top level of the site. Route
// groups such as (dashboard) are not URL segments themselves, but the folders
// inside them are (e.g. (dashboard)/dashboard -> /dashboard), so look through
// them. Dynamic segments ([subdomain]) and private folders (_x) are skipped.
async function topLevelSegments(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("(")) out.push(...(await topLevelSegments(join(dir, e.name))));
    else if (!e.name.startsWith("[") && !e.name.startsWith("_")) out.push(e.name);
  }
  return out;
}

const reservedSegments = [...new Set(await topLevelSegments(APP_DIR))].sort();

// Same default as src/proxy.ts and the [subdomain] layout, so the check
// validates what the app will actually use when the variable is not set.
const slug = (process.env.NEXT_PUBLIC_BUSINESS_SLUG || "ladygreener").trim().toLowerCase();

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
