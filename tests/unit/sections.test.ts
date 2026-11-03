import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSectionOrder } from "../../src/lib/sections.ts";

test("no saved order gives the default order", () => {
  assert.deepEqual(resolveSectionOrder(undefined), ["about", "testimonials", "gallery", "faq"]);
  assert.deepEqual(resolveSectionOrder([]), ["about", "testimonials", "gallery", "faq"]);
});

test("a saved order is respected", () => {
  assert.deepEqual(resolveSectionOrder(["faq", "about", "gallery", "testimonials"]), ["faq", "about", "gallery", "testimonials"]);
});

test("a section missing from the saved order is appended, not lost", () => {
  assert.deepEqual(resolveSectionOrder(["faq"]), ["faq", "about", "testimonials", "gallery"]);
});

test("duplicates and unknown keys are dropped", () => {
  const messy = ["faq", "faq", "bogus", "about"] as unknown as Parameters<typeof resolveSectionOrder>[0];
  assert.deepEqual(resolveSectionOrder(messy), ["faq", "about", "testimonials", "gallery"]);
});
