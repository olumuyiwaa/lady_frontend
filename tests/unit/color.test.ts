import { test } from "node:test";
import assert from "node:assert/strict";
import { brandForWhiteText, brandScaleVars, contrastRatio, readableTextOn } from "../../src/lib/color.ts";

test("contrast ratio of black on white is 21", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
});

test("a pale tenant colour is darkened until white text is readable", () => {
  const safe = brandForWhiteText("#FFE066");
  assert.ok(contrastRatio(safe, "#FFFFFF") >= 4.5, `${safe} is too light for white text`);
});

test("a colour that already works is kept as-is", () => {
  assert.equal(brandForWhiteText("#0B352A"), "#0B352A");
});

test("invalid or missing colours fall back instead of breaking the page", () => {
  assert.equal(brandForWhiteText("not-a-colour"), "#0B352A");
  assert.equal(brandForWhiteText(null), "#0B352A");
  assert.equal(brandForWhiteText(undefined, "#123456"), "#123456");
});

test("readableTextOn picks the side with more contrast", () => {
  assert.equal(readableTextOn("#0B352A"), "#FFFFFF");
  assert.equal(readableTextOn("#FFE066"), "#171B1A");
});

test("brandScaleVars re-points the whole brand scale at the tenant colour", () => {
  const vars = brandScaleVars("#FFE066");
  assert.equal(Object.keys(vars).length, 12);
  assert.ok(contrastRatio(vars["--color-brand-500"], "#FFFFFF") >= 4.5);
});
