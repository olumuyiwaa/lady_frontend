import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeFilterCount,
  activePreset,
  pickCurrency,
  presetRange,
  signedCents,
  toDateInput,
  toQuery,
  type TransactionSummary,
} from "../../src/lib/transactionFilters.ts";

// A fixed "today" so date maths never depends on when the tests run.
const TODAY = new Date(2026, 6, 15); // Wed 15 July 2026 (local)

test("toQuery sends only what is set, with arrays as comma lists", () => {
  assert.equal(toQuery({}), "");
  assert.equal(toQuery({ type: ["DEPOSIT", "TIP"], status: ["FAILED"], direction: "IN", q: "  anna ", page: 2, limit: 25 }),
    "?type=DEPOSIT%2CTIP&direction=IN&status=FAILED&q=anna&page=2&limit=25");
});

test("toQuery drops empty strings, empty arrays and blank search", () => {
  assert.equal(toQuery({ type: [], from: "", to: "", q: "   ", businessId: "" }), "");
});

test("toQuery leaves paging out when asked, so a summary or export covers the whole set", () => {
  const q = toQuery({ from: "2026-07-01", page: 3, limit: 50 }, { paging: false });
  assert.equal(q, "?from=2026-07-01");
});

test("toQuery does not let a search term break out of the query string", () => {
  const q = toQuery({ q: "a&businessId=other#x" });
  const parsed = new URLSearchParams(q);
  assert.equal(parsed.get("q"), "a&businessId=other#x");
  assert.equal(parsed.get("businessId"), null);
});

test("dates are written as local YYYY-MM-DD with zero padding", () => {
  assert.equal(toDateInput(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(toDateInput(new Date(2026, 11, 31)), "2026-12-31");
});

test("quick ranges are inclusive and end today (or at month end for last month)", () => {
  assert.deepEqual(presetRange("last7", TODAY), { from: "2026-07-09", to: "2026-07-15" }); // 7 days including today
  assert.deepEqual(presetRange("last30", TODAY), { from: "2026-06-16", to: "2026-07-15" });
  assert.deepEqual(presetRange("thisMonth", TODAY), { from: "2026-07-01", to: "2026-07-15" });
  assert.deepEqual(presetRange("lastMonth", TODAY), { from: "2026-06-01", to: "2026-06-30" });
  assert.deepEqual(presetRange("thisYear", TODAY), { from: "2026-01-01", to: "2026-07-15" });
  assert.deepEqual(presetRange("all", TODAY), { from: "", to: "" });
});

test("last month works across a year boundary and in a short February", () => {
  assert.deepEqual(presetRange("lastMonth", new Date(2026, 0, 10)), { from: "2025-12-01", to: "2025-12-31" });
  assert.deepEqual(presetRange("lastMonth", new Date(2026, 2, 10)), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepEqual(presetRange("lastMonth", new Date(2028, 2, 10)), { from: "2028-02-01", to: "2028-02-29" }); // leap year
});

test("last 7 and 30 days cross month and year boundaries correctly", () => {
  assert.deepEqual(presetRange("last7", new Date(2026, 0, 3)), { from: "2025-12-28", to: "2026-01-03" });
  assert.deepEqual(presetRange("last30", new Date(2026, 2, 1)), { from: "2026-01-31", to: "2026-03-01" });
});

test("the matching quick-range button is recognised, and a custom range matches none", () => {
  assert.equal(activePreset("2026-07-01", "2026-07-15", TODAY), "thisMonth");
  assert.equal(activePreset("", "", TODAY), "all");
  assert.equal(activePreset("2026-07-02", "2026-07-15", TODAY), null);
});

test("when two quick ranges are the same dates, the button the user pressed stays the selected one", () => {
  const seventh = new Date(2026, 9, 7); // 7 Oct: "Last 7 days" and "This month" are both 1-7 Oct
  const a = presetRange("last7", seventh);
  const b = presetRange("thisMonth", seventh);
  assert.deepEqual(a, b, "the ambiguity this test is about");
  assert.equal(activePreset(b.from, b.to, seventh, "thisMonth"), "thisMonth");
  assert.equal(activePreset(a.from, a.to, seventh, "last7"), "last7");
  assert.equal(activePreset(b.from, b.to, seventh), "last7"); // nothing pressed: first match, as before

  const newYear = new Date(2026, 0, 1); // 1 Jan: "This month" and "This year" are the same single day
  const y = presetRange("thisYear", newYear);
  assert.equal(activePreset(y.from, y.to, newYear, "thisYear"), "thisYear");
});

test("a pressed button no longer applies once the dates were changed by hand", () => {
  const seventh = new Date(2026, 9, 7);
  assert.equal(activePreset("2026-10-02", "2026-10-07", seventh, "thisMonth"), null);
});

test("money out is negative, money in is positive", () => {
  assert.equal(signedCents({ direction: "IN", amountCents: 2050 }), 2050);
  assert.equal(signedCents({ direction: "OUT", amountCents: 1000 }), -1000);
});

const summary = (...codes: string[]): TransactionSummary => ({
  byCurrency: codes.map((currency) => ({ currency, inCents: 0, outCents: 0, netCents: 0, pendingOutCents: 0, count: 0, failedCount: 0, byType: {} })),
});

test("the chosen currency is kept while it still exists, otherwise the first is used", () => {
  assert.equal(pickCurrency(summary("EUR", "GBP"), "GBP"), "GBP");
  assert.equal(pickCurrency(summary("EUR", "GBP"), "USD"), "EUR");
  assert.equal(pickCurrency(summary("EUR"), null), "EUR");
  assert.equal(pickCurrency(summary(), "EUR"), null);
  assert.equal(pickCurrency(null, "EUR"), null);
});

test("the filter badge counts each narrowing filter once, a date range as one", () => {
  assert.equal(activeFilterCount({}), 0);
  assert.equal(activeFilterCount({ page: 4, limit: 25, sort: "amountCents", order: "asc" }), 0); // paging is not a filter
  assert.equal(activeFilterCount({ type: ["TIP"], from: "2026-01-01", to: "2026-02-01", q: "x" }), 3);
  assert.equal(activeFilterCount({ type: [], q: "  " }), 0);
  assert.equal(activeFilterCount({ direction: "OUT", status: ["FAILED"], method: ["CASH"], businessId: "b1" }), 4);
});
