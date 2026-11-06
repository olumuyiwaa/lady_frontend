import { test } from "node:test";
import assert from "node:assert/strict";
import { splitLocalePrefix, localizedPath, languageAlternates } from "../../src/lib/localePath.ts";
import { buildLlmsTxt } from "../../src/lib/llmsTxt.ts";

test("language prefixes are recognised only on localised public pages", () => {
  assert.deepEqual(splitLocalePrefix("/nl"), { locale: "nl", path: "/" });
  assert.deepEqual(splitLocalePrefix("/en/"), { locale: "en", path: "/" });
  assert.deepEqual(splitLocalePrefix("/nl/terms"), { locale: "nl", path: "/terms" });
  assert.deepEqual(splitLocalePrefix("/en/privacy/"), { locale: "en", path: "/privacy" });
  for (const p of ["/nl/dashboard", "/en/portal", "/fr", "/fr/terms", "/terms", "/", "/nlx", "/nl/terms/extra"]) {
    assert.deepEqual(splitLocalePrefix(p), { locale: null, path: p }, p);
  }
});

test("localizedPath builds prefixed URLs", () => {
  assert.equal(localizedPath("nl", "/"), "/nl");
  assert.equal(localizedPath("en", "/terms"), "/en/terms");
  assert.equal(localizedPath("en", "/terms/"), "/en/terms");
});

test("hreflang map: x-default only for the home page", () => {
  assert.deepEqual(languageAlternates("/"), { en: "/en", nl: "/nl", "x-default": "/" });
  assert.deepEqual(languageAlternates("/terms"), { en: "/en/terms", nl: "/nl/terms" });
});

test("llms.txt lists services, contact and pages without inventing prices", () => {
  const txt = buildLlmsTxt(
    {
      business: { id: "1", name: "Tod Cleaning", phone: "+31 20 123", currency: "eur", branding: { tagline: "Spotless homes" }, legal: { kvkNumber: "123", vatNumber: null, address: { line1: "Dam 1", postalCode: "1012 JS", city: "Amsterdam" } } },
      services: [
        { id: "a", name: "Standard clean", description: "Regular clean", pricingModel: "FLAT", basePriceCents: 8000, estimatedMinutes: 120, isActive: true, addOns: [] },
        { id: "b", name: "Deep clean", description: null, pricingModel: "HOURLY", basePriceCents: 3500, estimatedMinutes: 240, isActive: true, addOns: [] },
        { id: "c", name: "Hidden", description: null, pricingModel: "FLAT", basePriceCents: 1, estimatedMinutes: 60, isActive: false, addOns: [] },
      ],
    } as never,
    "https://todcleaning.nl"
  );
  assert.match(txt, /^# Tod Cleaning/);
  assert.match(txt, /> Spotless homes/);
  assert.match(txt, /- Standard clean \(.*80\.00\): Regular clean/);
  assert.match(txt, /Deep clean \(from .*35\.00 per hour\)/);
  assert.doesNotMatch(txt, /Hidden/);
  assert.match(txt, /Address: Dam 1, 1012 JS Amsterdam/);
  assert.match(txt, /\(https:\/\/todcleaning\.nl\/nl\)/);
});
